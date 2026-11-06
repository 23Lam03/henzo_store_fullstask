import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { withErrorHandling } from '@/server/http/handler';
import { ok } from '@/server/http/response';
import { readPagination, toBool } from '@/server/http/request';
import { StoreModel, toPublicStore } from '@/server/models/Store';
import { StoreStatus } from '@/server/constants';
import { connectDB } from '@/server/db';

export const Route = createFileRoute('/api/stores/')({
  server: {
    middleware: [corsMiddleware],
    handlers: {
      GET: withErrorHandling(async ({ request }) => {
        await connectDB();
        const url = new URL(request.url);
        const sp = url.searchParams;
        const { page, pageSize } = readPagination(sp);

        const filter: Record<string, any> = {};
        // Cửa hàng không hoạt động/suspended không hiện với khách.
        filter.status = sp.get('status') ?? StoreStatus.ACTIVE;

        if (toBool(sp.get('verified'))) filter.isVerified = true;

        const search = sp.get('q')?.trim();
        if (search) {
          const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
          filter.$or = [{ name: rx }, { address: rx }, { description: rx }];
        }

        const [docs, total] = await Promise.all([
          StoreModel.find(filter)
            .sort({ isVerified: -1, rating: -1, createdAt: -1 })
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .lean(),
          StoreModel.countDocuments(filter),
        ]);

        const meta = {
          page,
          pageSize,
          total,
          totalPages: Math.max(1, Math.ceil(total / pageSize)),
        };

        return ok(docs.map(toPublicStore), meta);
      }),
    },
  },
});
