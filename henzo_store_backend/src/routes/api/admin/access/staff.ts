import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { requireAuth } from '@/server/middleware/auth';
import { requireAdmin, requirePermission, listAdminStaff } from '@/server/middleware/admin';
import { withErrorHandling } from '@/server/http/handler';
import { ok } from '@/server/http/response';
import { readJson } from '@/server/http/request';
import { z } from 'zod';
import { UserModel, toAdminUser } from '@/server/models/User';
import { hashPassword } from '@/server/auth/tokens';
import { getPermissionMatrix, getRolePermissions } from '@/server/services/rbac.service';
import { ALL_PERMISSIONS } from '@/server/constants';
import { conflict } from '@/server/http/errors';
import { connectDB } from '@/server/db';

const staffSchema = z.object({
  name: z.string().trim().min(1, 'Vui lòng nhập họ tên.').max(120),
  email: z.string().trim().email('Email không hợp lệ.'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự.').max(100),
  role: z.enum(['ADMIN', 'MODERATOR', 'STAFF']),
  permissions: z.array(z.string()).optional().default([]),
});

export const Route = createFileRoute('/api/admin/access/staff')({
  server: {
    middleware: [corsMiddleware, requireAuth, requireAdmin, requirePermission('Phân quyền')],
    handlers: {
            GET: withErrorHandling(async ({ request }) => {
        await connectDB();
        const url = new URL(request.url);
        const sp = url.searchParams;

        const roleFilter = sp.get('role');
        const search = (sp.get('search') ?? '').trim();

        const allStaff = await listAdminStaff();

        let staff = allStaff;
        if (roleFilter && roleFilter !== 'all') {
          staff = allStaff.filter((s) => s.role === roleFilter);
        }

        if (search) {
          const lower = search.toLowerCase();
          staff = allStaff.filter(
            (s) =>
              s.name.toLowerCase().includes(lower) ||
              s.email.toLowerCase().includes(lower),
          );
        }

        const roleCounts: Record<string, number> = {
          ADMIN: 0,
          MODERATOR: 0,
          STAFF: 0,
          SHOP: 0,
        };
        for (const s of allStaff) {
          roleCounts[s.role] = (roleCounts[s.role] ?? 0) + 1;
        }

        const { roles, matrix } = await getPermissionMatrix();

        return ok({
          staff,
          roles: roles.map((r) => ({ ...r, count: roleCounts[r.name] ?? 0 })),
          permissions: ALL_PERMISSIONS,
          matrix,
        });
      }),

            POST: withErrorHandling(async ({ request }) => {
        await connectDB();
        const body = await readJson(request, staffSchema);

        const email = body.email.toLowerCase();
        const exists = await UserModel.findOne({ email });
        if (exists) throw conflict('Email đã được sử dụng.');

        const permissions =
          body.permissions.length > 0
            ? body.permissions
            : await getRolePermissions(body.role);

        const user = await UserModel.create({
          name: body.name,
          email,
          password: await hashPassword(body.password),
          role: body.role,
          permissions,
          status: 'active',
        });

        return ok(toAdminUser(user), undefined, 201);
      }),
    },
  },
});
