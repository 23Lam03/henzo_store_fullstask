/**
 * PROXY & CACHE ẢNH TỪ WIKIMEDIA COMMONS.
 *
 * Vấn đề:
 *   Trang hiển thị hàng chục ảnh cùng lúc (24 thẻ khuyến mãi, 20 sản phẩm
 *   trên trang chủ...). Mỗi `<img>` gọi thẳng `thumb.wikimedia.org` ->
 *   Wikimedia trả `429 Too Many Requests` cho các request tới từ cùng IP
 *   trong thời gian ngắn -> ảnh vỡ trên giao diện.
 *
 * Cách sửa:
 *   Backend làm trung gian: tải ảnh về đĩa (cache), phục vụ lại cho mọi
 *   client. Lần đầu sẽ chậm (đi qua server), các lần sau cực nhanh và không
 *   bao giờ bị rate-limit.
 *
 *   - Cache trên đĩa: `storage/image-cache/<hash>.<ext>`
 *   - TTL mặc định 30 ngày (ảnh Commons hầu như không đổi).
 *   - Chỉ cho phép host Wikimedia (tránh SSRF về máy nội bộ).
 *   - Nếu Wikimedia lỗi (429/5xx) -> thử lại 2 lần rồi trả 502.
 */
import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, stat, unlink, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { config } from '../../config/env';
import { resolveFromRoot } from '../../config/paths';

/** Host được phép proxy (chỉ Wikimedia). */
const ALLOWED_HOSTS = [
  'upload.wikimedia.org',
  'thumb.wikimedia.org',
  'commons.wikimedia.org',
];

/** Thời gian sống của cache (30 ngày). */
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Hạn mức dung lượng cache (byte).
 *
 * Render free plan chỉ có ~1GB disk và cache ảnh Wikimedia lên tới
 * 361MB — nếu không giới hạn, service có thể hết disk và crash.
 * Mặc định 400MB, set `IMAGE_CACHE_MAX_BYTES=0` để tắt giới hạn.
 */
const CACHE_MAX_BYTES = (() => {
  const raw = Number.parseInt(process.env.IMAGE_CACHE_MAX_BYTES ?? '', 10);
  return Number.isFinite(raw) && raw >= 0 ? raw : 400 * 1024 * 1024;
})();

/** User-Agent định danh (Wikimedia yêu cầu UA rõ ràng). */
const USER_AGENT =
  'HenzoStore/1.0 (https://henzo.vn; image-proxy) node-fetch';

/**
 * Thư mục cache. */
function cacheRoot(): string {
  const dir = path.isAbsolute(config.IMAGE_CACHE_DIR)
    ? config.IMAGE_CACHE_DIR
    : resolveFromRoot(config.IMAGE_CACHE_DIR);
  if (!existsSync(dir)) mkdir(dir, { recursive: true });
  return dir;
}

/** Kiểm tra URL có an toàn để proxy không. */
export function isProxyableImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
    return ALLOWED_HOSTS.includes(parsed.hostname);
  } catch {
    return false;
  }
}

/** Đuôi file theo Content-Type. */
function extOf(contentType: string): string {
  if (contentType.includes('png')) return '.png';
  if (contentType.includes('webp')) return '.webp';
  if (contentType.includes('gif')) return '.gif';
  if (contentType.includes('svg')) return '.svg';
  if (contentType.includes('avif')) return '.avif';
  return '.jpg';
}

/** Chuẩn hoá Content-Type về MIME chuẩn (`.jpg` -> `image/jpeg`). */
function mimeOf(ext: string): string {
  switch (ext) {
    case '.png':
      return 'image/png';
    case '.webp':
      return 'image/webp';
    case '.gif':
      return 'image/gif';
    case '.svg':
      return 'image/svg+xml';
    case '.avif':
      return 'image/avif';
    default:
      return 'image/jpeg';
  }
}

/** Khoá cache theo URL (bỏ query UTM để cùng 1 ảnh dùng chung cache). */
function cacheKey(url: string): string {
  const cleaned = url.split('?')[0];
  return createHash('sha256').update(cleaned).digest('hex');
}

export interface CachedImage {
  body: Uint8Array;
  contentType: string;
  /** `true` nếu vừa tải từ upstream, `false` nếu lấy từ cache. */
  fetched: boolean;
}

/**
 * Hàng đợi tải ảnh — giới hạn số request đồng thời gọi Wikimedia.
 *
 * Vì sao cần: trang chủ hiển thị ~85 ảnh cùng lúc. Nếu gọi thẳng,
 * Wikimedia trả `429` cho phần lớn request. Hàng đợi giới hạn 4 request
 * đồng thời + khoảng nghỉ nhỏ giữa các lần -> không bị chặn.
 */
