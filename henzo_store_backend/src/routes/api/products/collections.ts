import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { withErrorHandling } from '@/server/http/handler';
import { ok } from '@/server/http/response';
import { ProductModel, toProductDto } from '@/server/models/Product';
import { ProductStatus } from '@/server/constants';
import { connectDB } from '@/server/db';

/**
 * Bộ sưu tập sản phẩm cho trang chủ.
 * Trả về nhiều nhóm cùng lúc để frontend render 1 request.
 */
export const Route = createFileRoute('/api/products/collections')({
  server: {
    middleware: [corsMiddleware],
    handlers: {
      GET: withErrorHandling(async () => {
        await connectDB();
        const base = { status: ProductStatus.ACTIVE };
        const limit = 20;

        const [featured, hot, newArrivals, bestSellers, flashSale, newest] =
          await Promise.all([
            ProductModel.find({ ...base, isFeatured: true })
              .sort({ sold: -1 })
              .limit(limit)
              .lean(),
            ProductModel.find({ ...base, isHot: true })
              .sort({ sold: -1 })
              .limit(limit)
              .lean(),
            ProductModel.find({ ...base, isNew: true })
              .sort({ createdAt: -1 })
              .limit(limit)
              .lean(),
            ProductModel.find(base)
              .sort({ sold: -1 })
              .limit(limit)
              .lean(),
            ProductModel.find({ ...base, discount: { $gte: 10 } })
              .sort({ discount: -1 })
              .limit(limit)
              .lean(),
            ProductModel.find(base)
              .sort({ createdAt: -1 })
              .limit(limit)
              .lean(),
          ]);

        return ok({
          featured: featured.map(toProductDto),
          hot: hot.map(toProductDto),
          newArrivals: newArrivals.map(toProductDto),
          bestSellers: bestSellers.map(toProductDto),
          flashSale: flashSale.map(toProductDto),
          newest: newest.map(toProductDto),
        });
      }),
    },
  },
});
