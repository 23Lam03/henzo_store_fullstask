import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { requireAuth } from '@/server/middleware/auth';
import { withErrorHandling } from '@/server/http/handler';
import { ok } from '@/server/http/response';
import { readJson } from '@/server/http/request';
import { z } from 'zod';
import { SearchHistoryModel } from '@/server/models/SearchHistory';
import { connectDB } from '@/server/db';

/** Số lượng lượt tìm kiếm được giữ lại cho mỗi người dùng. */
const MAX_HISTORY = 10;

const recordSchema = z.object({
  query: z.string().trim().min(1).max(120),
});

export const Route = createFileRoute('/api/search-history/')({
  server: {
    middleware: [corsMiddleware, requireAuth],
    handlers: {
      /** Lịch sử tìm kiếm gần đây (tối đa 10 lượt). */
      GET: withErrorHandling(async ({ context }) => {
        await connectDB();
        const docs = await SearchHistoryModel.find({
          userId: context.auth.userId,
        })
          .sort({ timestamp: -1 })
          .limit(MAX_HISTORY)
          .lean();

        return ok(
          docs.map((d: any) => ({
            id: String(d._id),
            query: d.query,
            timestamp: d.timestamp,
          })),
        );
      }),

      /** Ghi lại một lượt tìm kiếm (ghi đè trùng, chỉ giữ 10 lượt gần nhất). */
      POST: withErrorHandling(async ({ request, context }) => {
        await connectDB();
        const body = await readJson(request, recordSchema);

        // Trùng từ khoá -> cập nhật thời điểm, không tạo bản ghi mới.
        await SearchHistoryModel.findOneAndUpdate(
          { userId: context.auth.userId, query: body.query },
          { $set: { timestamp: new Date() } },
          { upsert: true, new: true },
        );

        // Cắt bỏ các lượt cũ ngoài 10 lượt gần nhất.
        const stale = await SearchHistoryModel.find({
          userId: context.auth.userId,
        })
          .sort({ timestamp: -1 })
          .skip(MAX_HISTORY)
          .select('_id')
          .lean();

        if (stale.length) {
          await SearchHistoryModel.deleteMany({
            _id: { $in: stale.map((s: any) => s._id) },
          });
        }

        return ok({ query: body.query }, undefined, 201);
      }),

      /** Xoá toàn bộ lịch sử tìm kiếm. */
      DELETE: withErrorHandling(async ({ context }) => {
        await connectDB();
        const result = await SearchHistoryModel.deleteMany({
          userId: context.auth.userId,
        });
        return ok({ deletedCount: result.deletedCount ?? 0 });
      }),
    },
  },
});
