import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { requireAuth } from '@/server/middleware/auth';
import { withErrorHandling } from '@/server/http/handler';
import { ok } from '@/server/http/response';
import { notFound, badRequest } from '@/server/http/errors';
import { WishlistModel } from '@/server/models/Wishlist';
import { ProductModel } from '@/server/models/Product';
import { Types } from 'mongoose';
import { connectDB } from '@/server/db';

export const Route = createFileRoute('/api/wishlist/$productId')({
  server: {
    middleware: [corsMiddleware, requireAuth],
    handlers: {
            POST: withErrorHandling(async ({ params, context }) => {
        await connectDB();

        if (!Types.ObjectId.isValid(params.productId)) {
          throw badRequest('Sản phẩm không hợp lệ');
        }
        const product = await ProductModel.findById(params.productId).lean();
        if (!product) throw notFound('Không tìm thấy sản phẩm');

        let wishlist = await WishlistModel.findOne({ userId: context.auth.userId });
        if (!wishlist) {
          wishlist = new WishlistModel({ userId: context.auth.userId, items: [] });
        }

        const exists = wishlist.items.some(
          (i: any) => String(i.productId) === String(params.productId),
        );
        if (!exists) {
          wishlist.items.push({ productId: product._id } as any);
          await wishlist.save();
        }

        return ok({ productId: String(product._id), isSaved: true });
      }),

            DELETE: withErrorHandling(async ({ params, context }) => {
        await connectDB();

        const wishlist = await WishlistModel.findOne({
          userId: context.auth.userId,
        });
        if (!wishlist) throw notFound('Danh sách yêu thích không tồn tại');

        const item = wishlist.items.find(
          (i: any) => String(i.productId) === String(params.productId),
        );
        if (!item) throw notFound('Sản phẩm không có trong danh sách yêu thích');

        wishlist.items.pull(item._id);
        await wishlist.save();

        return ok({ productId: params.productId, isSaved: false });
      }),
    },
  },
});
