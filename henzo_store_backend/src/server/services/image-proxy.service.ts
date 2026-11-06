import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, stat, unlink, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { config } from '../../config/env';
import { resolveFromRoot } from '../../config/paths';

const ALLOWED_HOSTS = [
  'upload.wikimedia.org',
  'thumb.wikimedia.org',
  'commons.wikimedia.org',
];

const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const CACHE_MAX_BYTES = (() => {
  const raw = Number.parseInt(process.env.IMAGE_CACHE_MAX_BYTES ?? '', 10);
  return Number.isFinite(raw) && raw >= 0 ? raw : 400 * 1024 * 1024;
})();

const USER_AGENT =
  'HenzoStore/1.0 (https://henzo.vn; image-proxy) node-fetch';

function cacheRoot(): string {
  const dir = path.isAbsolute(config.IMAGE_CACHE_DIR)
    ? config.IMAGE_CACHE_DIR
    : resolveFromRoot(config.IMAGE_CACHE_DIR);
  if (!existsSync(dir)) mkdir(dir, { recursive: true });
  return dir;
}

export function isProxyableImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
    return ALLOWED_HOSTS.includes(parsed.hostname);
  } catch {
    return false;
  }
}

function extOf(contentType: string): string {
  if (contentType.includes('png')) return '.png';
  if (contentType.includes('webp')) return '.webp';
  if (contentType.includes('gif')) return '.gif';
  if (contentType.includes('svg')) return '.svg';
  if (contentType.includes('avif')) return '.avif';
  return '.jpg';
}

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

function cacheKey(url: string): string {
  const cleaned = url.split('?')[0];
  return createHash('sha256').update(cleaned).digest('hex');
}

export interface CachedImage {
  body: Uint8Array;
  contentType: string;
    fetched: boolean;
}

const MAX_CONCURRENT = 4;
const MIN_GAP_MS = 120;

let activeFetches = 0;
const waiting: (() => void)[] = [];
let lastFetchAt = 0;

async function acquireSlot(): Promise<void> {
  if (activeFetches >= MAX_CONCURRENT) {
    await new Promise<void>((resolve) => waiting.push(resolve));
  }
  activeFetches++;

  const wait = lastFetchAt + MIN_GAP_MS - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastFetchAt = Date.now();
}

function releaseSlot(): void {
  activeFetches--;
  const next = waiting.shift();
  if (next) next();
}

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
      } catch {void 0; 

      }
    }
  } catch {
    return;
  }

  let total = files.reduce((sum, f) => sum + f.size, 0);
  if (total <= CACHE_MAX_BYTES) return;

  files.sort((a, b) => a.mtime - b.mtime);

  for (const file of files) {
    if (total <= CACHE_MAX_BYTES) break;
    try {
      await unlink(file.path);
      total -= file.size;
    } catch {void 0; 

    }
  }

  console.log(
    `[image-cache] Đã dọn cache: còn ${(total / 1024 / 1024).toFixed(1)}MB ` +
      `(hạn mức ${(CACHE_MAX_BYTES / 1024 / 1024).toFixed(0)}MB)`,
  );
}

export async function getCachedImage(url: string): Promise<CachedImage> {
  if (!isProxyableImageUrl(url)) {
    throw new Error('URL ảnh không được phép proxy');
  }

  const key = cacheKey(url);
  const root = cacheRoot();

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
