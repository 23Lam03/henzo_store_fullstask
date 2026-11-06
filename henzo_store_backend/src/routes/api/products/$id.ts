import { createFileRoute } from '@tanstack/react-router';
import { Types } from 'mongoose';
import { corsMiddleware } from '@/server/middleware/cors';
import { withErrorHandling } from '@/server/http/handler';
import { ok } from '@/server/http/response';
import { notFound } from '@/server/http/errors';
import { ProductModel, toProductDto } from '@/server/models/Product';
import { getRelatedProducts } from '@/server/services/catalog.service';
import { connectDB } from '@/server/db';
import { ProductStatus } from '@/server/constants';

export const Route = createFileRoute('/api/products/$id')({
  server: {
    middleware: [corsMiddleware],
    handlers: {
      GET: withErrorHandling(async ({ params }) => {
        await connectDB();
        const key = params.id;

        const product =
          (await ProductModel.findOne({ slug: key }).lean()) ??
          (Types.ObjectId.isValid(key)
            ? await ProductModel.findById(key).lean()
            : null);

        if (!product) throw notFound('Không tìm thấy sản phẩm');

        if (product.status !== ProductStatus.ACTIVE) {

        }

        const related = await getRelatedProducts(product, 8);

        ProductModel.updateOne({ _id: product._id }, { $inc: { viewCount: 1 } }).catch(
          () => {},
        );

        return ok({
          product: toProductDto(product),
          related,
        });
      }),
    },
  },
});
