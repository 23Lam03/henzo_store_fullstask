import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { requireAuth } from '@/server/middleware/auth';
import { requireAdmin } from '@/server/middleware/admin';
import { withErrorHandling } from '@/server/http/handler';
import { ok } from '@/server/http/response';
import { readPagination, buildMeta } from '@/server/http/request';
import { TicketModel, toAdminTicket } from '@/server/models/SupportTicket';
import { AdminTicketStatus } from '@/server/constants';
import { connectDB } from '@/server/db';

export const Route = createFileRoute('/api/admin/support/tickets/')({
  server: {
    middleware: [corsMiddleware, requireAuth, requireAdmin],
    handlers: {
            GET: withErrorHandling(async ({ request }) => {
        await connectDB();
        const url = new URL(request.url);
        const sp = url.searchParams;
        const { page, pageSize } = readPagination(sp);

        const filter: Record<string, any> = {};

        const status = sp.get('status');
        if (status && status !== 'all') filter.status = status;

        const priority = sp.get('priority');
        if (priority && priority !== 'all') filter.priority = priority;

        const category = sp.get('category');
        if (category && category !== 'all') filter.category = category;

        const scope = sp.get('scope');
        if (scope && scope !== 'all') filter.scope = scope;

        if (sp.get('storeId')) filter.storeId = sp.get('storeId');

        const search = (sp.get('search') ?? '').trim();
        if (search) {
          const rx = new RegExp(escapeRegex(search), 'i');
          filter.$or = [
            { subject: rx },
            { ticketCode: rx },
            { customerName: rx },
            { customerEmail: rx },
          ];
        }

        const [docs, total, counts] = await Promise.all([
          TicketModel.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .lean(),
          TicketModel.countDocuments(filter),
          TicketModel.aggregate([
            { $match: {} },
            { $group: { _id: '$status', count: { $sum: 1 } } },
          ]),
        ]);

        const statusCounts: Record<string, number> = {};
        for (const s of Object.values(AdminTicketStatus)) statusCounts[s] = 0;
        for (const c of counts) statusCounts[c._id] = c.count;

        return ok(
          { tickets: docs.map(toAdminTicket), counts: statusCounts },
          buildMeta(page, pageSize, total),
        );
      }),
    },
  },
});

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
