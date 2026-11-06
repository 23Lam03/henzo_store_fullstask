import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { requireAuth } from '@/server/middleware/auth';
import { requireStoreOwner } from '@/server/middleware/store';
import { withErrorHandling } from '@/server/http/handler';
import { ok } from '@/server/http/response';
import { readJson } from '@/server/http/request';
import { getStoreScope } from '@/server/http/store-scope';
import { z } from 'zod';
import { ReviewModel, toSellerReview } from '@/server/models/Review';
import { notFound, forbidden, badRequest } from '@/server/http/errors';
import { connectDB } from '@/server/db';

const actionSchema = z.object({
  action: z.enum(['hide', 'unhide', 'respond']),
  response: z.string().trim().max(1000).optional(),
});

export const Route = createFileRoute('/api/seller/reviews/$id')({
  server: {
    middleware: [corsMiddleware, requireAuth, requireStoreOwner],
    handlers: {
      /**
       * Ẩn / bỏ ẩn / phản hồi đánh giá.
       * Seller chỉ được thao tác trên đánh giá của cửa hàng mình.
       */
      PATCH: withErrorHandling(async ({ request, params, context }) => {
        await connectDB();
        const storeId = getStoreScope(context).require();
        const body = await readJson(request, actionSchema);

        const review = await ReviewModel.findById(params.id);
        if (!review) throw notFound('Không tìm thấy đánh giá');
        if (String(review.storeId) !== String(storeId)) {
          throw forbidden('Đánh giá không thuộc cửa hàng của bạn');
        }

        switch (body.action) {
          case 'hide':
            review.isHidden = true;
            break;
          case 'unhide':
            review.isHidden = false;
            break;
          case 'respond': {
            if (!body.response) {
              throw badRequest('Vui lòng nhập nội dung phản hồi.');
            }
            review.hasResponse = true;
            review.sellerResponse = body.response;
            review.sellerRespondedAt = new Date();
            break;
          }
        }

        await review.save();
        return ok(toSellerReview(review));
      }),
    },
  },
});
