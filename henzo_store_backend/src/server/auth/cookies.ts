import { config } from '../../config/env';

function baseParts(): string[] {
  const parts = [
    'Path=/api/auth',
    'HttpOnly',
    `SameSite=${config.COOKIE_SAME_SITE}`,
    `Max-Age=${60 * 60 * 24 * 7}`,
  ];

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
