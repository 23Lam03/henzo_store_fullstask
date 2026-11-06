import { mkdir, writeFile, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { config } from '../../config/env';
import { resolveFromRoot } from '../../config/paths';
import { badRequest, unprocessable } from '../http/errors';
import { UploadedImageModel } from '../models/UploadedImage';

const ALLOWED_TYPES: Record<string, { ext: string; magic: number[][] }> = {
  'image/jpeg': { ext: '.jpg', magic: [[0xff, 0xd8, 0xff]] },
  'image/png': { ext: '.png', magic: [[0x89, 0x50, 0x4e, 0x47]] },
  'image/webp': { ext: '.webp', magic: [[0x52, 0x49, 0x46, 0x46]] },
  'image/gif': { ext: '.gif', magic: [[0x47, 0x49, 0x46, 0x38]] },
  'image/avif': { ext: '.avif', magic: [[0x66, 0x74, 0x79, 0x70]] },
};

export const ALLOWED_IMAGE_TYPES = Object.keys(ALLOWED_TYPES);

function useMongoStore(): boolean {
  const mode = (config.UPLOAD_STORE ?? '').toLowerCase();
  if (mode === 'mongo') return true;
  if (mode === 'disk') return false;

  return config.isProd;
}

function uploadRoot(): string {
  return path.isAbsolute(config.UPLOAD_DIR)
    ? config.UPLOAD_DIR
    : resolveFromRoot(config.UPLOAD_DIR);
}

export async function ensureUploadDir(): Promise<string> {
  const dir = uploadRoot();
  if (!existsSync(dir)) await mkdir(dir, { recursive: true });
  return dir;
}

function sniffMagic(bytes: Uint8Array): string | null {
  for (const [mime, def] of Object.entries(ALLOWED_TYPES)) {
    for (const sig of def.magic) {
      if (sig.every((b, i) => bytes[i] === b)) return mime;
    }
  }
  return null;
}

export interface UploadedFile {
    url: string;
    path: string;
    filename: string;
    filePath: string;
  size: number;
  mimeType: string;
}

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

  try {
    await writeFile(filePath, buffer);
  } catch (error) {
    console.warn('[upload] Không ghi được file xuống đĩa:', error);
  }

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

export async function readUploadedImage(
  filename: string,
): Promise<{ data: Buffer; mimeType: string } | null> {
  const safe = path.basename(filename);
  if (!safe || safe !== filename) return null;

  try {

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

  const filePath = resolveUploadPath(safe);
  if (filePath && existsSync(filePath)) {
    const { readFile } = await import('node:fs/promises');
    const data = await readFile(filePath);
    return { data, mimeType: mimeFromExt(safe) };
  }

  return null;
}

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

export async function removeUploadedFile(filePath: string): Promise<void> {
  try {
    await unlink(filePath);
  } catch {void 0; 
      }
}

export async function removeUploadedImage(filename: string): Promise<void> {
  const safe = path.basename(filename);
  try {
    await UploadedImageModel.deleteOne({ filename: safe });
  } catch {void 0; 
      }
  const filePath = resolveUploadPath(safe);
  if (filePath) await removeUploadedFile(filePath);
}

export function resolveUploadPath(filename: string): string | null {
  const safe = path.basename(filename);
  if (!safe || safe !== filename) return null;

  const full = path.join(uploadRoot(), safe);

  if (!full.startsWith(uploadRoot() + path.sep)) return null;
  return full;
}
