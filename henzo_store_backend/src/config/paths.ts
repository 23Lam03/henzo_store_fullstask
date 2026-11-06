/**
 * Đường dẫn gốc của ứng dụng.
 *
 * Vì sao không dùng `process.cwd()`?
 *   Trên Render, `startCommand` chạy với working directory = thư mục gốc
 *   của service (`rootDir`), nhưng điều này **không được đảm bảo** — và khi
 *   chạy `node server.mjs` từ script khác, cwd có thể là bất kỳ đâu
 *   (ví dụ `/opt/render/project/src`). Nếu dùng cwd, thư mục cache ảnh và
 *   thư mục upload sẽ bị tạo ở vị trí sai (thậm chí ngoài thư mục được
 *   mount persistent disk).
 *
 *   Cách an toàn: dò ngược lên từ file đang chạy để tìm thư mục chứa
 *   `package.json` của backend — đó chính là gốc dự án.
 */
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Tìm thư mục gốc dự án (chứa `package.json`) bằng cách đi lên từ `startDir`. */
function findProjectRoot(startDir: string): string {
  let dir = startDir;
  for (let i = 0; i < 8; i += 1) {
    if (existsSync(resolve(dir, 'package.json'))) return dir;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return startDir;
}

/**
 * Gốc dự án backend.
 *
 * Khi chạy từ source (`src/config/paths.ts`): `src/config` -> `src` -> gốc.
 * Khi chạy từ bundle (`dist/server/assets/...`): dò ngược lên sẽ gặp
 * `dist/server` -> `dist` -> gốc dự án (có `package.json`).
 */
export const PROJECT_ROOT: string = findProjectRoot(
  // `import.meta.url` -> `src/config/paths.ts` -> gốc dự án là 2 cấp trên.
  dirname(dirname(dirname(fileURLToPath(import.meta.url)))),
);

/**
 * Resolve một đường dẫn tương đối về đường dẫn tuyệt đối.
 *
 * - Đường dẫn tuyệt đối -> giữ nguyên.
 * - Đường dẫn tương đối -> tính từ gốc dự án (KHÔNG phải cwd).
 */
export function resolveFromRoot(dir: string): string {
  return resolve(PROJECT_ROOT, dir);
}
