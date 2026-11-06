import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { requireAuth } from '@/server/middleware/auth';
import { withErrorHandling } from '@/server/http/handler';
import { ok } from '@/server/http/response';
import { notFound, forbidden, badRequest } from '@/server/http/errors';
import { readJson } from '@/server/http/request';
import { z } from 'zod';
import { OrderModel, toCustomerOrder } from '@/server/models/Order';
import { PaymentModel } from '@/server/models/Payment';
import { NotificationModel } from '@/server/models/Notification';
import {
  canRestoreSubOrder,
  restoreStockForSubOrders,
} from '@/server/services/inventory.service';
import {
  CustomerOrderStatus,
  ORDER_CANCEL_WINDOW_MS,
  SellerOrderStatus,
  TransactionStatus,
} from '@/server/constants';
import { connectDB } from '@/server/db';

const cancelSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

export const Route = createFileRoute('/api/orders/$id/cancel')({
  server: {
    middleware: [corsMiddleware, requireAuth],
    handlers: {
      /**
       * Khách huỷ đơn.
       * Chỉ huỷ được trong 1 giờ đầu và khi đơn chưa được xác nhận.
       */
      POST: withErrorHandling(async ({ request, params, context }) => {
        await connectDB();
        const body = await readJson(request, cancelSchema).catch(
          () => ({ reason: undefined }) as z.infer<typeof cancelSchema>,
        );

        const order = await OrderModel.findById(params.id);
        if (!order) throw notFound('Không tìm thấy đơn hàng');

        const isOwner = String(order.customerId) === context.auth.userId;
        const isAdmin = context.auth.role === 'ADMIN';
        if (!isOwner && !isAdmin) {
          throw forbidden('Không có quyền huỷ đơn hàng này');
        }

        if (order.status === CustomerOrderStatus.CANCELLED) {
          throw badRequest('Đơn hàng đã được huỷ trước đó');
        }
        if (order.status === CustomerOrderStatus.DELIVERED) {
          throw badRequest('Đơn hàng đã giao, không thể huỷ. Vui lòng liên hệ hỗ trợ.');
        }

        // Quyền huỷ trong 1 giờ đầu (trừ admin).
        if (!isAdmin) {
          const elapsed = Date.now() - new Date(order.createdAt).getTime();
          if (elapsed > ORDER_CANCEL_WINDOW_MS) {
            throw badRequest(
              'Đã quá thời gian cho phép huỷ đơn. Vui lòng liên hệ hỗ trợ để được xử lý.',
            );
          }
          const hasStarted = (order.subOrders ?? []).some((s: any) =>
            [SellerOrderStatus.CONFIRMED, SellerOrderStatus.PREPARING].includes(
              s.status,
            ),
          );
          if (hasStarted) {
            throw badRequest(
              'Cửa hàng đã bắt đầu xử lý đơn hàng. Vui lòng liên hệ hỗ trợ.',
            );
          }
        }

        // Huỷ các sub-order chưa xử lý.
        // Chỉ những sub-order **thực sự chuyển sang cancelled** mới được hoàn
        // tồn kho. Sub-order đã giao (`shipped`/`delivering`/`delivered`) giữ
        // nguyên trạng thái và không hoàn kho — hàng đã rời kho.
        const cancellable = (order.subOrders ?? []).filter(
          (s: any) =>
            ![
              SellerOrderStatus.SHIPPED,
              SellerOrderStatus.DELIVERING,
              SellerOrderStatus.DELIVERED,
            ].includes(s.status as any),
        );

        /**
         * Hoàn tồn kho TRƯỚC khi đổi trạng thái.
         *
         * `restoreStockForSubOrders` chỉ hoàn sub-order còn ở kho
         * (`pending`/`confirmed`/`preparing`), nên:
         * - Hủy lần 2 sẽ không cộng tồn kho thêm (idempotent).
         * - Sub-order đã giao không bao giờ bị hoàn kho.
         */
        const restoreTargets = cancellable.map((s: any) => ({
          ...s.toObject?.() ?? s,
        }));
        await restoreStockForSubOrders(restoreTargets);

        for (const sub of cancellable) {
          sub.status = SellerOrderStatus.CANCELLED;
          sub.statusHistory.push({
            status: SellerOrderStatus.CANCELLED,
            at: new Date(),
            note: body.reason || 'Khách hàng huỷ đơn',
          } as any);
        }

        // Trạng thái tổng của đơn được suy ra từ các sub-order còn lại.
        // Nếu một shop đã giao hàng, đơn không thể mang trạng thái "đã huỷ"
        // toàn cục — nó chuyển sang "đang vận chuyển" cho tới khi shop đó giao
        // xong, đồng thời phần đã huỷ vẫn được hoàn tồn kho.
        const hasShipped = (order.subOrders ?? []).some((s: any) =>
          [
            SellerOrderStatus.SHIPPED,
            SellerOrderStatus.DELIVERING,
            SellerOrderStatus.DELIVERED,
          ].includes(s.status as any),
        );

        order.status = hasShipped
          ? CustomerOrderStatus.SHIPPING
          : CustomerOrderStatus.CANCELLED;

        if (!hasShipped) {
          order.cancelReason = body.reason ?? 'Khách hàng huỷ đơn';
          order.cancelledAt = new Date();
          order.shippingUpdates.push({
            status: 'cancelled',
            location: '',
            description: `Đơn hàng đã được huỷ. ${order.cancelReason}`,
          } as any);
        } else {
          order.shippingUpdates.push({
            status: 'cancelled',
            location: '',
            description: `Một phần đơn hàng đã được huỷ. ${body.reason ?? 'Khách hàng huỷ đơn'}`,
          } as any);
        }

        await order.save();

        /**
         * Hoàn tiền cho các giao dịch của đơn bị huỷ.
         *
         * Trước đây chỉ có admin action `refund` mới cập nhật trạng thái
         * payment — nên đơn khách tự huỷ vẫn giữ payment `success`, khiến
         * doanh thu & phí sàn của seller tính cho cả đơn đã huỷ.
         *
         * Chỉ hoàn các giao dịch của store bị huỷ, để không ảnh hưởng tới
         * phần đơn của store khác còn đang giao.
         */
        const cancelledStoreIds = cancellable.map((s: any) => String(s.storeId));
        if (cancelledStoreIds.length) {
          await PaymentModel.updateMany(
            {
              orderId: order._id,
              storeId: { $in: cancelledStoreIds },
              status: { $in: [TransactionStatus.SUCCESS, TransactionStatus.PENDING] },
            },
            { $set: { status: TransactionStatus.REFUNDED, refundedAt: new Date() } },
          );
        }

        await NotificationModel.create({
          userId: order.customerId,
          type: 'order',
          title: 'Đơn hàng đã được huỷ',
          message: `Đơn hàng ${order.orderNumber} đã được huỷ. Lý do: ${order.cancelReason}`,
          isRead: false,
          link: `/account/orders/${order._id}`,
          isSystem: true,
        });

        return ok(toCustomerOrder(order));
      }),
    },
  },
});
