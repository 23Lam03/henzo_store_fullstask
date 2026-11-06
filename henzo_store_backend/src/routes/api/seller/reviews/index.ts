import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { requireAuth } from '@/server/middleware/auth';
import { requireStoreOwner } from '@/server/middleware/store';
import { withErrorHandling } from '@/server/http/handler';
import { ok } from '@/server/http/response';
import { readPagination, toBool } from '@/server/http/request';
import { getStoreScope } from '@/server/http/store-scope';
import { ReviewModel, toSellerReview } from '@/server/models/Review';
import { connectDB } from '@/server/db';

export const Route = createFileRoute('/api/seller/reviews/')({
  server: {
    middleware: [corsMiddleware, requireAuth, requireStoreOwner],
    handlers: {
      /** Danh sách đánh giá của cửa hàng. */
      GET: withErrorHandling(async ({ request, context }) => {
        await connectDB();
        const scope = getStoreScope(context);

        const url = new URL(request.url);
        const sp = url.searchParams;
        const { page, pageSize } = readPagination(sp);

        const filter: Record<string, any> = scope.filter();

        if (sp.get('rating')) filter.rating = Number(sp.get('rating'));
        if (toBool(sp.get('hidden'))) filter.isHidden = true;
        if (toBool(sp.get('responded'))) filter.hasResponse = true;

        const [docs, total, summary] = await Promise.all([
          ReviewModel.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .lean(),
          ReviewModel.countDocuments(filter),
          // `$match` trong pipeline không tự ép chuỗi -> ObjectId.
          ReviewModel.aggregate([
            { $match: scope.aggMatch() },
            {
              $group: {
                _id: '$rating',
                count: { $sum: 1 },
              },
            },
          ]),
        ]);

        const distribution: Record<string, number> = {
          '1': 0,
          '2': 0,
          '3': 0,
          '4': 0,
          '5': 0,
        };
        for (const d of summary) distribution[String(d._id)] = d.count;

        return ok(
          {
            reviews: docs.map(toSellerReview),
            distribution,
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
