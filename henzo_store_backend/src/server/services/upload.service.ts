/**
 * Lưu trữ file tải lên từ máy người dùng.
 *
 * Backend chạy trên Node nên dùng `node:fs` để ghi file thật xuống đĩa
 * rồi phục vụ lại qua route `/api/uploads/*`. Cách này giữ nguyên kiến trúc
 * "API-only" của dự án, không cần thêm dịch vụ ngoài như S3/Cloudinary.
 *
 * Quy tắc:
 *  - Chỉ nhận ảnh (jpeg/png/webp/gif/avif) và SVG cơ bản.
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

/** Định dạng ảnh được phép + magic number tương ứng. */
const ALLOWED_TYPES: Record<string, { ext: string; magic: number[][] }> = {
  'image/jpeg': { ext: '.jpg', magic: [[0xff, 0xd8, 0xff]] },
  'image/png': { ext: '.png', magic: [[0x89, 0x50, 0x4e, 0x47]] },
  'image/webp': { ext: '.webp', magic: [[0x52, 0x49, 0x46, 0x46]] },
  'image/gif': { ext: '.gif', magic: [[0x47, 0x49, 0x46, 0x38]] },
  'image/avif': { ext: '.avif', magic: [[0x66, 0x74, 0x79, 0x70]] },
};

export const ALLOWED_IMAGE_TYPES = Object.keys(ALLOWED_TYPES);

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

  await writeFile(filePath, buffer);

  return {
    url: `${config.UPLOAD_PUBLIC_PATH}/${filename}`,
    path: `${config.UPLOAD_PUBLIC_PATH}/${filename}`,
    filename,
    filePath,
    size: buffer.byteLength,
    mimeType,
  };
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