const MAX_CONCURRENT = 4;
const MIN_GAP_MS = 120;

let activeFetches = 0;
const waiting: (() => void)[] = [];
let lastFetchAt = 0;

/** Chờ tới lượt tải (giữ tối đa `MAX_CONCURRENT` request đồng thời). */
async function acquireSlot(): Promise<void> {
  if (activeFetches >= MAX_CONCURRENT) {
    await new Promise<void>((resolve) => waiting.push(resolve));
  }
  activeFetches++;

  // Giữ khoảng cách nhỏ giữa 2 lần gọi để không kích hoạt rate-limit.
  const wait = lastFetchAt + MIN_GAP_MS - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastFetchAt = Date.now();
}

function releaseSlot(): void {
  activeFetches--;
  const next = waiting.shift();
  if (next) next();
}

/**
 * Dọn cache khi vượt hạn mức dung lượng.
 *
 * Xoá file cũ nhất (theo mtime) cho tới khi nằm dưới `CACHE_MAX_BYTES`.
 * Render free plan có disk ~1GB — không giới hạn thì service sẽ crash
 * vì hết disk.
 */
async function enforceCacheQuota(): Promise<void> {
  if (CACHE_MAX_BYTES === 0) return;

  const root = cacheRoot();

  let files: { path: string; size: number; mtime: number }[] = [];
  try {
    const entries = await readdir(root);
    for (const name of entries) {
      const full = path.join(root, name);
      try {
        const info = await stat(full);
        if (!info.isFile()) continue;
        files.push({ path: full, size: info.size, mtime: info.mtimeMs });
      } catch {
        // File vừa bị xoá -> bỏ qua.
      }
    }
  } catch {
    return;
  }

  let total = files.reduce((sum, f) => sum + f.size, 0);
  if (total <= CACHE_MAX_BYTES) return;

  // Xoá từ file cũ nhất trở đi.
  files.sort((a, b) => a.mtime - b.mtime);

  for (const file of files) {
    if (total <= CACHE_MAX_BYTES) break;
    try {
      await unlink(file.path);
      total -= file.size;
    } catch {
      // Bỏ qua lỗi xoá.
    }
  }

  console.log(
    `[image-cache] Đã dọn cache: còn ${(total / 1024 / 1024).toFixed(1)}MB ` +
      `(hạn mức ${(CACHE_MAX_BYTES / 1024 / 1024).toFixed(0)}MB)`,
  );
}

/**
 * Lấy ảnh từ cache đĩa, nếu chưa có thì tải từ Wikimedia rồi lưu lại.
 */
export async function getCachedImage(url: string): Promise<CachedImage> {
  if (!isProxyableImageUrl(url)) {
    throw new Error('URL ảnh không được phép proxy');
  }

  const key = cacheKey(url);
  const root = cacheRoot();

  // Tìm file cache (thử các đuôi phổ biến).
  for (const ext of ['.jpg', '.png', '.webp', '.gif', '.svg', '.avif']) {
    const file = path.join(root, `${key}${ext}`);
    if (!existsSync(file)) continue;
    const info = await stat(file);
    if (Date.now() - info.mtimeMs > CACHE_TTL_MS) continue;
    return {
      body: new Uint8Array(await readFile(file)),
      contentType: mimeOf(ext),
      fetched: false,
    };
  }

  // Chưa có trong cache -> tải từ Wikimedia (retry khi bị 429).
  await acquireSlot();
  try {
    let lastError: unknown;
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        const res = await fetch(url, {
          headers: { 'User-Agent': USER_AGENT, Accept: 'image/*' },
          redirect: 'follow',
          signal: AbortSignal.timeout(25000),
        });

        if (res.status === 429) {
          await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
          continue;
        }
        if (!res.ok) {
          throw new Error(`Wikimedia trả về ${res.status}`);
        }

        const contentType = res.headers.get('content-type') ?? 'image/jpeg';
        const body = new Uint8Array(await res.arrayBuffer());

        const ext = extOf(contentType);
        const file = path.join(root, `${key}${ext}`);
        await writeFile(file, body);

        // Kiểm tra hạn mức đĩa (Render free plan chỉ ~1GB).
        await enforceCacheQuota();

        return { body, contentType: mimeOf(ext), fetched: true };
      } catch (err) {
        lastError = err;
        await new Promise((r) => setTimeout(r, 900 * (attempt + 1)));
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error('Không tải được ảnh từ Wikimedia');
  } finally {
    releaseSlot();
  }
}
