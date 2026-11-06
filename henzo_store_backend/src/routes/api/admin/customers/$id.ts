import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { requireAuth } from '@/server/middleware/auth';
import { requireAdmin, requirePermission } from '@/server/middleware/admin';
import { withErrorHandling } from '@/server/http/handler';
import { ok } from '@/server/http/response';
import { readJson } from '@/server/http/request';
import { z } from 'zod';
import { UserModel, toAdminUser } from '@/server/models/User';
import { OrderModel } from '@/server/models/Order';
import { notFound, badRequest } from '@/server/http/errors';
import { connectDB } from '@/server/db';

const updateSchema = z.object({
  name: z.string().trim().min(1, 'Vui lòng nhập họ tên.').max(120).optional(),
  email: z.string().trim().email('Email không hợp lệ.').optional(),
  phone: z.string().trim().max(30).optional(),
  address: z.string().trim().max(500).optional(),
  avatar: z.string().trim().max(1000).optional(),
  points: z.coerce.number().int().min(0).optional(),
});

const actionSchema = z.object({
  action: z.enum(['lock', 'unlock']),
});

export const Route = createFileRoute('/api/admin/customers/$id')({
  server: {
    middleware: [corsMiddleware, requireAuth, requireAdmin, requirePermission('Quản lý khách hàng')],
    handlers: {
            GET: withErrorHandling(async ({ params }) => {
        await connectDB();

        const user = await UserModel.findById(params.id).lean();
        if (!user) throw notFound('Không tìm thấy khách hàng');

        const orders = await OrderModel.find({ customerId: user._id })
          .sort({ createdAt: -1 })
          .limit(20)
          .lean();

        const stats = orders.reduce(
          (acc: any, o: any) => {
            if (o.status === 'cancelled') {
              acc.cancelled += 1;
            } else {
              acc.completed += 1;
              acc.totalSpent += o.totalPrice ?? 0;
            }
            return acc;
          },
          { total: orders.length, completed: 0, cancelled: 0, totalSpent: 0 },
        );

        return ok({
          customer: toAdminUser(user),
          stats,
          orders: orders.map((o: any) => ({
            id: String(o._id),
            orderNumber: o.orderNumber,
            totalPrice: o.totalPrice,
            status: o.status,
            createdAt: o.createdAt,
          })),
        });
      }),

            PATCH: withErrorHandling(async ({ request, params }) => {
        await connectDB();
        const body = await readJson(request, updateSchema);

        const user = await UserModel.findById(params.id);
        if (!user) throw notFound('Không tìm thấy khách hàng');

        if (body.name !== undefined) user.name = body.name;
        if (body.email !== undefined) user.email = body.email.toLowerCase();
        if (body.phone !== undefined) user.phone = body.phone;
        if (body.address !== undefined) user.address = body.address;
        if (body.avatar !== undefined) user.avatar = body.avatar;
        if (body.points !== undefined) user.points = body.points;

        await user.save();
        return ok(toAdminUser(user));
      }),

            POST: withErrorHandling(async ({ request, params }) => {
        await connectDB();
        const body = await readJson(request, actionSchema);

        const user = await UserModel.findById(params.id);
        if (!user) throw notFound('Không tìm thấy khách hàng');

        if (user.role !== 'CUSTOMER') {
          throw badRequest('Chỉ áp dụng thao tác này cho tài khoản khách hàng.');
        }

        user.status = body.action === 'lock' ? 'locked' : 'active';
        await user.save();

        return ok(toAdminUser(user));
      }),

            DELETE: withErrorHandling(async ({ params }) => {
        await connectDB();

        const user = await UserModel.findById(params.id);
        if (!user) throw notFound('Không tìm thấy khách hàng');
        if (user.role !== 'CUSTOMER') {
          throw badRequest(
            'Không thể xoá tài khoản không phải khách hàng.',
          );
        }

        await UserModel.deleteOne({ _id: user._id });
        return ok({ id: String(user._id), deleted: true });
      }),
    },
  },
});
