import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { requireAuth } from '@/server/middleware/auth';
import { requireStoreOwner } from '@/server/middleware/store';
import { withErrorHandling } from '@/server/http/handler';
import { ok } from '@/server/http/response';
import { readPagination } from '@/server/http/request';
import { getStoreScope } from '@/server/http/store-scope';
import { NotificationModel, toNotificationDto } from '@/server/models/Notification';
import { connectDB } from '@/server/db';

export const Route = createFileRoute('/api/seller/notifications/')({
  server: {
    middleware: [corsMiddleware, requireAuth, requireStoreOwner],
    handlers: {
      /** Thông báo của cửa hàng. */
      GET: withErrorHandling(async ({ request, context }) => {
        await connectDB();
        const scope = getStoreScope(context);

        const url = new URL(request.url);
        const sp = url.searchParams;
        const { page, pageSize } = readPagination(sp);

        // Chỉ lấy thông báo thuộc cửa hàng (bỏ qua thông báo gửi cho khách).
        const filter: Record<string, any> = scope.storeOnlyFilter();
        if (sp.get('unread') === '1') filter.isRead = false;

        const [docs, total, unreadCount] = await Promise.all([
          NotificationModel.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .lean(),
          NotificationModel.countDocuments(filter),
          NotificationModel.countDocuments({
            ...scope.storeOnlyFilter(),
            isRead: false,
          }),
        ]);

        return ok(
          { notifications: docs.map(toNotificationDto), unreadCount },
          {
            page,
            pageSize,
            total,
            totalPages: Math.max(1, Math.ceil(total / pageSize)),
          },
        );
      }),

      /** Đánh dấu đã đọc. */
      PATCH: withErrorHandling(async ({ request, context }) => {
        await connectDB();
        // Đánh dấu đã đọc là thao tác ghi -> bắt buộc có một cửa hàng cụ thể.
        const storeId = getStoreScope(context).require();
        const url = new URL(request.url);
        const sp = url.searchParams;

        if (sp.get('all') === '1') {
          await NotificationModel.updateMany(
            { storeId, isRead: false },
            { $set: { isRead: true } },
          );
          return ok({ updated: 'all' });
        }

        const id = sp.get('id');
        if (!id) return ok({ updated: 0 });

        await NotificationModel.updateOne(
          { _id: id, storeId },
          { $set: { isRead: true } },
        );
        return ok({ id, isRead: true });
      }),

      /** Xoá thông báo. */
      DELETE: withErrorHandling(async ({ request, context }) => {
        await connectDB();
        // Xoá thông báo là thao tác ghi -> bắt buộc có một cửa hàng cụ thể.
        const storeId = getStoreScope(context).require();
        const url = new URL(request.url);
        const id = url.searchParams.get('id');

        if (id) {
          await NotificationModel.deleteOne({ _id: id, storeId });
          return ok({ id, deleted: true });
        }

        const result = await NotificationModel.deleteMany({
          storeId,
          isRead: true,
        });
        return ok({ deletedCount: result.deletedCount ?? 0 });
      }),
    },
  },
});
