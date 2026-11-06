import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { withErrorHandling } from '@/server/http/handler';
import { ok } from '@/server/http/response';
import { notFound } from '@/server/http/errors';
import { StoreModel, toPublicStore } from '@/server/models/Store';
import { ProductModel, toProductDto } from '@/server/models/Product';
import { ReviewModel, toReviewDto } from '@/server/models/Review';
import { ProductStatus, StoreStatus } from '@/server/constants';
import { connectDB } from '@/server/db';

export const Route = createFileRoute('/api/stores/$id')({
  server: {
    middleware: [corsMiddleware],
    handlers: {
      GET: withErrorHandling(async ({ params, request }) => {
        await connectDB();

        const store =
          (await StoreModel.findById(params.id).lean()) ??
          (await StoreModel.findOne({ slug: params.id }).lean());

        if (!store) throw notFound('Không tìm thấy cửa hàng');

        const url = new URL(request.url);
        const includeInactive =
          url.searchParams.get('all') === '1' ||
          store.status !== StoreStatus.ACTIVE;

        const [products, reviews] = await Promise.all([
          ProductModel.find({
            storeId: store._id,
            status: ProductStatus.ACTIVE,
          })
            .sort({ sold: -1 })
            .limit(20)
            .lean(),
          ReviewModel.find({ storeId: store._id, isHidden: false })
            .sort({ createdAt: -1 })
            .limit(10)
            .lean(),
        ]);

        return ok({
          ...toPublicStore(store),
          products: products.map(toProductDto),
          reviews: reviews.map(toReviewDto),
        });
      }),
    },
  },
});
