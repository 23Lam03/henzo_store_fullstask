import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { requireAuth } from '@/server/middleware/auth';
import { withErrorHandling } from '@/server/http/handler';
import { ok } from '@/server/http/response';
import { readJson } from '@/server/http/request';
import { z } from 'zod';
import { Types } from 'mongoose';
import { ReviewModel, toReviewDto } from '@/server/models/Review';
import { ProductModel } from '@/server/models/Product';
import { OrderModel } from '@/server/models/Order';
import { NotificationModel } from '@/server/models/Notification';
import { UserModel } from '@/server/models/User';
import { badRequest, notFound, conflict } from '@/server/http/errors';
import { connectDB } from '@/server/db';

const createSchema = z.object({
  productId: z.string().min(1, 'Thiếu mã sản phẩm'),
  rating: z.coerce.number().int().min(1, 'Vui lòng chọn số sao.').max(5),
  comment: z.string().trim().min(1, 'Vui lòng nhập nội dung đánh giá.').max(2000),
  images: z.array(z.string()).max(6).optional().default([]),
  orderId: z.string().optional(),
});

export const Route = createFileRoute('/api/reviews/')({
  server: {
    middleware: [corsMiddleware, requireAuth],
    handlers: {
            POST: withErrorHandling(async ({ request, context }) => {
        await connectDB();
        const body = await readJson(request, createSchema);

        if (!Types.ObjectId.isValid(body.productId)) {
          throw badRequest('Sản phẩm không hợp lệ');
        }

        const product = await ProductModel.findById(body.productId).lean();
        if (!product) throw notFound('Không tìm thấy sản phẩm');

        const existing = await ReviewModel.findOne({
          productId: product._id,
          userId: context.auth.userId,
        });
        if (existing) {
          throw conflict('Bạn đã đánh giá sản phẩm này rồi');
        }

        let orderId: Types.ObjectId | undefined;
        if (body.orderId && Types.ObjectId.isValid(body.orderId)) {
          const order = await OrderModel.findById(body.orderId).lean();
          if (
            order &&
            String(order.customerId) === context.auth.userId &&
            (order.items ?? []).some(
              (it: any) => String(it.productId) === String(product._id),
            )
          ) {
            orderId = order._id;
          }
        }

        if (!orderId) {
          const purchased = await OrderModel.findOne({
            customerId: context.auth.userId,
            'items.productId': product._id,
            status: { $in: ['confirmed', 'processing', 'shipping', 'delivered'] },
          }).lean();
          if (purchased) orderId = purchased._id;
        }

        const review = await ReviewModel.create({
          productId: product._id,
          productName: product.name,
          productImage: product.images?.[0] ?? '',
          storeId: product.storeId,
          userId: context.auth.userId,
          userName: context.auth.name,
          userAvatar: await getUserAvatar(context.auth.userId),
          orderId,
          rating: body.rating,
          comment: body.comment,
          images: body.images,
          isVerified: Boolean(orderId),
          isHidden: false,
          hasResponse: false,
        });

        await ProductModel.updateOne(
          { _id: product._id },
          {
            $inc: { reviewCount: 1 },
            $set: { rating: await calcProductRating(product._id) },
          },
        );

        if (product.storeId) {
          await NotificationModel.create({
            storeId: product.storeId,
            type: 'review',
            title: `Đánh giá mới ${body.rating} sao`,
            message: `Khách hàng ${context.auth.name} vừa đánh giá ${body.rating} sao cho sản phẩm ${product.name}.`,
            isRead: false,
            link: '/seller/reviews',
            isSystem: true,
          });
        }

        return ok(toReviewDto(review), undefined, 201);
      }),
    },
  },
});

async function getUserAvatar(userId: string): Promise<string> {
  const user = await UserModel.findById(userId).select('avatar').lean();
  return user?.avatar ?? '';
}

async function calcProductRating(productId: Types.ObjectId): Promise<number> {
  const result = await ReviewModel.aggregate([
    { $match: { productId, isHidden: false } },
    { $group: { _id: null, avg: { $avg: '$rating' } } },
  ]);
  return result[0]?.avg ? Math.round(result[0].avg * 10) / 10 : 0;
}
