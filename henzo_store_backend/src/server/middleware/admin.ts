import { createMiddleware } from '@tanstack/react-start';
import { UserModel } from '../models/User';
import { getRolePermissions } from '../services/rbac.service';

export const ADMIN_ROLES = ['ADMIN', 'MODERATOR', 'STAFF'] as const;

export async function listAdminStaff() {
  const staff = await UserModel.find({
    role: { $in: ['ADMIN', 'MODERATOR', 'STAFF'] },
  })
    .select('name email role permissions status lastLoginAt createdAt avatar')
    .sort({ createdAt: -1 })
    .lean();

  const rolePerms = new Map<string, string[]>();
  for (const role of ['ADMIN', 'MODERATOR', 'STAFF', 'SHOP']) {
    rolePerms.set(role, await getRolePermissions(role));
  }

  return staff.map((s: any) => ({
    id: String(s._id),
    name: s.name,
    email: s.email,
    role: s.role,
    permissions:
      s.permissions && s.permissions.length
        ? s.permissions
        : (rolePerms.get(s.role) ?? []),
    lastLogin: s.lastLoginAt ?? null,
    status: s.status ?? 'active',
    avatar: s.avatar ?? '',
    createdAt: s.createdAt,
  }));
}

export const requireAdmin = createMiddleware().server(async ({ next, context }) => {
  const auth = (context as any)?.auth as
    | { userId: string; role: string }
    | undefined;

  if (!auth) {
    return Response.json(
      {
        success: false,
        data: null,
        error: { code: 'UNAUTHORIZED', message: 'Chưa đăng nhập' },
      },
      { status: 401 },
    );
  }

  if (!ADMIN_ROLES.includes(auth.role as (typeof ADMIN_ROLES)[number])) {
    return Response.json(
      {
        success: false,
        data: null,
        error: {
          code: 'FORBIDDEN',
          message: 'Chỉ quản trị viên mới được truy cập khu vực này',
        },
      },
      { status: 403 },
    );
  }

  return next();
});

export function requirePermission(permission: string) {
  return createMiddleware().server(async ({ next, context }) => {
    const auth = (context as any)?.auth as
      | { userId: string; role: string }
      | undefined;

    if (!auth) {
      return Response.json(
        {
          success: false,
          data: null,
          error: { code: 'UNAUTHORIZED', message: 'Chưa đăng nhập' },
        },
        { status: 401 },
      );
    }

    if (!ADMIN_ROLES.includes(auth.role as (typeof ADMIN_ROLES)[number])) {
      return Response.json(
        {
          success: false,
          data: null,
          error: {
            code: 'FORBIDDEN',
            message: 'Chỉ quản trị viên mới được truy cập khu vực này',
          },
        },
        { status: 403 },
      );
    }

    if (auth.role === 'ADMIN') return next();

    const user = await UserModel.findById(auth.userId)
      .select('role permissions')
      .lean();

    if (!user) {
      return Response.json(
        {
          success: false,
          data: null,
          error: { code: 'UNAUTHORIZED', message: 'Chưa đăng nhập' },
        },
        { status: 401 },
      );
    }

    const granted =
      user.permissions && user.permissions.length
        ? user.permissions
        : await getRolePermissions(user.role);

    if (!granted.includes(permission)) {
      return Response.json(
        {
          success: false,
          data: null,
          error: {
            code: 'FORBIDDEN',
            message: `Bạn không có quyền "${permission}" để thực hiện thao tác này.`,
          },
        },
        { status: 403 },
      );
    }

    return next();
  });
}
