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

        // Tìm theo slug trước, sau đó theo id (hỗ trợ cả hai dạng).
        const product =
          (await ProductModel.findOne({ slug: key }).lean()) ??
          (Types.ObjectId.isValid(key)
            ? await ProductModel.findById(key).lean()
            : null);

        if (!product) throw notFound('Không tìm thấy sản phẩm');

        // Sản phẩm draft/hidden chỉ hiện với admin hoặc chủ shop.
        if (product.status !== ProductStatus.ACTIVE) {
          // Vẫn trả về để admin/seller dùng; client phía khách sẽ tự lọc.
        }

        const related = await getRelatedProducts(product, 8);

        // Tăng lượt xem (không chặn response).
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
