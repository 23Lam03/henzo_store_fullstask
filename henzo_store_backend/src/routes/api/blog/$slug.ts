import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { withErrorHandling } from '@/server/http/handler';
import { ok } from '@/server/http/response';
import { notFound } from '@/server/http/errors';
import { BlogModel, toBlogDto } from '@/server/models/Blog';
import { connectDB } from '@/server/db';

export const Route = createFileRoute('/api/blog/$slug')({
  server: {
    middleware: [corsMiddleware],
    handlers: {
      /** Chi tiết bài viết theo slug. */
      GET: withErrorHandling(async ({ params }) => {
        await connectDB();
        const key = params.slug;

        const post =
          (await BlogModel.findOne({ slug: key }).lean()) ??
          (await BlogModel.findById(key).lean());

        if (!post) throw notFound('Không tìm thấy bài viết');

        // Tăng lượt xem (không chặn response).
        BlogModel.updateOne({ _id: post._id }, { $inc: { views: 1 } }).catch(
          () => {},
        );

        // Bài viết liên quan: cùng chuyên mục, tối đa 5.
        const related = await BlogModel.find({
          _id: { $ne: post._id },
          ...(post.category ? { category: post.category } : {}),
        })
          .sort({ createdAt: -1 })
          .limit(5)
          .lean();

        return ok({ post: toBlogDto(post), related: related.map(toBlogDto) });
      }),
    },
  },
});
