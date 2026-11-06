import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { requireAuth } from '@/server/middleware/auth';
import { withErrorHandling } from '@/server/http/handler';
import { ok } from '@/server/http/response';
import { notFound, forbidden } from '@/server/http/errors';
import { OrderModel, toCustomerOrder } from '@/server/models/Order';
import { connectDB } from '@/server/db';

export const Route = createFileRoute('/api/orders/$id')({
  server: {
    middleware: [corsMiddleware, requireAuth],
    handlers: {
      GET: withErrorHandling(async ({ params, context }) => {
        await connectDB();

        const order =
          (await OrderModel.findById(params.id).lean()) ??
          (await OrderModel.findOne({ orderNumber: params.id }).lean());

        if (!order) throw notFound('Không tìm thấy đơn hàng');

        // Khách chỉ xem được đơn của mình; admin thì xem được tất cả.
        const isOwner = String(order.customerId) === context.auth.userId;
        const isAdmin = context.auth.role === 'ADMIN';
        if (!isOwner && !isAdmin) {
          throw forbidden('Không có quyền xem đơn hàng này');
        }

        return ok(toCustomerOrder(order));
      }),
    },
  },
});
