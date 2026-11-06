/**
 * CORS — chỉ chấp nhận origin trong danh sách `CORS_ORIGINS`.
 * Hỗ trợ preflight OPTIONS và credentials (cookie refresh token).
 *
 * Lưu ý về middleware của TanStack Start:
 *   - `next()` trả về `RequestServerResult` (object), KHÔNG phải Response.
 *   - Response thực sự nằm ở `result.response` (không phải `result.result`).
 *   - Nếu middleware trả về Response trực tiếp, framework sẽ dừng chain.
 *
 * Vì sao không dùng `result.result`: `next()` của TanStack trả về
 * `{ request, pathname, context, response }`. Truy cập `result.result` luôn
 * cho `undefined`, khiến toàn bộ header CORS bị bỏ qua — browser báo
 * "The value of the 'Access-Control-Allow-Credentials' header is ''".
 */
import { createMiddleware } from '@tanstack/react-start';
import { config } from '../../config/env';

/** Lấy Response từ kết quả của `next()` (hỗ trợ nhiều shape để an toàn). */
function extractResponse(result: unknown): Response | undefined {
  if (!result) return undefined;
  if (result instanceof Response) return result;
  const maybe = result as { response?: unknown; result?: unknown };
  if (maybe.response instanceof Response) return maybe.response;
  if (maybe.result instanceof Response) return maybe.result;
  return undefined;
}

export const corsMiddleware = createMiddleware().server(async ({ next, request }) => {
  const origin = request.headers.get('origin');
  const allowed = Boolean(origin && config.corsOrigins.includes(origin));

  const headers: Record<string, string> = {};

  if (allowed && origin) {
    // Echo đúng origin (không dùng `*`) vì request dùng `credentials: 'include'`.
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Credentials'] = 'true';
    headers['Vary'] = 'Origin';
  }
  headers['Access-Control-Allow-Methods'] =
    'GET,POST,PUT,PATCH,DELETE,OPTIONS';
  headers['Access-Control-Max-Age'] = '86400';

  // Preflight: trả về ngay, không gọi next() (không cần handler xử lý OPTIONS).
  if (request.method === 'OPTIONS') {
    // Echo lại danh sách header client yêu cầu (vd: content-type, authorization).
    const requested = request.headers.get('access-control-request-headers');
    headers['Access-Control-Allow-Headers'] =
      requested ?? 'Content-Type,Authorization,X-Requested-With';

    return new Response(null, { status: 204, headers });
  }

  const result = await next();
  const response = extractResponse(result);

  // Không tìm thấy Response -> trả nguyên kết quả, không can thiệp.
  if (!response) return result;

  const finalHeaders = new Headers(response.headers);
  for (const [k, v] of Object.entries(headers)) finalHeaders.set(k, v);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: finalHeaders,
  });
});
