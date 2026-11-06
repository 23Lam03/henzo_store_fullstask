import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { requireAuth } from '@/server/middleware/auth';
import { requireStoreOwner } from '@/server/middleware/store';
import { withErrorHandling } from '@/server/http/handler';
import { ok } from '@/server/http/response';
import { readJson } from '@/server/http/request';
import { getStoreScope } from '@/server/http/store-scope';
import { z } from 'zod';
import { PromotionModel, toSellerPromotion } from '@/server/models/Promotion';
import { SellerPromotionStatus } from '@/server/constants';
import { notFound, forbidden, badRequest } from '@/server/http/errors';
import { connectDB } from '@/server/db';

const updateSchema = z.object({
  status: z.enum(Object.values(SellerPromotionStatus)).optional(),
  name: z.string().trim().min(1).max(200).optional(),
  code: z.string().trim().max(50).optional(),
  discountType: z.enum(['percent', 'fixed']).optional(),
  discountValue: z.coerce.number().min(0).optional(),
  minOrderValue: z.coerce.number().min(0).optional(),
  maxDiscount: z.coerce.number().min(0).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  usageLimit: z.coerce.number().int().min(0).optional(),
});

export const Route = createFileRoute('/api/seller/promotions/$id')({
  server: {
    middleware: [corsMiddleware, requireAuth, requireStoreOwner],
    handlers: {
            GET: withErrorHandling(async ({ params, context }) => {
        await connectDB();
        const scope = getStoreScope(context);

        const promo = await PromotionModel.findOne({
          ...scope.filter(),
          _id: params.id,
        }).lean();

        if (!promo) throw notFound('Không tìm thấy chương trình khuyến mãi');

        return ok(toSellerPromotion(promo));
      }),

            PATCH: withErrorHandling(async ({ request, params, context }) => {
        await connectDB();

        const storeId = getStoreScope(context).require();
        const body = await readJson(request, updateSchema);

        const promo = await PromotionModel.findById(params.id);
        if (!promo) throw notFound('Không tìm thấy chương trình khuyến mãi');
        if (String(promo.storeId) !== String(storeId)) {
          throw forbidden('Chương trình khuyến mãi không thuộc cửa hàng của bạn');
        }

        if (body.startDate && body.endDate) {
          if (new Date(body.endDate) <= new Date(body.startDate)) {
            throw badRequest('Ngày kết thúc phải sau ngày bắt đầu.');
          }
        }

        if (body.name !== undefined) promo.title = body.name;
        if (body.code !== undefined) promo.code = body.code;
        if (body.discountType !== undefined) promo.discountType = body.discountType;
        if (body.discountValue !== undefined) {
          promo.discountValue = body.discountValue;

          if (body.discountType === undefined || body.discountType === 'percent') {
            promo.discount = body.discountValue;
          }
        }
        if (body.minOrderValue !== undefined) promo.minOrderValue = body.minOrderValue;
        if (body.maxDiscount !== undefined) promo.maxDiscount = body.maxDiscount;
        if (body.startDate !== undefined) promo.startDate = body.startDate;
        if (body.endDate !== undefined) promo.endDate = body.endDate;
        if (body.usageLimit !== undefined) promo.usageLimit = body.usageLimit;
        if (body.status !== undefined) promo.status = body.status;

        await promo.save();

        return ok(toSellerPromotion(promo));
      }),

            DELETE: withErrorHandling(async ({ params, context }) => {
        await connectDB();

        const storeId = getStoreScope(context).require();

        const promo = await PromotionModel.findById(params.id);
        if (!promo) throw notFound('Không tìm thấy chương trình khuyến mãi');
        if (String(promo.storeId) !== String(storeId)) {
          throw forbidden('Chương trình khuyến mãi không thuộc cửa hàng của bạn');
        }

        await promo.deleteOne();

        return ok({ id: params.id, deleted: true });
      }),
    },
  },
});
