/**
 * Cookie refresh token (httpOnly).
 * - Path giới hạn ở /api/auth để browser chỉ gửi kèm cho endpoint auth.
 * - SameSite=Lax để hoạt động với SPA khác origin qua proxy.
 */
import { config } from '../../config/env';

export function buildRefreshCookie(token: string): string {
  const parts = [
    `${config.COOKIE_NAME}=${token}`,
    'Path=/api/auth',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${60 * 60 * 24 * 7}`,
  ];
  if (config.COOKIE_SECURE) parts.push('Secure');
  if (config.COOKIE_DOMAIN) parts.push(`Domain=${config.COOKIE_DOMAIN}`);
  return parts.join('; ');
}

export function clearRefreshCookie(): string {
  const parts = [
    `${config.COOKIE_NAME}=`,
    'Path=/api/auth',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
  ];
  if (config.COOKIE_SECURE) parts.push('Secure');
  if (config.COOKIE_DOMAIN) parts.push(`Domain=${config.COOKIE_DOMAIN}`);
  return parts.join('; ');
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
