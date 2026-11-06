import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { requireAuth } from '@/server/middleware/auth';
import { requireStoreOwner } from '@/server/middleware/store';
import { withErrorHandling } from '@/server/http/handler';
import { ok } from '@/server/http/response';
import { readPagination } from '@/server/http/request';
import { getStoreScope } from '@/server/http/store-scope';
import { OrderModel, toSellerOrder } from '@/server/models/Order';
import { SellerOrderStatus } from '@/server/constants';
import { connectDB } from '@/server/db';

export const Route = createFileRoute('/api/seller/orders/')({
  server: {
    middleware: [corsMiddleware, requireAuth, requireStoreOwner],
    handlers: {
      /** Danh sách đơn hàng của cửa hàng. */
      GET: withErrorHandling(async ({ request, context }) => {
        await connectDB();
        const scope = getStoreScope(context);
        const storeId = scope.storeId;

        const url = new URL(request.url);
        const sp = url.searchParams;
        const { page, pageSize } = readPagination(sp);

        const filter: Record<string, any> = scope.subOrderFilter();

        const status = sp.get('status');
        if (status) {
          const statuses = status.split(',').map((s) => s.trim());
          filter['subOrders.status'] = { $in: statuses };
        }

        const search = sp.get('q')?.trim();
        if (search) {
          const rx = new RegExp(
            search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
            'i',
          );
          filter.$or = [
            { orderNumber: rx },
            { customerName: rx },
            { customerPhone: rx },
          ];
        }

        const sortMap: Record<string, Record<string, 1 | -1>> = {
          newest: { createdAt: -1 },
          oldest: { createdAt: 1 },
          'price-desc': { totalPrice: -1 },
          'price-asc': { totalPrice: 1 },
        };
        const sort = sortMap[sp.get('sort') ?? 'newest'] ?? { createdAt: -1 };

        const [docs, total, counts] = await Promise.all([
          OrderModel.find(filter)
            .sort(sort)
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .lean(),
          OrderModel.countDocuments(filter),
          // Đếm số ĐƠN (parent order) theo trạng thái của sub-order thuộc cửa hàng.
          // Dùng `$addToSet` để mỗi đơn cha chỉ được tính 1 lần cho mỗi trạng
          // thái -> khớp với `total` (số đơn) và với danh sách trả về.
          // Lưu ý: `$match` trong pipeline KHÔNG tự ép chuỗi -> ObjectId nên
          // phải dùng `aggSubOrderMatch()` (đã ép kiểu).
          OrderModel.aggregate([
            { $match: scope.aggSubOrderMatch() },
            { $unwind: '$subOrders' },
            ...(scope.storeId
              ? [
                  {
                    $match: {
                      'subOrders.storeId':
                        scope.aggSubOrderMatch()['subOrders.storeId'],
                    },
                  },
                ]
              : []),
            {
              $group: {
                _id: '$subOrders.status',
                orders: { $addToSet: '$_id' },
              },
            },
            { $project: { _id: 1, count: { $size: '$orders' } } },
          ]),
        ]);

        // Đếm số đơn theo từng trạng thái (dùng cho tab/badge ở UI).
        const statusCounts: Record<string, number> = {};
        for (const s of Object.values(SellerOrderStatus)) statusCounts[s] = 0;
        for (const c of counts) statusCounts[c._id] = c.count;

        return ok(
          {
            orders: docs.map((o) => toSellerOrder(o, storeId)),
            statusCounts,
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
