import { createFileRoute } from '@tanstack/react-router';
import { Types } from 'mongoose';
import { corsMiddleware } from '@/server/middleware/cors';
import { withErrorHandling } from '@/server/http/handler';
import { ok } from '@/server/http/response';
import { notFound } from '@/server/http/errors';
import { readPagination, toInt } from '@/server/http/request';
import { ReviewModel, toReviewDto } from '@/server/models/Review';
import { connectDB } from '@/server/db';

export const Route = createFileRoute('/api/products/$id/reviews')({
  server: {
    middleware: [corsMiddleware],
    handlers: {
      GET: withErrorHandling(async ({ request, params }) => {
        await connectDB();
        const url = new URL(request.url);
        const sp = url.searchParams;
        const { page, pageSize } = readPagination(sp);
        const minRating = toInt(sp.get('minRating'), 0);

        if (!Types.ObjectId.isValid(params.id)) {
          throw notFound('Không tìm thấy sản phẩm');
        }

        const filter: Record<string, any> = {
          productId: params.id,
          isHidden: false,
        };
        if (minRating > 0) filter.rating = { $gte: minRating };

        const [docs, total, distribution] = await Promise.all([
          ReviewModel.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .lean(),
          ReviewModel.countDocuments(filter),
          ReviewModel.aggregate([
            { $match: { productId: params.id, isHidden: false } },
            { $group: { _id: '$rating', count: { $sum: 1 } } },
          ]),
        ]);

        const counts: Record<string, number> = {
          '1': 0,
          '2': 0,
          '3': 0,
          '4': 0,
          '5': 0,
        };
        for (const d of distribution) counts[String(d._id)] = d.count;

        return ok(
          {
            reviews: docs.map(toReviewDto),
            distribution: counts,
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
