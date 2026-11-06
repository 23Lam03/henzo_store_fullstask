/**
 * Middleware cho khu vực quản trị (`/api/admin/*`).
 *
 * Nguyên tắc RBAC của hệ thống Henzo:
 *   - `ADMIN`     : toàn quyền.
 *   - `MODERATOR` : kiểm duyệt sản phẩm/đánh giá + xem báo cáo.
 *   - `STAFF`     : xem đơn hàng + hỗ trợ khách hàng.
 *   - `SHOP`      : không được vào khu vực admin.
 *
 * Mỗi endpoint admin khai báo quyền cụ thể qua `requirePermission(...)`;
 * middleware này chỉ chặn ở mức "vào khu vực admin".
 */
import { createMiddleware } from '@tanstack/react-start';
import { UserModel } from '../models/User';
import { getRolePermissions } from '../services/rbac.service';

/** Vai trò được phép truy cập khu vực quản trị. */
export const ADMIN_ROLES = ['ADMIN', 'MODERATOR', 'STAFF'] as const;

/**
 * Nhân sự quản trị (role khác CUSTOMER/SHOP) — dùng cho màn hình phân quyền.
 */
export async function listAdminStaff() {
  const staff = await UserModel.find({
    role: { $in: ['ADMIN', 'MODERATOR', 'STAFF'] },
  })
    .select('name email role permissions status lastLoginAt createdAt avatar')
    .sort({ createdAt: -1 })
    .lean();

  // Quyền mặc định theo vai trò (có thể bị admin ghi đè trong DB).
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

/**
 * Yêu cầu role thuộc khu vực admin.
 * Trả về Response 401/403 trực tiếp nếu không đủ quyền.
 */
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

/**
 * Yêu cầu một quyền hạn cụ thể (theo tên tiếng Việt trong ma trận quyền).
 * `ADMIN` luôn có mọi quyền.
 */
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

    // Đọc quyền tuỳ chỉnh của nhân sự (có thể gán thêm/bớt quyền).
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
