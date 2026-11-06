import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { requireAuth } from '@/server/middleware/auth';
import { requireAdmin } from '@/server/middleware/admin';
import { withErrorHandling } from '@/server/http/handler';
import { ok } from '@/server/http/response';
import { readJson, readPagination, buildMeta } from '@/server/http/request';
import { z } from 'zod';
import { ReviewModel, toReviewDto } from '@/server/models/Review';
import { connectDB } from '@/server/db';

const actionSchema = z.object({
  action: z.enum(['approve', 'hide', 'unhide', 'delete']),
  reply: z.string().trim().max(1000).optional(),
});

export const Route = createFileRoute('/api/admin/reviews/')({
  server: {
    middleware: [corsMiddleware, requireAuth, requireAdmin],
    handlers: {
            GET: withErrorHandling(async ({ request }) => {
        await connectDB();
        const url = new URL(request.url);
        const sp = url.searchParams;
        const { page, pageSize } = readPagination(sp);

        const filter: Record<string, any> = {};

        const visibility = sp.get('visibility');
        if (visibility === 'hidden') filter.isHidden = true;
        if (visibility === 'visible') filter.isHidden = false;

        const rating = sp.get('rating');
        if (rating) filter.rating = Number(rating);

        if (sp.get('productId')) filter.productId = sp.get('productId');
        if (sp.get('storeId')) filter.storeId = sp.get('storeId');

        const search = (sp.get('search') ?? '').trim();
        if (search) {
          const rx = new RegExp(escapeRegex(search), 'i');
          filter.$or = [
            { comment: rx },
            { userName: rx },
            { productName: rx },
          ];
        }

        const [docs, total, hiddenCount, visibleCount] = await Promise.all([
          ReviewModel.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .lean(),
          ReviewModel.countDocuments(filter),
          ReviewModel.countDocuments({ isHidden: true }),
          ReviewModel.countDocuments({ isHidden: false }),
        ]);

        return ok(
          {
            reviews: docs.map(toReviewDto),
            counts: { visible: visibleCount, hidden: hiddenCount },
          },
          buildMeta(page, pageSize, total),
        );
      }),

            POST: withErrorHandling(async ({ request }) => {
        await connectDB();
        const body = await readJson(request, actionSchema);

        const id = new URL(request.url).searchParams.get('id');
        if (!id) {
          return ok({ updated: 0 });
        }

        const review = await ReviewModel.findById(id);
        if (!review) {
          return ok({ id, updated: 0 });
        }

        switch (body.action) {
          case 'approve':
            review.isHidden = false;
            break;
          case 'hide':
            review.isHidden = true;
            break;
          case 'unhide':
            review.isHidden = false;
            break;
          case 'delete':
            await ReviewModel.deleteOne({ _id: review._id });
            return ok({ id, deleted: true });
        }

        if (body.reply) {
          review.hasResponse = true;
          review.sellerResponse = body.reply;
          review.sellerRespondedAt = new Date();
        }

        await review.save();
        return ok(toReviewDto(review));
      }),
    },
  },
});

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
