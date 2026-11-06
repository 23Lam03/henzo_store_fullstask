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
import {
  DiscountType,
  PromotionType,
  SellerPromotionStatus,
} from '@/server/constants';
import { badRequest } from '@/server/http/errors';
import { connectDB } from '@/server/db';

const promotionSchema = z.object({
  name: z.string().trim().min(1, 'Vui lòng nhập tên chương trình.').max(200),
  type: z.enum(Object.values(PromotionType)).default(PromotionType.VOUCHER),
  code: z.string().trim().max(50).optional().default(''),
  discountType: z.enum(Object.values(DiscountType)).default(DiscountType.PERCENT),
  discountValue: z.coerce.number().min(0, 'Giá trị giảm không hợp lệ.'),
  minOrderValue: z.coerce.number().min(0).optional().default(0),
  maxDiscount: z.coerce.number().min(0).optional().default(0),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  status: z
    .enum(Object.values(SellerPromotionStatus))
    .optional()
    .default(SellerPromotionStatus.ACTIVE),
  usageLimit: z.coerce.number().int().min(0).optional().default(0),
  targetProducts: z.array(z.string()).optional().default([]),
  targetCategories: z.array(z.string()).optional().default([]),
});

export const Route = createFileRoute('/api/seller/promotions/')({
  server: {
    middleware: [corsMiddleware, requireAuth, requireStoreOwner],
    handlers: {
      /** Danh sách chương trình khuyến mãi của cửa hàng. */
      GET: withErrorHandling(async ({ request, context }) => {
        await connectDB();
        const scope = getStoreScope(context);

        const url = new URL(request.url);
        const sp = url.searchParams;

        const filter: Record<string, any> = scope.filter();
        if (sp.get('status')) filter.status = sp.get('status');
        if (sp.get('type')) filter.type = sp.get('type');

        const docs = await PromotionModel.find(filter)
          .sort({ createdAt: -1 })
          .limit(500)
          .lean();

        return ok(docs.map(toSellerPromotion));
      }),

      /** Tạo chương trình khuyến mãi mới. */
      POST: withErrorHandling(async ({ request, context }) => {
        await connectDB();
        // Tạo khuyến mãi là thao tác ghi -> bắt buộc có một cửa hàng cụ thể.
        const storeId = getStoreScope(context).require();
        const body = await readJson(request, promotionSchema);

        if (new Date(body.endDate) <= new Date(body.startDate)) {
          throw badRequest('Ngày kết thúc phải sau ngày bắt đầu.');
        }

        const promo = await PromotionModel.create({
          title: body.name,
          description: '',
          image: '',
          discount:
            body.discountType === DiscountType.PERCENT
              ? body.discountValue
              : 0,
          code: body.code,
          type: body.type,
          discountType: body.discountType,
          discountValue: body.discountValue,
          minOrderValue: body.minOrderValue,
          maxDiscount: body.maxDiscount,
          startDate: body.startDate,
          endDate: body.endDate,
          status: body.status,
          usageLimit: body.usageLimit,
          usedCount: 0,
          targetProducts: body.targetProducts,
          targetCategories: body.targetCategories,
          storeId,
        });

        return ok(toSellerPromotion(promo), undefined, 201);
      }),
    },
  },
});
