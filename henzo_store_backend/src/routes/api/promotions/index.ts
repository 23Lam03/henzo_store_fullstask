import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { withErrorHandling } from '@/server/http/handler';
import { ok } from '@/server/http/response';
import { readPagination } from '@/server/http/request';
import {
  PromotionModel,
  VoucherModel,
  toPromotionDto,
  toVoucherDto,
} from '@/server/models/Promotion';
import { SellerPromotionStatus } from '@/server/constants';
import { connectDB } from '@/server/db';

export const Route = createFileRoute('/api/promotions/')({
  server: {
    middleware: [corsMiddleware],
    handlers: {
            GET: withErrorHandling(async ({ request }) => {
        await connectDB();
        const url = new URL(request.url);
        const sp = url.searchParams;
        const { page, pageSize } = readPagination(sp);

        const now = new Date();

        const promoFilter: Record<string, any> = {
          status: SellerPromotionStatus.ACTIVE,
          startDate: { $lte: now },
          endDate: { $gte: now },
        };
        if (sp.get('storeId')) promoFilter.storeId = sp.get('storeId');

        const voucherFilter: Record<string, any> = {
          status: SellerPromotionStatus.ACTIVE,
          startDate: { $lte: now },
          endDate: { $gte: now },
        };
        if (sp.get('storeId')) voucherFilter.storeId = sp.get('storeId');

        const [promoTotal, voucherTotal, promotions, vouchers] = await Promise.all([
          PromotionModel.countDocuments(promoFilter),
          VoucherModel.countDocuments(voucherFilter),
          PromotionModel.find(promoFilter)
            .sort({ endDate: 1 })
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .lean(),
          VoucherModel.find(voucherFilter).sort({ endDate: 1 }).lean(),
        ]);

        const total = promoTotal + voucherTotal;
        const totalPages = Math.max(1, Math.ceil(promoTotal / pageSize));

        return ok(
          {
            promotions: promotions.map((p) => toPromotionDto(p)),
            vouchers: vouchers.map((v) => toVoucherDto(v)),
            promoTotal,
            voucherTotal,
          },
          {
            page,
            pageSize,
            total,
            totalPages,
          },
        );
      }),
    },
  },
});
