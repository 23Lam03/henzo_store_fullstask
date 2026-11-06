/**
 * Cấu hình ứng dụng — đọc từ biến môi trường (.env)
 */
import { z } from 'zod';
import { loadEnvFiles } from './load-env.ts';

// Nạp `.env` khi chạy ngoài Vite (script seed, test...). Vite đã tự nạp.
loadEnvFiles();

/**
 * Biến rỗng -> `undefined`.
 *
 * Cần thiết vì file `.env.example` có các dòng để trống (vd
 * `UPLOAD_STORE=`) — nếu nạp file đó làm nguồn cấu hình, giá trị rỗng sẽ
 * fail validate enum và làm server không khởi động được.
 */
function emptyToUndefined(value: unknown): unknown {
  return typeof value === 'string' && value.trim() === '' ? undefined : value;
}

/**
 * Đang chạy trên Render không?
 *
 * Render tự set `RENDER=true` cho mọi service. Dùng biến này để nhận ra
 * môi trường production **ngay cả khi `NODE_ENV` chưa được set** — trường
 * hợp này xảy ra khi service được tạo thủ công (thay vì qua Blueprint)
 * và người dùng quên đặt `NODE_ENV=production`.
 */
function isRender(): boolean {
  return Boolean(process.env.RENDER) || process.env.NODE_ENV === 'production';
}

const envSchema = z.object({
  MONGODB_URI: z.string().min(1, 'Thiếu MONGODB_URI'),
  PORT: z.coerce.number().default(4000),
  /**
   * Môi trường chạy.
   *
   * Render tự set `RENDER=true` cho mọi service, kể cả khi service được
   * tạo thủ công và quên đặt `NODE_ENV`. Nếu không nhận ra điều này,
   * `NODE_ENV` sẽ là `development` -> `isProd=false` -> ảnh upload lưu
   * vào disk (mất mỗi lần restart) và cookie không bật `Secure`.
   */
  NODE_ENV: z.preprocess(
    (value) =>
      // Chỉ ghi đè khi chưa được đặt tường minh — để `NODE_ENV=test` vẫn
      // hoạt động đúng trong môi trường test.
      value === undefined && isRender() ? 'production' : value,
    z.enum(['development', 'production', 'test']).default('development'),
  ),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET phải có ít nhất 16 ký tự'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET phải có ít nhất 16 ký tự'),
  JWT_ACCESS_EXPIRES: z.string().default('15m'),
  JWT_REFRESH_EXPIRES: z.string().default('7d'),

  // Cookie
  COOKIE_NAME: z.string().default('henzo_refresh_token'),
  COOKIE_DOMAIN: z.string().optional(),
  /**
   * Cookie có gắn cờ `Secure` không.
   *
   * Trên Render (HTTPS) bắt buộc `true` — và khi `SameSite=None` thì
   * trình duyệt sẽ **từ chối** cookie nếu thiếu `Secure`.
   */
  COOKIE_SECURE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true')
    .transform((v) => (v ? true : isRender())),
  /**
   * SameSite của cookie refresh.
   * - `Lax`  : dev (cùng origin).
   * - `None` : deploy tách domain — bắt buộc để refresh token được gửi.
   *
   * Trên Render, frontend và API là 2 domain khác nhau nên mặc định là
   * `None` — nếu để `Lax`, browser sẽ không gửi cookie cross-site và user
   * bị logout mỗi khi access token hết hạn.
   */
  COOKIE_SAME_SITE: z
    .enum(['Lax', 'Strict', 'None'])
    .default('Lax')
    .transform((v) => (isRender() ? 'None' : v)),

  // CORS — danh sách origin được phép, phân tách bằng dấu phẩy
  CORS_ORIGINS: z.string().default('http://localhost:5173,http://localhost:3000'),
  // ─── Upload ảnh ──────────────────────────────────────────────────────────
  /** Thư mục lưu file tải lên (tương đối so với thư mục gốc backend). */
  UPLOAD_DIR: z.string().default('storage/uploads'),
  /** Kích thước tối đa cho 1 file (byte). */
  UPLOAD_MAX_SIZE: z.coerce.number().int().positive().default(5 * 1024 * 1024),
  /** Đường dẫn public để đọc lại file đã tải lên. */
  UPLOAD_PUBLIC_PATH: z.string().default('/api/uploads'),
  /**
   * Nơi lưu ảnh upload.
   * - `mongo` — lưu trong MongoDB (bền vững, dùng cho Render).
   * - `disk`  — chỉ lưu trên đĩa (nhanh, nhưng mất khi restart).
   * Mặc định: `mongo` khi production, `disk` khi dev.
   */
  UPLOAD_STORE: z.preprocess(
    emptyToUndefined,
    z.enum(['mongo', 'disk']).optional(),
  ),

  // ─── Proxy & cache ảnh Wikimedia ─────────────────────────────────────────
  /** Thư mục cache ảnh tải về từ Wikimedia. */
  IMAGE_CACHE_DIR: z.string().default('storage/image-cache'),
});

/**
 * Danh sách origin được phép cho CORS.
 *
 * Ngoài `CORS_ORIGINS`, tự động thêm các domain Render của chính service
 * (`RENDER_EXTERNAL_URL`, `RENDER_EXTERNAL_HOSTNAME`). Nhờ đó deploy không
 * cần set `CORS_ORIGINS` thủ công — giảm nửa bước cấu hình và tránh
 * nhầm lẫn "deploy được nhưng bị chặn CORS".
 */
function buildCorsOrigins(raw: string): string[] {
  const list = raw
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  // Domain của chính API (hữu ích khi frontend và API cùng domain).
  for (const key of ['RENDER_EXTERNAL_URL', 'RENDER_EXTERNAL_HOSTNAME']) {
    const value = process.env[key];
    if (!value) continue;
    const origin = value.startsWith('http') ? value : `https://${value}`;
    if (!list.includes(origin)) list.push(origin);
  }

  return list;
}

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
  corsOrigins: buildCorsOrigins(parsed.data.CORS_ORIGINS),
};

export type Config = typeof config;
