import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { requireAuth } from '@/server/middleware/auth';
import { requireAdmin, requirePermission } from '@/server/middleware/admin';
import { withErrorHandling } from '@/server/http/handler';
import { ok } from '@/server/http/response';
import { getAdminFinanceSummary } from '@/server/services/admin.service';
import { connectDB } from '@/server/db';

export const Route = createFileRoute('/api/admin/finance')({
  server: {
    middleware: [corsMiddleware, requireAuth, requireAdmin, requirePermission('Tài chính')],
    handlers: {
      /** Tổng hợp tài chính nền tảng: doanh thu, hoa hồng, số dư khả dụng. */
      GET: withErrorHandling(async () => {
        await connectDB();
        const data = await getAdminFinanceSummary();
        return ok(data);
      }),
    },
  },
});
