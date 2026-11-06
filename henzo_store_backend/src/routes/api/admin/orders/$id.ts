import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { requireAuth } from '@/server/middleware/auth';
import { requireAdmin } from '@/server/middleware/admin';
import { withErrorHandling } from '@/server/http/handler';
import { ok } from '@/server/http/response';
import { readJson } from '@/server/http/request';
import { z } from 'zod';
import { OrderModel, toAdminOrder } from '@/server/models/Order';
import { PaymentModel, toAdminPaymentDto } from '@/server/models/Payment';
import {
  canRestoreSubOrder,
  restoreStockForSubOrders,
} from '@/server/services/inventory.service';
import {
  CustomerOrderStatus,
  OrderPaymentStatus,
  SellerOrderStatus,
  TransactionStatus,
} from '@/server/constants';
import { notFound, badRequest } from '@/server/http/errors';
import { connectDB } from '@/server/db';

const statusSchema = z.object({
  status: z.enum(Object.values(CustomerOrderStatus)),
  note: z.string().trim().max(500).optional().default(''),
});

export const Route = createFileRoute('/api/admin/orders/$id')({
  server: {
    middleware: [corsMiddleware, requireAuth, requireAdmin],
    handlers: {
            GET: withErrorHandling(async ({ params }) => {
        await connectDB();

        const order = await OrderModel.findById(params.id).lean();
        if (!order) throw notFound('Không tìm thấy đơn hàng');

        const payments = await PaymentModel.find({ orderId: order._id })
          .populate('storeId', 'name')
          .sort({ createdAt: -1 })
          .lean();

        return ok({
          order: toAdminOrder(order),
          payments: payments.map(toAdminPaymentDto),
        });
      }),

            PATCH: withErrorHandling(async ({ request, params }) => {
        await connectDB();
        const body = await readJson(request, statusSchema);

        const order = await OrderModel.findById(params.id);
        if (!order) throw notFound('Không tìm thấy đơn hàng');

        if (
          order.status === CustomerOrderStatus.DELIVERED &&
          body.status !== CustomerOrderStatus.DELIVERED
        ) {
          throw badRequest(
            'Đơn hàng đã hoàn thành không thể chuyển ngược trạng thái.',
          );
        }

        const target =
          body.status === CustomerOrderStatus.CANCELLED
            ? SellerOrderStatus.CANCELLED
            : body.status === CustomerOrderStatus.PROCESSING
              ? SellerOrderStatus.PREPARING
              : body.status === CustomerOrderStatus.SHIPPING
                ? SellerOrderStatus.DELIVERING
                : body.status === CustomerOrderStatus.DELIVERED
                  ? SellerOrderStatus.DELIVERED
                  : body.status;

        order.status = body.status;

        const previousStatuses = new Map<string, string>(
          (order.subOrders ?? []).map((s: any) => [
            String(s._id),
            String(s.status),
          ]),
        );

        if (body.status === CustomerOrderStatus.CANCELLED) {

          const restoreTargets = (order.subOrders ?? [])
            .filter((s: any) => {
              const prev = previousStatuses.get(String(s._id));
              return prev !== SellerOrderStatus.CANCELLED &&
                canRestoreSubOrder(prev ?? '');
            })
            .map((s: any) => ({ ...(s.toObject?.() ?? s) }));
          await restoreStockForSubOrders(restoreTargets);
        }

        order.subOrders.forEach((sub: any) => {
          sub.status = target;
          sub.statusHistory = sub.statusHistory ?? [];
          sub.statusHistory.push({
            status: target,
            at: new Date(),
            note: body.note || 'Admin cập nhật trạng thái',
          });
        });

        if (body.status === CustomerOrderStatus.CANCELLED) {

          const cancelledStoreIds = (order.subOrders ?? []).map((s: any) =>
            String(s.storeId),
          );
          if (cancelledStoreIds.length) {
            await PaymentModel.updateMany(
              {
                orderId: order._id,
                storeId: { $in: cancelledStoreIds },
                status: {
                  $in: [TransactionStatus.SUCCESS, TransactionStatus.PENDING],
                },
              },
              {
                $set: {
                  status: TransactionStatus.REFUNDED,
                  refundedAt: new Date(),
                },
              },
            );
          }

          order.cancelledAt = new Date();
          order.cancelReason = body.note || 'Admin huỷ đơn hàng';
        }

        await order.save();

        return ok(toAdminOrder(order));
      }),

            POST: withErrorHandling(async ({ request, params }) => {
        await connectDB();
        const body = (await request.json().catch(() => ({}))) as {
          action?: string;
          note?: string;
        };

        const order = await OrderModel.findById(params.id);
        if (!order) throw notFound('Không tìm thấy đơn hàng');

        if (body.action === 'refund') {
          await PaymentModel.updateMany(
            { orderId: order._id },
            { $set: { status: 'refunded', refundedAt: new Date() } },
          );
          order.paymentStatus = OrderPaymentStatus.REFUNDED;
          await order.save();
          return ok(toAdminOrder(order));
        }

        if (body.action === 'markPaid') {
          await PaymentModel.updateMany(
            { orderId: order._id, status: 'pending' },
            { $set: { status: 'success' } },
          );
          order.paymentStatus = OrderPaymentStatus.PAID;
          await order.save();
          return ok(toAdminOrder(order));
        }

        throw badRequest('Hành động không hợp lệ.');
      }),
    },
  },
});
