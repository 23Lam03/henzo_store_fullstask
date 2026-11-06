/**
 * Nạp biến môi trường từ file `.env` (không phụ thuộc thư viện ngoài).
 *
 * - Tự động tạo file `.env` từ `.env.example` nếu chưa có.
 * - Giá trị đã có trong `process.env` luôn được ưu tiên (để chạy CI/Docker).
 * - Vite đã nạp `.env` khi chạy dev/build, nên hàm này sẽ là no-op.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PROJECT_ROOT } from './paths';

function parseEnvFile(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    // Dòng có giá trị rỗng (vd `UPLOAD_STORE=`) nghĩa là "chưa đặt" ->
    // KHÔNG đưa vào `process.env`, để zod dùng giá trị mặc định.
    // Nếu đưa vào, giá trị rỗng sẽ fail validate enum và server không
    // khởi động được.
    if (!key || value === '') continue;
    result[key] = value;
  }
  return result;
}

/**
 * Có đang chạy ở môi trường production (Paas) không?
 *
 * - `NODE_ENV=production` — cách chuẩn.
 * - `process.env.RENDER` — Render tự set biến này cho mọi service.
 *   Cần thiết vì nếu service được tạo thủ công và quên set `NODE_ENV`,
 *   code sẽ tưởng đang ở dev và đọc nhầm file `.env.example` (template)
 *   như cấu hình thật -> giá trị rỗng trong template làm fail validate.
 */
function isProduction(): boolean {
  return (
    process.env.NODE_ENV === 'production' ||
    process.env.RENDER === 'true' ||
    Boolean(process.env.RENDER)
  );
}

/** Đọc `.env` tại gốc dự án (hoặc `.env.local`, `.env.development`). */
export function loadEnvFiles(rootDir?: string): void {
  // `PROJECT_ROOT` được dò từ vị trí file để không phụ thuộc `process.cwd()`
  // (trên Render cwd có thể là `/opt/render/project/src`).
  const here = rootDir ?? PROJECT_ROOT;

  const candidates = [
    '.env.local',
    `.env.${process.env.NODE_ENV ?? 'development'}`,
    '.env',
  ];

  // `.env.example` CHỈ dùng làm fallback khi đang dev và chưa có file `.env`
  // nào. Ở production (Render) tuyệt đối không nạp file mẫu — nếu không,
  // các giá trị mặc định trong ví dụ (vd `NODE_ENV=development`,
  // `COOKIE_SAME_SITE=Lax`) có thể lọt vào config thật.
  if (!isProduction()) {
    candidates.push('.env.example');
  }

  for (const name of candidates) {
    const file = resolve(here, name);
    if (!existsSync(file)) continue;
    const parsed = parseEnvFile(readFileSync(file, 'utf8'));
    for (const [key, value] of Object.entries(parsed)) {
      if (process.env[key] === undefined) process.env[key] = value;
    }
    // `.env` đã tồn tại → dừng, không cần fallback sang `.env.example`.
    if (name !== '.env.example') break;
  }
}
