import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { requireAuth } from '@/server/middleware/auth';
import { requireAdmin, requirePermission } from '@/server/middleware/admin';
import { withErrorHandling } from '@/server/http/handler';
import { ok } from '@/server/http/response';
import { readJson } from '@/server/http/request';
import { z } from 'zod';
import { PromotionModel, toPromotionDto } from '@/server/models/Promotion';
import { PromotionType, SellerPromotionStatus } from '@/server/constants';
import { notFound, badRequest } from '@/server/http/errors';
import { connectDB } from '@/server/db';

const updateSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(2000).optional(),
  image: z.string().trim().max(1000).optional(),
  discount: z.coerce.number().min(0).max(100).optional(),
  code: z.string().trim().max(50).optional(),
  type: z.enum(Object.values(PromotionType)).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  status: z.enum(Object.values(SellerPromotionStatus)).optional(),
});

export const Route = createFileRoute('/api/admin/promotions/$id')({
  server: {
    middleware: [corsMiddleware, requireAuth, requireAdmin, requirePermission('Quản lý khuyến mãi')],
    handlers: {
      /** Chi tiết chương trình khuyến mãi. */
      GET: withErrorHandling(async ({ params }) => {
        await connectDB();
        const promo = await PromotionModel.findById(params.id).lean();
        if (!promo) throw notFound('Không tìm thấy chương trình');
        return ok(toPromotionDto(promo));
      }),

      /** Cập nhật chương trình khuyến mãi. */
      PATCH: withErrorHandling(async ({ request, params }) => {
        await connectDB();
        const body = await readJson(request, updateSchema);

        const promo = await PromotionModel.findById(params.id);
        if (!promo) throw notFound('Không tìm thấy chương trình');

        const nextStart = body.startDate ?? promo.startDate;
        const nextEnd = body.endDate ?? promo.endDate;
        if (new Date(nextEnd) <= new Date(nextStart)) {
          throw badRequest('Ngày kết thúc phải sau ngày bắt đầu.');
        }

        if (body.title !== undefined) promo.title = body.title;
        if (body.description !== undefined) promo.description = body.description;
        if (body.image !== undefined) promo.image = body.image;
        if (body.discount !== undefined) promo.discount = body.discount;
        if (body.code !== undefined) promo.code = body.code;
        if (body.type !== undefined) promo.type = body.type;
        if (body.startDate !== undefined) promo.startDate = body.startDate;
        if (body.endDate !== undefined) promo.endDate = body.endDate;
        if (body.status !== undefined) promo.status = body.status;

        await promo.save();
        return ok(toPromotionDto(promo));
      }),

      /** Xoá chương trình khuyến mãi. */
      DELETE: withErrorHandling(async ({ params }) => {
        await connectDB();
        const promo = await PromotionModel.findById(params.id);
        if (!promo) throw notFound('Không tìm thấy chương trình');

        await PromotionModel.deleteOne({ _id: promo._id });
        return ok({ id: String(promo._id), deleted: true });
      }),
    },
  },
});
