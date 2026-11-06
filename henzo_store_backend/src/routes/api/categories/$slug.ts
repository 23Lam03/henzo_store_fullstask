import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { withErrorHandling } from '@/server/http/handler';
import { ok } from '@/server/http/response';
import { notFound } from '@/server/http/errors';
import { CategoryModel, toCategoryDto } from '@/server/models/Category';
import { ProductModel } from '@/server/models/Product';
import { ProductStatus } from '@/server/constants';
import { connectDB } from '@/server/db';

export const Route = createFileRoute('/api/categories/$slug')({
  server: {
    middleware: [corsMiddleware],
    handlers: {
      GET: withErrorHandling(async ({ params }) => {
        await connectDB();

        const category =
          (await CategoryModel.findOne({ slug: params.slug }).lean()) ??
          (await CategoryModel.findById(params.slug).lean());

        if (!category) throw notFound('Không tìm thấy danh mục');

        const children = await CategoryModel.find({
          parentId: category._id,
        })
          .sort({ order: 1, name: 1 })
          .lean();

        // Sản phẩm của danh mục cha bao gồm cả danh mục con.
        const childIds = children.map((c) => c._id);
        const productCount = await ProductModel.countDocuments({
          status: ProductStatus.ACTIVE,
          $or: [
            { categoryId: category._id },
            ...(childIds.length ? [{ categoryId: { $in: childIds } }] : []),
          ],
        });

        return ok({
          ...toCategoryDto(category),
          productCount,
          children: children.map(toCategoryDto),
        });
      }),
    },
  },
});
