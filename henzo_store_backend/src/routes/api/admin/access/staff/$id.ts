import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { requireAuth } from '@/server/middleware/auth';
import { requireAdmin, requirePermission } from '@/server/middleware/admin';
import { withErrorHandling } from '@/server/http/handler';
import { ok } from '@/server/http/response';
import { readJson } from '@/server/http/request';
import { z } from 'zod';
import { UserModel, toAdminUser } from '@/server/models/User';
import { getRolePermissions } from '@/server/services/rbac.service';
import { notFound, badRequest, conflict } from '@/server/http/errors';
import { connectDB } from '@/server/db';

const updateSchema = z.object({
  name: z.string().trim().min(1, 'Vui lòng nhập họ tên.').max(120).optional(),
  email: z.string().trim().email('Email không hợp lệ.').optional(),
  role: z.enum(['ADMIN', 'MODERATOR', 'STAFF']).optional(),
  permissions: z.array(z.string()).optional(),
  status: z.enum(['active', 'locked']).optional(),
});

export const Route = createFileRoute('/api/admin/access/staff/$id')({
  server: {
    middleware: [corsMiddleware, requireAuth, requireAdmin, requirePermission('Phân quyền')],
    handlers: {
      /** Chi tiết nhân sự. */
      GET: withErrorHandling(async ({ params }) => {
        await connectDB();
        const user = await UserModel.findById(params.id).lean();
        if (!user) throw notFound('Không tìm thấy thành viên');
        return ok(toAdminUser(user));
      }),

      /** Sửa thông tin / vai trò / quyền hạn / trạng thái. */
      PATCH: withErrorHandling(async ({ request, params }) => {
        await connectDB();
        const body = await readJson(request, updateSchema);

        const user = await UserModel.findById(params.id);
        if (!user) throw notFound('Không tìm thấy thành viên');

        if (body.email && body.email.toLowerCase() !== user.email) {
          const dup = await UserModel.findOne({
            email: body.email.toLowerCase(),
            _id: { $ne: user._id },
          });
          if (dup) throw conflict('Email đã được sử dụng.');
          user.email = body.email.toLowerCase();
        }

        if (body.name !== undefined) user.name = body.name;

        // Đổi vai trò -> reset quyền về mặc định nếu không chỉ định quyền mới.
        if (body.role !== undefined && body.role !== user.role) {
          user.role = body.role;
          if (!body.permissions) {
            user.permissions = await getRolePermissions(body.role);
          }
        }

        if (body.permissions !== undefined) {
          user.permissions = body.permissions;
        }

        if (body.status !== undefined) user.status = body.status;

        await user.save();
        return ok(toAdminUser(user));
      }),

      /** Xoá nhân sự (không cho xoá chính mình). */
      DELETE: withErrorHandling(async ({ params, context }) => {
        await connectDB();

        const auth = context.auth as { userId: string };
        if (String(auth.userId) === String(params.id)) {
          throw badRequest('Không thể xoá tài khoản của chính bạn.');
        }

        const user = await UserModel.findById(params.id);
        if (!user) throw notFound('Không tìm thấy thành viên');

        await UserModel.deleteOne({ _id: user._id });
        return ok({ id: String(user._id), deleted: true });
      }),
    },
  },
});
