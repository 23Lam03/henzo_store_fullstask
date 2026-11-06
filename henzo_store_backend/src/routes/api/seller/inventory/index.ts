import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { requireAuth } from '@/server/middleware/auth';
import { requireStoreOwner } from '@/server/middleware/store';
import { withErrorHandling } from '@/server/http/handler';
import { ok } from '@/server/http/response';
import { readPagination, toBool } from '@/server/http/request';
import { getStoreScope } from '@/server/http/store-scope';
import { InventoryModel, toInventoryDto } from '@/server/models/Inventory';
import { ProductModel } from '@/server/models/Product';
import { InventoryStatus } from '@/server/constants';
import { connectDB } from '@/server/db';

export const Route = createFileRoute('/api/seller/inventory/')({
  server: {
    middleware: [corsMiddleware, requireAuth, requireStoreOwner],
    handlers: {
            GET: withErrorHandling(async ({ request, context }) => {
        await connectDB();
        const scope = getStoreScope(context);

        const url = new URL(request.url);
        const sp = url.searchParams;
        const { page, pageSize } = readPagination(sp);

        const filter: Record<string, any> = scope.filter();

        if (sp.get('status')) filter.status = sp.get('status');
        if (toBool(sp.get('lowStock'))) {
          filter.stock = { $gt: 0, $lte: 10 };
        }
        if (toBool(sp.get('outOfStock'))) filter.stock = 0;

        const search = sp.get('q')?.trim();
        if (search) {
          const rx = new RegExp(
            search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
            'i',
          );
          filter.$or = [{ productName: rx }, { sku: rx }];
        }

        const [docs, total, summary] = await Promise.all([
          InventoryModel.find(filter)
            .sort({ status: 1, productName: 1 })
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .lean(),
          InventoryModel.countDocuments(filter),

          InventoryModel.aggregate([
            { $match: scope.aggMatch() },
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalStock: { $sum: '$stock' },
              },
            },
          ]),
        ]);

        const statusCounts: Record<string, number> = {
          [InventoryStatus.IN_STOCK]: 0,
          [InventoryStatus.LOW_STOCK]: 0,
          [InventoryStatus.OUT_OF_STOCK]: 0,
        };
        let totalStock = 0;
        for (const s of summary) {
          statusCounts[s._id] = s.count;
          totalStock += s.totalStock ?? 0;
        }

        return ok(
          {
            items: docs.map(toInventoryDto),
            summary: { statusCounts, totalStock },
          },
          {
            page,
            pageSize,
            total,
            totalPages: Math.max(1, Math.ceil(total / pageSize)),
          },
        );
      }),
    },
  },
});
