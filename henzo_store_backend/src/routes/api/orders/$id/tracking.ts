import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { requireAuth } from '@/server/middleware/auth';
import { withErrorHandling } from '@/server/http/handler';
import { ok } from '@/server/http/response';
import { notFound, forbidden } from '@/server/http/errors';
import { OrderModel } from '@/server/models/Order';
import { connectDB } from '@/server/db';

export const Route = createFileRoute('/api/orders/$id/tracking')({
  server: {
    middleware: [corsMiddleware, requireAuth],
    handlers: {
      /** Theo dõi vận chuyển: timeline + mã vận đơn. */
      GET: withErrorHandling(async ({ params, context }) => {
        await connectDB();

        const order =
          (await OrderModel.findById(params.id).lean()) ??
          (await OrderModel.findOne({ orderNumber: params.id }).lean());

        if (!order) throw notFound('Không tìm thấy đơn hàng');

        const isOwner = String(order.customerId) === context.auth.userId;
        const isStaff =
          context.auth.role === 'ADMIN' ||
          (context.auth.role === 'SHOP' &&
            (order.subOrders ?? []).some(
              (s: any) => String(s.storeId) === String(context.auth.storeId),
            ));

        if (!isOwner && !isStaff) {
          throw forbidden('Không có quyền xem thông tin vận chuyển này');
        }

        return ok({
          orderId: String(order._id),
          orderNumber: order.orderNumber,
          status: order.status,
          shippingUpdates: (order.shippingUpdates ?? []).map((u: any) => ({
            id: String(u._id),
            orderId: String(order._id),
            status: u.status,
            location: u.location ?? '',
            timestamp: u.timestamp,
            description: u.description ?? '',
          })),
          subOrders: (order.subOrders ?? []).map((s: any) => ({
            storeId: String(s.storeId),
            storeName: s.storeName ?? '',
            status: s.status,
            trackingNumber: s.trackingNumber ?? '',
            shippingPartner: s.shippingPartner ?? '',
            estimatedDelivery: s.estimatedDelivery ?? null,
            deliveredAt: s.deliveredAt ?? null,
            statusHistory: (s.statusHistory ?? []).map((h: any) => ({
              status: h.status,
              at: h.at,
              note: h.note ?? '',
            })),
          })),
        });
      }),
    },
  },
});
