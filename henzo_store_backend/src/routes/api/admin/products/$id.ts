import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { requireAuth } from '@/server/middleware/auth';
import { requireAdmin } from '@/server/middleware/admin';
import { withErrorHandling } from '@/server/http/handler';
import { ok } from '@/server/http/response';
import { ProductModel, toProductDto } from '@/server/models/Product';
import { StoreModel } from '@/server/models/Store';
import { notFound } from '@/server/http/errors';
import { connectDB } from '@/server/db';

export const Route = createFileRoute('/api/admin/products/$id')({
  server: {
    middleware: [corsMiddleware, requireAuth, requireAdmin],
    handlers: {
      GET: withErrorHandling(async ({ params }) => {
        await connectDB();

        const product = await ProductModel.findById(params.id).lean();
        if (!product) throw notFound('Không tìm thấy sản phẩm');

        const store = product.storeId
          ? await StoreModel.findById(product.storeId).select('name slug').lean()
          : null;

        return ok({
          ...toProductDto(product),
          storeName: store?.name ?? '',
          storeSlug: store?.slug ?? '',
        });
      }),
    },
  },
});
