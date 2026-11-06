/**
 * Lưu trữ file tải lên từ máy người dùng.
 *
 * ## Vì sao lưu trong MongoDB?
 *
 * Backend chạy trên Node nên có thể ghi file thật xuống đĩa rồi phục vụ lại
 * qua route `/api/uploads/*`. Tuy nhiên trên Render (và hầu hết PaaS) đĩa là
 * **ephemeral**: mỗi lần deploy hoặc restart là mất sạch thư mục
 * `storage/uploads` -> ảnh sản phẩm / ảnh đại diện người dùng đã upload
 * biến mất khỏi hệ thống.
 *
 * Vì vậy file được lưu **song song**:
 *   1. MongoDB (`UploadedImage`) — nguồn dữ liệu chính, sống dai.
 *   2. Đĩa — cache nhanh cho request cục bộ, có thể mất mà không sao.
 *
 * Route `/api/uploads/:filename` đọc MongoDB trước, fallback sang đĩa.
 *
 * Quy tắc:
 *  - Chỉ nhận ảnh (jpeg/png/webp/gif/avif).
 *  - Giới hạn kích thước file (mặc định 5MB).
 *  - Tên file được sinh lại từ UUID + extension — không dùng tên người dùng
 *    gửi lên (tránh path traversal & tránh ghi đè).
 *  - Kiểm tra magic number của file để chặn file giả dạng ảnh.
 */
