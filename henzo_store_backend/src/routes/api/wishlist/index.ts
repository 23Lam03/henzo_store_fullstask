import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { requireAuth } from '@/server/middleware/auth';
import { withErrorHandling } from '@/server/http/handler';
import { ok } from '@/server/http/response';
import { notFound, badRequest } from '@/server/http/errors';
import { readJson } from '@/server/http/request';
import { z } from 'zod';
import { Types } from 'mongoose';
import { WishlistModel } from '@/server/models/Wishlist';
import { ProductModel, toProductDto } from '@/server/models/Product';
import { connectDB } from '@/server/db';

const addSchema = z.object({
  productId: z.string().min(1, 'Thiếu mã sản phẩm'),
});

/** Danh sách yêu thích của khách. */
export const Route = createFileRoute('/api/wishlist/')({
  server: {
    middleware: [corsMiddleware, requireAuth],
    handlers: {
      GET: withErrorHandling(async ({ context }) => {
        await connectDB();

        const wishlist = await WishlistModel.findOne({
          userId: context.auth.userId,
        }).lean();

        const productIds = (wishlist?.items ?? []).map((i: any) => i.productId);
        const products = await ProductModel.find({
          _id: { $in: productIds },
        }).lean();
        const productMap = new Map(products.map((p) => [String(p._id), p]));

        const items = (wishlist?.items ?? [])
          .map((i: any) => {
            const product = productMap.get(String(i.productId));
            if (!product) return null;
            return { product: toProductDto(product), addedAt: i.createdAt };
          })
          .filter(Boolean);

        return ok({ items, total: items.length });
      }),

      /** Thêm vào danh sách yêu thích. */
      POST: withErrorHandling(async ({ request, context }) => {
        await connectDB();
        const body = await readJson(request, addSchema);

        if (!Types.ObjectId.isValid(body.productId)) {
          throw badRequest('Sản phẩm không hợp lệ');
        }
        const product = await ProductModel.findById(body.productId).lean();
        if (!product) throw notFound('Không tìm thấy sản phẩm');

        let wishlist = await WishlistModel.findOne({ userId: context.auth.userId });
        if (!wishlist) {
          wishlist = new WishlistModel({
            userId: context.auth.userId,
            items: [],
          });
        }

        const exists = wishlist.items.some(
          (i: any) => String(i.productId) === String(body.productId),
        );
        if (!exists) {
          wishlist.items.push({ productId: product._id } as any);
          await wishlist.save();
        }

        return ok({ productId: String(product._id), isSaved: true });
      }),
    },
  },
});
