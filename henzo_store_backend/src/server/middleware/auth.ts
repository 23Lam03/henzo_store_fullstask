/**
 * Middleware xác thực & phân quyền cho server routes.
 *
 * Nguyên tắc: mọi endpoint đọc/ghi dữ liệu riêng tư PHẢI đi qua middleware
 * `requireAuth` / `requireRole` — không dựa vào guard phía UI.
 *
 * Lưu ý về middleware của TanStack Start:
 *   - `next()` trả về object context; Response nằm ở `result.response`.
 *   - Trả về Response trực tiếp từ middleware sẽ kết thúc chain (dùng cho
 *     các trường hợp từ chối truy cập).
 */
import { createMiddleware } from '@tanstack/react-start';
import type { UserRoleValue } from '../constants';
import { UserModel } from '../models/User';
import { verifyAccessToken } from '../auth/tokens';

export interface AuthContext {
  userId: string;
  role: UserRoleValue;
  storeId?: string;
  email: string;
  name: string;
}

function extractBearer(request: Request): string | null {
  const header =
    request.headers.get('authorization') ?? request.headers.get('Authorization');
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  if (!token || scheme?.toLowerCase() !== 'bearer') return null;
  return token.trim();
}

function unauthorizedResponse() {
  return Response.json(
    {
      success: false,
      data: null,
      error: { code: 'UNAUTHORIZED', message: 'Chưa đăng nhập' },
    },
    { status: 401 },
  );
}

function forbiddenResponse() {
  return Response.json(
    {
      success: false,
      data: null,
      error: { code: 'FORBIDDEN', message: 'Không có quyền truy cập' },
    },
    { status: 403 },
  );
}

/**
 * Nạp principal từ access token. Không throw — middleware khác quyết định.
 */
export const authMiddleware = createMiddleware().server(async ({ next, request }) => {
  const token = extractBearer(request);
  if (!token) return next({ context: { auth: null as AuthContext | null } });

  const payload = verifyAccessToken(token);
  if (!payload) return next({ context: { auth: null as AuthContext | null } });

  const user = await UserModel.findById(payload.sub)
    .select('email name role storeId status')
    .lean();

  if (!user || user.status === 'locked') {
    return next({ context: { auth: null as AuthContext | null } });
  }

  return next({
    context: {
      auth: {
        userId: String(user._id),
        role: user.role as UserRoleValue,
        storeId: user.storeId ? String(user.storeId) : undefined,
        email: user.email,
        name: user.name,
      } satisfies AuthContext,
    },
  });
});

/** Yêu cầu đã đăng nhập. */
export const requireAuth = createMiddleware()
  .middleware([authMiddleware])
  .server(async ({ next, context }) => {
    if (!context.auth) return unauthorizedResponse();
    return next();
  });

/**
 * Yêu cầu đúng vai trò.
 * `roles` ví dụ: ['ADMIN'], ['SHOP', 'ADMIN'], ['CUSTOMER']
 */
export function requireRole(roles: UserRoleValue[]) {
  return createMiddleware()
    .middleware([authMiddleware])
    .server(async ({ next, context }) => {
      if (!context.auth) return unauthorizedResponse();
      if (!roles.includes(context.auth.role)) return forbiddenResponse();
      return next();
    });
}

/**
 * Yêu cầu role SHOP (hoặc ADMIN) và phải có storeId hợp lệ.
 */
export const requireStore = createMiddleware()
  .middleware([authMiddleware])
  .server(async ({ next, context }) => {
    const auth = context.auth;
    if (!auth) return unauthorizedResponse();
    if (auth.role !== 'SHOP' && auth.role !== 'ADMIN') {
      return forbiddenResponse();
    }
    return next();
  });
