import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { requireAuth } from '@/server/middleware/auth';
import { requireAdmin } from '@/server/middleware/admin';
import { withErrorHandling } from '@/server/http/handler';
import { ok } from '@/server/http/response';
import { readJson, readPagination, buildMeta } from '@/server/http/request';
import { z } from 'zod';
import { NotificationModel, toNotificationDto } from '@/server/models/Notification';
import {
  AdminNotificationType,
  NotificationAudience,
} from '@/server/constants';
import { connectDB } from '@/server/db';

const createSchema = z.object({
  title: z.string().trim().min(1, 'Vui lòng nhập tiêu đề.').max(200),
  message: z.string().trim().min(1, 'Vui lòng nhập nội dung.').max(2000),
  type: z.enum(Object.values(AdminNotificationType)).optional().default(AdminNotificationType.SYSTEM),
  audience: z
    .enum(Object.values(NotificationAudience))
    .optional()
    .default(NotificationAudience.ALL),
  link: z.string().trim().max(500).optional().default(''),
});

export const Route = createFileRoute('/api/admin/notifications/')({
  server: {
    middleware: [corsMiddleware, requireAuth, requireAdmin],
    handlers: {
      /** Danh sách thông báo đã gửi. */
      GET: withErrorHandling(async ({ request }) => {
        await connectDB();
        const url = new URL(request.url);
        const sp = url.searchParams;
        const { page, pageSize } = readPagination(sp);

        const filter: Record<string, any> = { userId: null };

        const type = sp.get('type');
        if (type && type !== 'all') filter.type = type;

        const [docs, total, counts] = await Promise.all([
          NotificationModel.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .lean(),
          NotificationModel.countDocuments(filter),
          NotificationModel.aggregate([
            { $match: { userId: null } },
            { $group: { _id: '$type', count: { $sum: 1 } } },
          ]),
        ]);

        const typeCounts: Record<string, number> = {};
        for (const t of Object.values(AdminNotificationType)) {
          typeCounts[t] = 0;
        }
        for (const c of counts) typeCounts[c._id] = c.count;

        return ok(
          { notifications: docs.map(toNotificationDto), counts: typeCounts },
          buildMeta(page, pageSize, total),
        );
      }),

      /** Tạo & gửi thông báo tới nhóm đối tượng. */
      POST: withErrorHandling(async ({ request }) => {
        await connectDB();
        const body = await readJson(request, createSchema);

        const notification = await NotificationModel.create({
          userId: null,
          audience: body.audience,
          type: body.type,
          title: body.title,
          message: body.message,
          link: body.link,
          isRead: false,
          isSystem: false,
        });

        return ok(toNotificationDto(notification), undefined, 201);
      }),
    },
  },
});
