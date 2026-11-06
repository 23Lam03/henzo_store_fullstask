/**
 * Cookie refresh token (httpOnly).
 *
 * - Path giới hạn ở /api/auth để browser chỉ gửi kèm cho endpoint auth.
 * - SameSite:
 *     · `Lax`  — mặc định cho dev (frontend & API cùng localhost).
 *     · `None` — BẮT BUỘC khi deploy tách domain (Render: frontend là
 *       `henzo-store.onrender.com`, API là `henzo-store-api.onrender.com`).
 *       Cross-site cookie không được gửi với `Lax` -> refresh token không
 *       bao giờ tới server -> user bị logout mỗi khi access token hết hạn.
 *       `None` bắt buộc cookie phải có `Secure` (trình duyệt chặn nếu không).
 */
import { config } from '../../config/env';

/** Parts chung cho cả set và clear. */
function baseParts(): string[] {
  const parts = [
    'Path=/api/auth',
    'HttpOnly',
    `SameSite=${config.COOKIE_SAME_SITE}`,
    `Max-Age=${60 * 60 * 24 * 7}`,
  ];
  // `SameSite=None` bị trình duyệt từ chối nếu thiếu `Secure`.
  if (config.COOKIE_SECURE || config.COOKIE_SAME_SITE === 'None') {
    parts.push('Secure');
  }
  if (config.COOKIE_DOMAIN) parts.push(`Domain=${config.COOKIE_DOMAIN}`);
  return parts;
}

export function buildRefreshCookie(token: string): string {
  return [`${config.COOKIE_NAME}=${token}`, ...baseParts()].join('; ');
}

export function clearRefreshCookie(): string {
  return [`${config.COOKIE_NAME}=`, ...baseParts(), 'Max-Age=0'].join('; ');
}

/** Đọc cookie từ header Cookie. */
export function readCookie(
  request: Request,
  name: string = config.COOKIE_NAME,
): string | null {
  const header = request.headers.get('cookie');
  if (!header) return null;
  for (const part of header.split(';')) {
    const [k, ...rest] = part.trim().split('=');
    if (k === name) return decodeURIComponent(rest.join('='));
  }
  return null;
}
