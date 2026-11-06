import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { requireAuth } from '@/server/middleware/auth';
import { requireAdmin } from '@/server/middleware/admin';
import { withErrorHandling } from '@/server/http/handler';
import { ok } from '@/server/http/response';
import { readPagination, buildMeta } from '@/server/http/request';
import { OrderModel, toAdminOrder } from '@/server/models/Order';
import { CustomerOrderStatus } from '@/server/constants';
import { connectDB } from '@/server/db';

export const Route = createFileRoute('/api/admin/orders/')({
  server: {
    middleware: [corsMiddleware, requireAuth, requireAdmin],
    handlers: {
      /** Danh sách toàn bộ đơn hàng trên hệ thống. */
      GET: withErrorHandling(async ({ request }) => {
        await connectDB();
        const url = new URL(request.url);
        const sp = url.searchParams;
        const { page, pageSize } = readPagination(sp);

        const filter: Record<string, any> = {};

        const status = sp.get('status');
        if (status && status !== 'all') filter.status = status;

        const paymentStatus = sp.get('paymentStatus');
        if (paymentStatus && paymentStatus !== 'all') {
          filter.paymentStatus = paymentStatus;
        }

        const method = sp.get('paymentMethod');
        if (method && method !== 'all') filter.paymentMethod = method;

        if (sp.get('storeId')) filter['subOrders.storeId'] = sp.get('storeId');
        if (sp.get('customerId')) filter.customerId = sp.get('customerId');

        const search = (sp.get('search') ?? '').trim();
        if (search) {
          const rx = new RegExp(escapeRegex(search), 'i');
          filter.$or = [
            { orderNumber: rx },
            { customerName: rx },
            { customerPhone: rx },
            { shippingAddress: rx },
          ];
        }

        const [docs, total, statusCounts] = await Promise.all([
          OrderModel.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .lean(),
          OrderModel.countDocuments(filter),
          OrderModel.aggregate([
            { $match: {} },
            { $group: { _id: '$status', count: { $sum: 1 } } },
          ]),
        ]);

        const counts: Record<string, number> = {};
        for (const s of Object.values(CustomerOrderStatus)) counts[s] = 0;
        for (const c of statusCounts) counts[c._id] = c.count;

        return ok(
          { orders: docs.map(toAdminOrder), counts },
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
