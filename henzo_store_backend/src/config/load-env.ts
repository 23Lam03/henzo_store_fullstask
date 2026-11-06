/**
 * Nạp biến môi trường từ file `.env` (không phụ thuộc thư viện ngoài).
 *
 * - Tự động tạo file `.env` từ `.env.example` nếu chưa có.
 * - Giá trị đã có trong `process.env` luôn được ưu tiên (để chạy CI/Docker).
 * - Vite đã nạp `.env` khi chạy dev/build, nên hàm này sẽ là no-op.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

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
    if (key) result[key] = value;
  }
  return result;
}

/** Tìm thư mục gốc dự án (chứa `package.json`) bằng cách đi lên từ `startDir`. */
function findProjectRoot(startDir: string): string {
  let dir = startDir;
  for (let i = 0; i < 6; i += 1) {
    if (existsSync(resolve(dir, 'package.json'))) return dir;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return startDir;
}

/** Đọc `.env` tại gốc dự án (hoặc `.env.local`, `.env.development`). */
export function loadEnvFiles(rootDir?: string): void {
  // `import.meta.url` -> `src/config/load-env.ts` -> gốc dự án là 2 cấp trên.
  const here =
    rootDir ??
    findProjectRoot(dirname(dirname(dirname(fileURLToPath(import.meta.url)))));

  const candidates = [
    '.env.local',
    `.env.${process.env.NODE_ENV ?? 'development'}`,
    '.env',
    '.env.example',
  ];

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
