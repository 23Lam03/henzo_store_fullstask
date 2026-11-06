import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { requireAuth } from '@/server/middleware/auth';
import { requireAdmin, requirePermission } from '@/server/middleware/admin';
import { withErrorHandling } from '@/server/http/handler';
import { ok } from '@/server/http/response';
import { readJson } from '@/server/http/request';
import { z } from 'zod';
import {
  getPermissionMatrix,
  setRolePermissions,
} from '@/server/services/rbac.service';
import { UserModel } from '@/server/models/User';
import { connectDB } from '@/server/db';

const roleSchema = z.object({
  role: z.string().trim().min(1).max(30),
  permissions: z.array(z.string()).min(1, 'Chọn ít nhất một quyền.'),
});

export const Route = createFileRoute('/api/admin/access/roles')({
  server: {
    middleware: [corsMiddleware, requireAuth, requireAdmin, requirePermission('Phân quyền')],
    handlers: {
            GET: withErrorHandling(async () => {
        await connectDB();
        return ok(await getPermissionMatrix());
      }),

            PUT: withErrorHandling(async ({ request }) => {
        await connectDB();
        const body = await readJson(request, roleSchema);

        const permissions = await setRolePermissions(
          body.role,
          body.permissions,
        );

        await UserModel.updateMany(
          {
            role: body.role.toUpperCase() as never,
            $or: [
              { permissions: { $size: 0 } },
              { permissions: { $exists: false } },
            ],
          },
          { $set: { permissions } },
        );

        return ok({ role: body.role.toUpperCase(), permissions, updated: true });
      }),
    },
  },
});
