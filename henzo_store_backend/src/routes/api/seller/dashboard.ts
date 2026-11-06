import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { requireAuth } from '@/server/middleware/auth';
import { requireStoreOwner } from '@/server/middleware/store';
import { withErrorHandling } from '@/server/http/handler';
import { ok } from '@/server/http/response';
import { getStoreScope } from '@/server/http/store-scope';
import { StoreModel, toAdminStore } from '@/server/models/Store';
import {
  getSellerDashboardStats,
  getSellerFinanceSummary,
  getDailyRevenue,
  getMonthlyData,
  type Period,
} from '@/server/services/seller.service';
import { connectDB } from '@/server/db';

export const Route = createFileRoute('/api/seller/dashboard')({
  server: {
    middleware: [corsMiddleware, requireAuth, requireStoreOwner],
    handlers: {
      GET: withErrorHandling(async ({ request, context }) => {
        await connectDB();
        const scope = getStoreScope(context);
        const storeId = scope.storeId;

        const url = new URL(request.url);
        const period = (url.searchParams.get('period') ?? 'month') as Period;

        const [stats, finance, dailyRevenue, monthlyData, store] =
          await Promise.all([
            getSellerDashboardStats(storeId),
            getSellerFinanceSummary(storeId, period),
            getDailyRevenue(storeId, 30),
            getMonthlyData(storeId, 12),

            storeId ? StoreModel.findById(storeId).lean() : null,
          ]);

        return ok({
          store: store ? toAdminStore(store) : null,
          stats,
          finance,
          dailyRevenue,
          monthlyData,
        });
      }),
    },
  },
});
