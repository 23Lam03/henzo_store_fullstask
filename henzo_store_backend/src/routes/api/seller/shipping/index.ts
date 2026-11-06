import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { requireAuth } from '@/server/middleware/auth';
import { requireStoreOwner } from '@/server/middleware/store';
import { withErrorHandling } from '@/server/http/handler';
import { ok } from '@/server/http/response';
import { readPagination } from '@/server/http/request';
import { getStoreScope } from '@/server/http/store-scope';
import { OrderModel } from '@/server/models/Order';
import { ShippingModel, toShippingDto } from '@/server/models/Shipping';
import { ShippingStatus } from '@/server/constants';
import { badRequest, notFound, forbidden } from '@/server/http/errors';
import { connectDB } from '@/server/db';

export const Route = createFileRoute('/api/seller/shipping/')({
  server: {
    middleware: [corsMiddleware, requireAuth, requireStoreOwner],
    handlers: {
            GET: withErrorHandling(async ({ request, context }) => {
        await connectDB();
        const scope = getStoreScope(context);

        const url = new URL(request.url);
        const sp = url.searchParams;
        const { page, pageSize } = readPagination(sp);

        const filter: Record<string, any> = scope.filter();
        if (sp.get('status')) filter.status = sp.get('status');

        const [docs, total, counts] = await Promise.all([
          ShippingModel.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .lean(),
          ShippingModel.countDocuments(filter),

          ShippingModel.aggregate([
            { $match: scope.aggMatch() },
            { $group: { _id: '$status', count: { $sum: 1 } } },
          ]),
        ]);

        const statusCounts: Record<string, number> = {};
        for (const s of Object.values(ShippingStatus)) statusCounts[s] = 0;
        for (const c of counts) statusCounts[c._id] = c.count;

        return ok(
          { shippings: docs.map(toShippingDto), statusCounts },
          {
            page,
            pageSize,
            total,
            totalPages: Math.max(1, Math.ceil(total / pageSize)),
          },
        );
      }),

            POST: withErrorHandling(async ({ request, context }) => {
        await connectDB();

        const storeId = getStoreScope(context).require();
        const body = (await request.json().catch(() => ({}))) as {
          orderId?: string;
          carrier?: string;
          trackingNumber?: string;
          weight?: number;
          dimensions?: string;
          shippingFee?: number;
        };

        if (!body.orderId) throw badRequest('Thiếu mã đơn hàng.');

        const order = await OrderModel.findById(body.orderId).lean();
        if (!order) throw notFound('Không tìm thấy đơn hàng');

        const sub = (order.subOrders ?? []).find(
          (s: any) => String(s.storeId) === String(storeId),
        );
        if (!sub) {
          throw forbidden('Đơn hàng không thuộc cửa hàng của bạn');
        }

        const shipping = await ShippingModel.create({
          orderId: order._id,
          orderCode: order.orderNumber,
          storeId,
          trackingNumber: body.trackingNumber ?? sub.trackingNumber ?? '',
          carrier: body.carrier ?? sub.shippingPartner ?? '',
          status: ShippingStatus.WAITING_PICKUP,
          receiverName: order.customerName,
          receiverPhone: order.customerPhone,
          receiverAddress: order.shippingAddress,
          weight: body.weight ?? 0,
          dimensions: body.dimensions ?? '',
          shippingFee: body.shippingFee ?? sub.shippingFee ?? 0,
          codAmount:
            order.paymentMethod === 'cod' ? (sub.totalPrice ?? 0) : 0,
          estimatedDelivery: sub.estimatedDelivery,
        });

        return ok(toShippingDto(shipping), undefined, 201);
      }),
    },
  },
});
