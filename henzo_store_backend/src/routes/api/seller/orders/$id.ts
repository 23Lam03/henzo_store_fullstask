import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { requireAuth } from '@/server/middleware/auth';
import { requireStoreOwner } from '@/server/middleware/store';
import { withErrorHandling } from '@/server/http/handler';
import { ok } from '@/server/http/response';
import { notFound, forbidden } from '@/server/http/errors';
import { getStoreScope } from '@/server/http/store-scope';
import { OrderModel, toSellerOrder } from '@/server/models/Order';
import { connectDB } from '@/server/db';

export const Route = createFileRoute('/api/seller/orders/$id')({
  server: {
    middleware: [corsMiddleware, requireAuth, requireStoreOwner],
    handlers: {
            GET: withErrorHandling(async ({ params, context }) => {
        await connectDB();
        const scope = getStoreScope(context);

        const order = await OrderModel.findById(params.id).lean();
        if (!order) throw notFound('Không tìm thấy đơn hàng');

        const storeId = scope.storeId;

        const owns = (order.subOrders ?? []).some(
          (s: any) => String(s.storeId) === String(storeId),
        );
        if (!owns) throw forbidden('Đơn hàng không thuộc cửa hàng của bạn');

        return ok({
          ...toSellerOrder(order, storeId),
          customerAddress: order.shippingAddress ?? '',
          note: order.note ?? '',
          subOrder: (order.subOrders ?? []).find(
            (s: any) => String(s.storeId) === String(storeId),
          ),
        });
      }),
    },
  },
});
