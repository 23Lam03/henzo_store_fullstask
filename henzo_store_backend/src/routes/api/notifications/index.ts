import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { requireAuth } from '@/server/middleware/auth';
import { withErrorHandling } from '@/server/http/handler';
import { ok } from '@/server/http/response';
import { readPagination, toBool } from '@/server/http/request';
import { NotificationModel, toNotificationDto } from '@/server/models/Notification';
import { NotificationAudience } from '@/server/constants';
import { connectDB } from '@/server/db';

export const Route = createFileRoute('/api/notifications/')({
  server: {
    middleware: [corsMiddleware, requireAuth],
    handlers: {
      /** Danh sách thông báo của người dùng. */
      GET: withErrorHandling(async ({ request, context }) => {
        await connectDB();
        const url = new URL(request.url);
        const sp = url.searchParams;
        const { page, pageSize } = readPagination(sp);

        const filter: Record<string, any> = { userId: context.auth.userId };
        if (toBool(sp.get('unread'))) filter.isRead = false;
        if (sp.get('type')) filter.type = sp.get('type');

        const [docs, total, unreadCount] = await Promise.all([
          NotificationModel.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .lean(),
          NotificationModel.countDocuments(filter),
          NotificationModel.countDocuments({
            userId: context.auth.userId,
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

      /** Đánh dấu đã đọc (một thông báo hoặc tất cả). */
      PATCH: withErrorHandling(async ({ request, context }) => {
        await connectDB();
        const url = new URL(request.url);
        const sp = url.searchParams;

        const all = sp.get('all') === '1';
        if (all) {
          await NotificationModel.updateMany(
            { userId: context.auth.userId, isRead: false },
            { $set: { isRead: true } },
          );
          return ok({ updated: 'all' });
        }

        const id = sp.get('id');
        if (!id) {
          return ok({ updated: 0 });
        }

        await NotificationModel.updateOne(
          { _id: id, userId: context.auth.userId },
          { $set: { isRead: true } },
        );
        return ok({ id, isRead: true });
      }),

      /** Xoá thông báo. */
      DELETE: withErrorHandling(async ({ request, context }) => {
        await connectDB();
        const url = new URL(request.url);
        const id = url.searchParams.get('id');

        if (id) {
          await NotificationModel.deleteOne({
            _id: id,
            userId: context.auth.userId,
          });
          return ok({ id, deleted: true });
        }

        // Không có id -> xoá tất cả đã đọc.
        const result = await NotificationModel.deleteMany({
          userId: context.auth.userId,
          isRead: true,
        });
        return ok({ deletedCount: result.deletedCount ?? 0 });
      }),
    },
  },
});
