import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { requireAuth } from '@/server/middleware/auth';
import { requireAdmin } from '@/server/middleware/admin';
import { withErrorHandling } from '@/server/http/handler';
import { ok } from '@/server/http/response';
import { readJson, readPagination, buildMeta } from '@/server/http/request';
import { z } from 'zod';
import {
  PromotionModel,
  toPromotionDto,
  promotionStatus,
} from '@/server/models/Promotion';
import { PromotionType, SellerPromotionStatus } from '@/server/constants';
import { badRequest } from '@/server/http/errors';
import { connectDB } from '@/server/db';

const promotionSchema = z.object({
  title: z.string().trim().min(1, 'Vui lòng nhập tên chương trình.').max(200),
  description: z.string().trim().max(2000).optional().default(''),
  image: z.string().trim().max(1000).optional().default(''),
  discount: z.coerce.number().min(0).max(100).optional().default(0),
  code: z.string().trim().max(50).optional().default(''),
  type: z.enum(Object.values(PromotionType)).optional().default(PromotionType.DISCOUNT_CAMPAIGN),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  status: z
    .enum(Object.values(SellerPromotionStatus))
    .optional()
    .default(SellerPromotionStatus.ACTIVE),
});

export const Route = createFileRoute('/api/admin/promotions/')({
  server: {
    middleware: [corsMiddleware, requireAuth, requireAdmin],
    handlers: {
            GET: withErrorHandling(async ({ request }) => {
        await connectDB();
        const url = new URL(request.url);
        const sp = url.searchParams;
        const { page, pageSize } = readPagination(sp);

        const filter: Record<string, any> = {};

        const type = sp.get('type');
        if (type && type !== 'all') filter.type = type;

        const search = (sp.get('search') ?? '').trim();
        if (search) {
          const rx = new RegExp(escapeRegex(search), 'i');
          filter.$or = [{ title: rx }, { code: rx }, { description: rx }];
        }

        const [docs, total, all] = await Promise.all([
          PromotionModel.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .lean(),
          PromotionModel.countDocuments(filter),
          PromotionModel.find({}).lean(),
        ]);

        const counts = { active: 0, upcoming: 0, ended: 0 };
        for (const p of all) {
          const s = promotionStatus(p);
          if (s === 'active') counts.active += 1;
          else if (s === 'upcoming') counts.upcoming += 1;
          else counts.ended += 1;
        }

        return ok(
          { promotions: docs.map(toPromotionDto), counts },
          buildMeta(page, pageSize, total),
        );
      }),

            POST: withErrorHandling(async ({ request }) => {
        await connectDB();
        const body = await readJson(request, promotionSchema);

        if (body.endDate <= body.startDate) {
          throw badRequest('Ngày kết thúc phải sau ngày bắt đầu.');
        }

        const promo = await PromotionModel.create({
          title: body.title,
          description: body.description,
          image: body.image,
          discount: body.discount,
          code: body.code,
          type: body.type,
          startDate: body.startDate,
          endDate: body.endDate,
          status: body.status,
        });

        return ok(toPromotionDto(promo), undefined, 201);
      }),
    },
  },
});

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
