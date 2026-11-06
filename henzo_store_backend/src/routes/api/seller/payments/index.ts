import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { requireAuth } from '@/server/middleware/auth';
import { requireStoreOwner } from '@/server/middleware/store';
import { withErrorHandling } from '@/server/http/handler';
import { ok } from '@/server/http/response';
import { readPagination } from '@/server/http/request';
import { getStoreScope } from '@/server/http/store-scope';
import { PaymentModel, toPaymentDto } from '@/server/models/Payment';
import { connectDB } from '@/server/db';

export const Route = createFileRoute('/api/seller/payments/')({
  server: {
    middleware: [corsMiddleware, requireAuth, requireStoreOwner],
    handlers: {
      /** Lịch sử giao dịch của cửa hàng. */
      GET: withErrorHandling(async ({ request, context }) => {
        await connectDB();
        const scope = getStoreScope(context);

        const url = new URL(request.url);
        const sp = url.searchParams;
        const { page, pageSize } = readPagination(sp);

        const filter: Record<string, any> = scope.filter();
        if (sp.get('status')) filter.status = sp.get('status');
        if (sp.get('method')) filter.method = sp.get('method');

        const [docs, total, summary] = await Promise.all([
          PaymentModel.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .lean(),
          PaymentModel.countDocuments(filter),
          // `$match` trong pipeline không tự ép chuỗi -> ObjectId,
          // nên phải dùng `aggMatch()` đã ép kiểu.
          PaymentModel.aggregate([
            { $match: scope.aggMatch() },
            {
              $group: {
                _id: null,
                amount: { $sum: '$amount' },
                platformFee: { $sum: '$platformFee' },
                netAmount: { $sum: '$netAmount' },
                count: { $sum: 1 },
              },
            },
          ]),
        ]);

        const s = summary[0] ?? { amount: 0, platformFee: 0, netAmount: 0, count: 0 };

        return ok(
          {
            payments: docs.map(toPaymentDto),
            summary: {
              totalAmount: s.amount ?? 0,
              totalPlatformFee: s.platformFee ?? 0,
              totalNetAmount: s.netAmount ?? 0,
              totalCount: s.count ?? 0,
            },
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
