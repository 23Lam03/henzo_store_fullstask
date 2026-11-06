import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { requireAuth } from '@/server/middleware/auth';
import { requireAdmin, requirePermission } from '@/server/middleware/admin';
import { withErrorHandling } from '@/server/http/handler';
import { ok } from '@/server/http/response';
import { readJson, readPagination, buildMeta } from '@/server/http/request';
import { PaymentModel, toAdminPaymentDto } from '@/server/models/Payment';
import { OrderModel } from '@/server/models/Order';
import { z } from 'zod';
import {
  AdminPaymentStatus,
  OrderPaymentStatus,
  TransactionStatus,
} from '@/server/constants';
import { notFound, badRequest } from '@/server/http/errors';
import { connectDB } from '@/server/db';

const refundSchema = z.object({
  paymentId: z.string().min(1, 'Thiếu mã giao dịch.'),
  reason: z.string().trim().max(500).optional(),
});

export const Route = createFileRoute('/api/admin/payments/')({
  server: {
    middleware: [corsMiddleware, requireAuth, requireAdmin, requirePermission('Quản lý thanh toán')],
    handlers: {
            GET: withErrorHandling(async ({ request }) => {
        await connectDB();
        const url = new URL(request.url);
        const sp = url.searchParams;
        const { page, pageSize } = readPagination(sp);

        const filter: Record<string, any> = {};

        const status = sp.get('status');
        if (status && status !== 'all') {
          const map: Record<string, string> = {
            [AdminPaymentStatus.COMPLETED]: TransactionStatus.SUCCESS,
            [AdminPaymentStatus.PENDING]: TransactionStatus.PENDING,
            [AdminPaymentStatus.FAILED]: TransactionStatus.FAILED,
            [AdminPaymentStatus.REFUNDED]: TransactionStatus.REFUNDED,
          };
          filter.status = map[status] ?? status;
        }

        const method = sp.get('method');
        if (method && method !== 'all') filter.method = method;

        const search = (sp.get('search') ?? '').trim();
        if (search) {
          const rx = new RegExp(escapeRegex(search), 'i');
          filter.$or = [{ transactionId: rx }, { orderCode: rx }];
        }

        const [docs, total, all] = await Promise.all([
          PaymentModel.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .lean(),
          PaymentModel.countDocuments(filter),
          PaymentModel.find({}).lean(),
        ]);

        const completed = all.filter(
          (p: any) => p.status === TransactionStatus.SUCCESS,
        );
        const pending = all.filter(
          (p: any) => p.status === TransactionStatus.PENDING,
        );
        const failed = all.filter(
          (p: any) => p.status === TransactionStatus.FAILED,
        );
        const refunded = all.filter(
          (p: any) => p.status === TransactionStatus.REFUNDED,
        );

        const sum = (list: any[]) =>
          list.reduce((s, p) => s + (p.amount ?? 0), 0);

        return ok(
          {
            payments: docs.map(toAdminPaymentDto),
            stats: {
              totalRevenue: sum(completed),
              totalPending: sum(pending),
              totalRefunded: sum(refunded),
              totalTransactions: all.length,
              completedCount: completed.length,
              pendingCount: pending.length,
              failedCount: failed.length,
              refundedCount: refunded.length,
            },
          },
          buildMeta(page, pageSize, total),
        );
      }),

            POST: withErrorHandling(async ({ request }) => {
        await connectDB();
        const body = await readJson(request, refundSchema);
        const payment = await PaymentModel.findById(body.paymentId);
        if (!payment) throw notFound('Không tìm thấy giao dịch');

        if (payment.status === TransactionStatus.REFUNDED) {
          throw badRequest('Giao dịch này đã được hoàn tiền trước đó.');
        }
        if (
          payment.status !== TransactionStatus.SUCCESS &&
          payment.status !== TransactionStatus.PENDING
        ) {
          throw badRequest(
            `Chỉ hoàn được giao dịch đang chờ hoặc đã thanh toán (hiện tại: ${payment.status}).`,
          );
        }

        payment.status = TransactionStatus.REFUNDED;
        payment.refundedAt = new Date();
        payment.note = body.reason?.trim() || 'Hoàn tiền bởi quản trị viên';
        await payment.save();

        const order = await OrderModel.findById(payment.orderId);
        if (order) {
          const siblings = await PaymentModel.find({
            orderId: order._id,
          }).lean();
          const allRefunded =
            siblings.length > 0 &&
            siblings.every((p: any) => p.status === TransactionStatus.REFUNDED);

          if (allRefunded) {
            order.paymentStatus = OrderPaymentStatus.REFUNDED;
            await order.save();
          }
        }

        return ok(toAdminPaymentDto(payment));
      }),
    },
  },
});

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