import { mkdir, writeFile, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { config } from '../../config/env';
import { badRequest, unprocessable } from '../http/errors';
import { UploadedImageModel } from '../models/UploadedImage';

/** Định dạng ảnh được phép + magic number tương ứng. */
const ALLOWED_TYPES: Record<string, { ext: string; magic: number[][] }> = {
  'image/jpeg': { ext: '.jpg', magic: [[0xff, 0xd8, 0xff]] },
  'image/png': { ext: '.png', magic: [[0x89, 0x50, 0x4e, 0x47]] },
  'image/webp': { ext: '.webp', magic: [[0x52, 0x49, 0x46, 0x46]] },
  'image/gif': { ext: '.gif', magic: [[0x47, 0x49, 0x46, 0x38]] },
  'image/avif': { ext: '.avif', magic: [[0x66, 0x74, 0x79, 0x70]] },
};

export const ALLOWED_IMAGE_TYPES = Object.keys(ALLOWED_TYPES);

/**
 * Bật/tắt lưu ảnh vào MongoDB.
 * Mặc định BẬT (cần cho production trên Render).
 * Set `UPLOAD_STORE=mongo` để chỉ dùng MongoDB, `UPLOAD_STORE=disk` để
 * chỉ dùng đĩa (mặc định khi dev).
 */
function useMongoStore(): boolean {
  const mode = (config.UPLOAD_STORE ?? '').toLowerCase();
  if (mode === 'mongo') return true;
  if (mode === 'disk') return false;
  // Mặc định: dùng MongoDB khi NODE_ENV=production, đĩa khi dev.
  return config.isProd;
}

/** Thư mục lưu trữ tuyệt đối. */
function uploadRoot(): string {
  return path.isAbsolute(config.UPLOAD_DIR)
    ? config.UPLOAD_DIR
    : path.resolve(process.cwd(), config.UPLOAD_DIR);
}

/** Đảm bảo thư mục lưu trữ tồn tại. */
export async function ensureUploadDir(): Promise<string> {
  const dir = uploadRoot();
  if (!existsSync(dir)) await mkdir(dir, { recursive: true });
  return dir;
}

/** Đọc `magic number` (12 byte đầu) của file để xác thực định dạng thật. */
function sniffMagic(bytes: Uint8Array): string | null {
  for (const [mime, def] of Object.entries(ALLOWED_TYPES)) {
    for (const sig of def.magic) {
      if (sig.every((b, i) => bytes[i] === b)) return mime;
    }
  }
  return null;
}

export interface UploadedFile {
  /** URL public để nhúng vào `<img src>`. */
  url: string;
  /** Đường dẫn tương đối trên server (dùng nếu cần dựng URL theo host khác). */
  path: string;
  /** Tên file đã lưu trên đĩa. */
  filename: string;
  /** Đường dẫn tuyệt đối trên đĩa (dùng để xoá sau này). */
  filePath: string;
  size: number;
  mimeType: string;
}

/**
 * Lưu một file ảnh tải lên.
 * @param file File từ `FormData`.
 */
export async function saveUploadedImage(file: File): Promise<UploadedFile> {
  if (!file || typeof file === 'string') {
    throw badRequest('Không nhận được file ảnh.');
  }

  if (file.size === 0) {
    throw badRequest('File ảnh rỗng.');
  }

  if (file.size > config.UPLOAD_MAX_SIZE) {
    throw unprocessable(
      `Ảnh vượt quá dung lượng cho phép (${Math.round(
        config.UPLOAD_MAX_SIZE / 1024 / 1024,
      )}MB).`,
    );
  }

  // Định dạng: kiểm tra magic number (không thể bị giả mạo).
  // KHÔNG fallback vào content-type — file .txt được đổi tên .png sẽ lọt nếu
  // chỉ tin vào header do client gửi.
  const buffer = Buffer.from(await file.arrayBuffer());
  const sniffed = sniffMagic(buffer.subarray(0, 12));

  if (!sniffed) {
    throw unprocessable(
      'File không phải ảnh hợp lệ. Chỉ nhận JPG, PNG, WEBP, GIF hoặc AVIF.',
    );
  }

  const mimeType = sniffed;
  const ext = ALLOWED_TYPES[sniffed].ext;

  const dir = await ensureUploadDir();
  const filename = `${randomUUID()}${ext}`;
  const filePath = path.join(dir, filename);

  // Ghi xuống đĩa (cache nhanh). Lỗi ghi đĩa không chặn việc lưu vào
  // MongoDB — trên Render disk có thể read-only hoặc hết chỗ.
  try {
    await writeFile(filePath, buffer);
  } catch (error) {
    console.warn('[upload] Không ghi được file xuống đĩa:', error);
  }

  // Lưu vào MongoDB — nguồn dữ liệu bền vững.
  if (useMongoStore()) {
    try {
      await UploadedImageModel.create({
        filename,
        mimeType,
        size: buffer.byteLength,
        data: buffer,
      });
    } catch (error) {
      console.error('[upload] Lưu ảnh vào MongoDB thất bại:', error);
      throw unprocessable('Không lưu được ảnh. Vui lòng thử lại.');
    }
  }

  return {
    url: `${config.UPLOAD_PUBLIC_PATH}/${filename}`,
    path: `${config.UPLOAD_PUBLIC_PATH}/${filename}`,
    filename,
    filePath,
    size: buffer.byteLength,
    mimeType,
  };
}

/**
 * Đọc nội dung file đã upload.
 *
 * Thứ tự: MongoDB (bền vững) -> đĩa (cache cho dữ liệu cũ).
 * Trả về `null` nếu không tìm thấy.
 */
export async function readUploadedImage(
  filename: string,
): Promise<{ data: Buffer; mimeType: string } | null> {
  const safe = path.basename(filename);
  if (!safe || safe !== filename) return null;

  // 1. MongoDB
  try {
    // KHÔNG dùng `.lean()` — mongoose trả về BSON `Binary` khi lean, mà
    // `Buffer.from(Binary)` sẽ ra mảng rỗng. Doc thường đã là Buffer.
    const doc = await UploadedImageModel.findOne({ filename: safe });
    if (doc?.data) {
      const raw = doc.data as unknown;
      const data = Buffer.isBuffer(raw)
        ? raw
        : Buffer.from(
            typeof (raw as { buffer?: unknown }).buffer === 'object'
              ? (raw as { buffer: Uint8Array }).buffer
              : (raw as Uint8Array),
          );
      if (data.byteLength > 0) {
        return { data, mimeType: doc.mimeType || 'application/octet-stream' };
      }
    }
  } catch (error) {
    console.warn('[upload] Không đọc được ảnh từ MongoDB:', error);
  }

  // 2. Đĩa
  const filePath = resolveUploadPath(safe);
  if (filePath && existsSync(filePath)) {
    const { readFile } = await import('node:fs/promises');
    const data = await readFile(filePath);
    return { data, mimeType: mimeFromExt(safe) };
  }

  return null;
}

/** Đoán MIME type từ đuôi file. */
function mimeFromExt(filename: string): string {
  const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase();
  const MIME: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.avif': 'image/avif',
  };
  return MIME[ext] ?? 'application/octet-stream';
}

/** Xoá file đã tải lên (bỏ qua nếu file không tồn tại). */
export async function removeUploadedFile(filePath: string): Promise<void> {
  try {
    await unlink(filePath);
  } catch {
    /* file không tồn tại — bỏ qua */
  }
}

/**
 * Xoá ảnh đã upload (cả bản trong MongoDB lẫn trên đĩa).
 */
export async function removeUploadedImage(filename: string): Promise<void> {
  const safe = path.basename(filename);
  try {
    await UploadedImageModel.deleteOne({ filename: safe });
  } catch {
    /* bỏ qua */
  }
  const filePath = resolveUploadPath(safe);
  if (filePath) await removeUploadedFile(filePath);
}

/**
 * Chuyển `filename` (do server sinh) thành đường dẫn tuyệt đối an toàn.
 * Chặn path traversal (`../`).
 */
export function resolveUploadPath(filename: string): string | null {
  const safe = path.basename(filename);
  if (!safe || safe !== filename) return null;

  const full = path.join(uploadRoot(), safe);
  // Chặn file nằm ngoài thư mục upload.
  if (!full.startsWith(uploadRoot() + path.sep)) return null;
  return full;
}
