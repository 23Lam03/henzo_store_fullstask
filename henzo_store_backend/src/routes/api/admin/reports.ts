import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { requireAuth } from '@/server/middleware/auth';
import { requireAdmin } from '@/server/middleware/admin';
import { withErrorHandling } from '@/server/http/handler';
import { ok } from '@/server/http/response';
import { getAdminReports } from '@/server/services/admin.service';
import { connectDB } from '@/server/db';

export const Route = createFileRoute('/api/admin/reports')({
  server: {
    middleware: [corsMiddleware, requireAuth, requireAdmin],
    handlers: {
            GET: withErrorHandling(async () => {
        await connectDB();
        const data = await getAdminReports();
        return ok(data);
      }),
    },
  },
});
