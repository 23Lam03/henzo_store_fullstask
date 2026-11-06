import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { requireAuth } from '@/server/middleware/auth';
import { requireAdmin } from '@/server/middleware/admin';
import { withErrorHandling } from '@/server/http/handler';
import { ok } from '@/server/http/response';
import { readPagination, buildMeta } from '@/server/http/request';
import { UserModel, toAdminUser } from '@/server/models/User';
import { OrderModel } from '@/server/models/Order';
import { connectDB } from '@/server/db';

export const Route = createFileRoute('/api/admin/customers/')({
  server: {
    middleware: [corsMiddleware, requireAuth, requireAdmin],
    handlers: {
      /** Danh sách khách hàng (lọc theo trạng thái & tìm kiếm). */
      GET: withErrorHandling(async ({ request }) => {
        await connectDB();
        const url = new URL(request.url);
        const sp = url.searchParams;
        const { page, pageSize } = readPagination(sp);

        const filter: Record<string, any> = { role: 'CUSTOMER' };

        const status = sp.get('status');
        if (status === 'active') filter.status = 'active';
        if (status === 'locked') filter.status = 'locked';

        const search = (sp.get('search') ?? '').trim();
        if (search) {
          const rx = new RegExp(escapeRegex(search), 'i');
          filter.$or = [
            { name: rx },
            { email: rx },
            { phone: rx },
            { address: rx },
          ];
        }

        const [docs, total, activeCount, lockedCount] = await Promise.all([
          UserModel.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .lean(),
          UserModel.countDocuments(filter),
          UserModel.countDocuments({ role: 'CUSTOMER', status: 'active' }),
          UserModel.countDocuments({ role: 'CUSTOMER', status: 'locked' }),
        ]);

        return ok(
          {
            customers: docs.map(toAdminUser),
            counts: { active: activeCount, locked: lockedCount },
          },
          buildMeta(page, pageSize, total),
        );
      }),
    },
  },
});

/** Escape regex để tìm kiếm an toàn. */
function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
