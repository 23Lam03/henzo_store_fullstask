/**
 * CORS cho production — Render phục vụ API và frontend ở 2 domain khác
 * nhau nên cần khai báo origin cụ thể qua env `CORS_ORIGINS`.
 *
 * Cookie refresh-token dùng `SameSite=None; Secure` khi chạy production
 * nên response phải có `Access-Control-Allow-Credentials: true`.
 *
 * Lưu ý: file này chạy bằng `node` (không qua Vite) nên không import được
 * module TypeScript `src/config/env.ts`. Vì vậy logic phải độc lập —
 * nhưng phải khớp với `buildCorsOrigins()` trong `src/config/env.ts`:
 *
 *   1. Đọc `CORS_ORIGINS` (phân tách bằng dấu phẩy).
 *   2. Tự thêm domain Render của chính service (`RENDER_EXTERNAL_URL`,
 *      `RENDER_EXTERNAL_HOSTNAME`) để deploy không cần set thủ công.
 */

/** Danh sách origin được phép. */
const corsOrigins = (() => {
  const list = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  for (const key of ['RENDER_EXTERNAL_URL', 'RENDER_EXTERNAL_HOSTNAME']) {
    const value = process.env[key];
    if (!value) continue;
    const origin = value.startsWith('http') ? value : `https://${value}`;
    if (!list.includes(origin)) list.push(origin);
  }

  return list;
})();

/** Chọn origin được phép echo lại response. */
function resolveOrigin(requestOrigin) {
  if (!corsOrigins.length) return requestOrigin ?? null;
  if (requestOrigin && corsOrigins.includes(requestOrigin)) return requestOrigin;
  return corsOrigins[0] ?? null;
}

export { corsOrigins, resolveOrigin };
