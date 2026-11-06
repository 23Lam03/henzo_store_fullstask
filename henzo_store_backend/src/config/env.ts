/**
 * Cấu hình ứng dụng — đọc từ biến môi trường (.env)
 */
import { z } from 'zod';
import { loadEnvFiles } from './load-env.ts';

// Nạp `.env` khi chạy ngoài Vite (script seed, test...). Vite đã tự nạp.
loadEnvFiles();

const envSchema = z.object({
  MONGODB_URI: z.string().min(1, 'Thiếu MONGODB_URI'),
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET phải có ít nhất 16 ký tự'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET phải có ít nhất 16 ký tự'),
  JWT_ACCESS_EXPIRES: z.string().default('15m'),
  JWT_REFRESH_EXPIRES: z.string().default('7d'),

  // Cookie
  COOKIE_NAME: z.string().default('henzo_refresh_token'),
  COOKIE_DOMAIN: z.string().optional(),
  COOKIE_SECURE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),

  // CORS — danh sách origin được phép, phân tách bằng dấu phẩy
  CORS_ORIGINS: z.string().default('http://localhost:5173,http://localhost:3000'),

  // ─── Upload ảnh ──────────────────────────────────────────────────────────
  /** Thư mục lưu file tải lên (tương đối so với thư mục gốc backend). */
  UPLOAD_DIR: z.string().default('storage/uploads'),
  /** Kích thước tối đa cho 1 file (byte). */
  UPLOAD_MAX_SIZE: z.coerce.number().int().positive().default(5 * 1024 * 1024),
  /** Đường dẫn public để đọc lại file đã tải lên. */
  UPLOAD_PUBLIC_PATH: z.string().default('/api/uploads'),

  // ─── Proxy & cache ảnh Wikimedia ─────────────────────────────────────────
  /** Thư mục cache ảnh tải về từ Wikimedia. */
  IMAGE_CACHE_DIR: z.string().default('storage/image-cache'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
    .join('\n');
  console.error(`\n[CONFIG] Cấu hình môi trường không hợp lệ:\n${issues}\n`);
  console.error('Hãy kiểm tra file .env hoặc .env.example\n');
  process.exit(1);
}

export const config = {
  ...parsed.data,
  isProd: parsed.data.NODE_ENV === 'production',
  corsOrigins: parsed.data.CORS_ORIGINS.split(',')
    .map((o) => o.trim())
    .filter(Boolean),
};

export type Config = typeof config;
