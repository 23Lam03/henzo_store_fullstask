import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { requireAuth } from '@/server/middleware/auth';
import { requireAdmin } from '@/server/middleware/admin';
import { withErrorHandling } from '@/server/http/handler';
import { ok } from '@/server/http/response';
import { getAdminDashboardStats } from '@/server/services/admin.service';
import { connectDB } from '@/server/db';

export const Route = createFileRoute('/api/admin/dashboard')({
  server: {
    middleware: [corsMiddleware, requireAuth, requireAdmin],
    handlers: {
            GET: withErrorHandling(async () => {
        await connectDB();
        const data = await getAdminDashboardStats();
        return ok(data);
      }),
    },
  },
});
