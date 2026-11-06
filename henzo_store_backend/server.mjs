/**
 * ENTRYPOINT PRODUCTION — Node server cho TanStack Start.
 *
 * Render (Web Service) gán port động qua biến môi trường `PORT`, nên
 * server phải bind vào `0.0.0.0` và đọc port từ env (mặc định 4000).
 *
 * Luồng:
 *   1. Import server entry đã build (`dist/server/server.js`) — export
 *      `default.fetch(request) => Response` theo chuẩn Fetch API.
 *   2. `srvx/node` bọc handler thành HTTP server thật của Node.
 *   3. CORS do middleware ở trên xử lý.
 *
 * Lưu ý: file này KHÔNG được bundle bởi Vite — nó chạy bằng `node`
 * sau khi `npm run build` đã sinh `dist/server/server.js`.
 */
import { serve } from 'srvx/node';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Port do Render cấp (thường là 10000 trên free plan). */
const port = Number(process.env.PORT ?? 4000);

/**
 * Thư mục gốc khi chạy.
 *
 * `server.mjs` nằm ở gốc backend nên `dist/` là `backend/dist`.
 * Nếu file được copy sang vị trí khác, đặt `APP_ROOT` để ghi đè.
 */
const root = process.env.APP_ROOT
  ? path.resolve(process.env.APP_ROOT)
  : __dirname;

/** Đường dẫn tới server entry đã build. */
const serverEntry = path.join(root, 'dist', 'server', 'server.js');

if (!existsSync(serverEntry)) {
  console.error(
    `[SERVER] Không tìm thấy ${serverEntry}.\n` +
      `         Hãy chạy "npm run build" trước khi start.`,
  );
  process.exit(1);
}

/** Nạp server entry đã bundle. */
const mod = await import(pathToFileURL(serverEntry).href);
const handler = (mod.default ?? mod).fetch;

if (typeof handler !== 'function') {
  console.error('[SERVER] Server entry không export hàm `fetch`.');
  process.exit(1);
}

/**
 * CORS cho production — Render phục vụ API và frontend ở 2 domain khác
 * nhau nên cần khai báo origin cụ thể qua env `CORS_ORIGINS`.
 *
 * Cookie refresh-token dùng `SameSite=None; Secure` khi chạy production
 * nên response phải có `Access-Control-Allow-Credentials: true`.
 */
const corsOrigins = (process.env.CORS_ORIGINS ?? '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

/** Chọn origin được phép echo lại response. */
function resolveOrigin(requestOrigin) {
  if (!corsOrigins.length) return requestOrigin ?? null;
  if (requestOrigin && corsOrigins.includes(requestOrigin)) return requestOrigin;
  return corsOrigins[0] ?? null;
}

/** Middleware CORS + log nhẹ các lỗi. */
const middleware = [
  async (request, next) => {
    const origin = request.headers.get('origin');
    const allowOrigin = resolveOrigin(origin);

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          ...(allowOrigin ? { 'Access-Control-Allow-Origin': allowOrigin } : {}),
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Allow-Methods': 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
          'Access-Control-Allow-Headers':
            'Content-Type,Authorization,X-Requested-With',
          'Access-Control-Max-Age': '86400',
          Vary: 'Origin',
        },
      });
    }

    try {
      const response = await next();
      const headers = new Headers(response.headers);
      if (allowOrigin) {
        headers.set('Access-Control-Allow-Origin', allowOrigin);
        headers.set('Access-Control-Allow-Credentials', 'true');
        headers.append('Vary', 'Origin');
      }
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    } catch (error) {
      console.error('[SERVER] Lỗi khi xử lý request:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: 'Lỗi hệ thống.' },
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }
  },
];

const server = serve({
  fetch: handler,
  port,
  hostname: '0.0.0.0',
  middleware,
  // Render đặt proxy trước app -> tin `X-Forwarded-*` để lấy đúng
  // protocol/host/IP thật của client.
  trustProxy: true,
});

console.log(`[SERVER] Henzo Store API đang chạy tại http://0.0.0.0:${port}`);
console.log(`[SERVER] CORS origins: ${corsOrigins.join(', ') || '(không giới hạn)'}`);

// Render gửi SIGTERM khi restart -> đóng server cho phép mở port mới.
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    console.log(`[SERVER] Nhận ${signal}, đang tắt...`);
    server.close(() => process.exit(0));
    // Ép tắt sau 10s nếu còn request treo.
    setTimeout(() => process.exit(0), 10_000).unref();
  });
}
