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
      /** Chi tiết đơn hàng. */
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

      /**
       * Admin cập nhật trạng thái đơn (dùng cho chức năng "xử lý đơn hàng"
       * trên bảng quản trị). Trạng thái customer được áp dụng cho toàn bộ
       * sub-order của đơn.
       */
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

        // Ánh xạ trạng thái customer -> trạng thái seller cho từng sub-order.
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

        // Lưu trạng thái **trước khi** ghi đè, để biết sub-order nào còn ở
        // kho (được hoàn tồn kho) và sub-order nào đã giao (không hoàn).
        const previousStatuses = new Map<string, string>(
          (order.subOrders ?? []).map((s: any) => [
            String(s._id),
            String(s.status),
          ]),
        );

        // Hoàn tồn kho CHỈ khi đơn chuyển sang `cancelled`.
        //
        // `restoreStockForSubOrders` tự lọc theo trạng thái cũ của sub-order
        // (chỉ hoàn `pending`/`confirmed`/`preparing`), nên gọi nó ở mọi lần
        // đổi trạng thái sẽ hoàn kho oan khi đơn chuyển `pending -> confirmed`
        // và làm `sold` bị trừ quá mức. Vì vậy phải khoá theo `cancelled`.
        if (body.status === CustomerOrderStatus.CANCELLED) {
          // Chỉ hoàn những sub-order **thực sự chuyển sang cancelled** lần này
          // (sub-order đã cancelled trước đó thì không hoàn lại).
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
          // Hoàn tiền các giao dịch của đơn bị huỷ, để doanh thu & phí sàn
          // của seller không tính cho đơn đã huỷ.
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

      /** Hoàn tiền cho đơn (đồng bộ trạng thái giao dịch + đơn). */
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
