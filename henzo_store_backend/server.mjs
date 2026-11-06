import { serve } from 'srvx/node';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const port = Number(process.env.PORT ?? 4000);

const root = process.env.APP_ROOT
  ? path.resolve(process.env.APP_ROOT)
  : __dirname;

const serverEntry = path.join(root, 'dist', 'server', 'server.js');

if (!existsSync(serverEntry)) {
  console.error(
    `[SERVER] Không tìm thấy ${serverEntry}.\n` +
      `         Hãy chạy "npm run build" trước khi start.`,
  );
  process.exit(1);
}

const mod = await import(pathToFileURL(serverEntry).href);
const handler = (mod.default ?? mod).fetch;

if (typeof handler !== 'function') {
  console.error('[SERVER] Server entry không export hàm `fetch`.');
  process.exit(1);
}

const { corsOrigins, resolveOrigin } = await import('./cors.mjs');

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

  trustProxy: true,
});

console.log(`[SERVER] Henzo Store API đang chạy tại http://0.0.0.0:${port}`);
console.log(`[SERVER] CORS origins: ${corsOrigins.join(', ') || '(không giới hạn)'}`);

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    console.log(`[SERVER] Nhận ${signal}, đang tắt...`);
    server.close(() => process.exit(0));

    setTimeout(() => process.exit(0), 10_000).unref();
  });
}
