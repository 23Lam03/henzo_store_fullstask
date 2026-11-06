import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { requireAuth } from '@/server/middleware/auth';
import { withErrorHandling } from '@/server/http/handler';
import { ok } from '@/server/http/response';
import { readPagination } from '@/server/http/request';
import { PaymentModel, toPaymentDto } from '@/server/models/Payment';
import { connectDB } from '@/server/db';

export const Route = createFileRoute('/api/payments/')({
  server: {
    middleware: [corsMiddleware, requireAuth],
    handlers: {
      /**
       * Lịch sử giao dịch của khách hàng.
       * Chỉ trả về giao dịch thuộc đơn hàng của chính người đang đăng nhập.
       */
      GET: withErrorHandling(async ({ request, context }) => {
        await connectDB();
        const url = new URL(request.url);
        const sp = url.searchParams;
        const { page, pageSize } = readPagination(sp);

        const filter: Record<string, any> = { userId: context.auth.userId };
        if (sp.get('status')) filter.status = sp.get('status');
        if (sp.get('method')) filter.method = sp.get('method');

        const [docs, total, summary] = await Promise.all([
          PaymentModel.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .lean(),
          PaymentModel.countDocuments(filter),
          PaymentModel.aggregate([
            { $match: filter },
            {
              $group: {
                _id: null,
                amount: { $sum: '$amount' },
                count: { $sum: 1 },
              },
            },
          ]),
        ]);

        const s = summary[0] ?? { amount: 0, count: 0 };

        return ok(
          {
            payments: docs.map(toPaymentDto),
            summary: { totalAmount: s.amount ?? 0, totalCount: s.count ?? 0 },
          },
          {
            page,
            pageSize,
            total,
            totalPages: Math.max(1, Math.ceil(total / pageSize)),
          },
        );
      }),
    },
  },
});
