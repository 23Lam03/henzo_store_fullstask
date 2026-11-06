import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { withErrorHandling } from '@/server/http/handler';
import { ok } from '@/server/http/response';
import { readPagination, normalizeSearch } from '@/server/http/request';
import { BlogModel, toBlogDto } from '@/server/models/Blog';
import { connectDB } from '@/server/db';

export const Route = createFileRoute('/api/blog/')({
  server: {
    middleware: [corsMiddleware],
    handlers: {
            GET: withErrorHandling(async ({ request }) => {
        await connectDB();
        const url = new URL(request.url);
        const sp = url.searchParams;
        const { page, pageSize } = readPagination(sp);

        const filter: Record<string, any> = {};

        const search = normalizeSearch(sp.get('q'));
        if (search) {
          const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
          filter.$or = [{ title: rx }, { excerpt: rx }, { tags: rx }];
        }

        if (sp.get('category')) filter.category = sp.get('category');

        const [docs, total] = await Promise.all([
          BlogModel.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .lean(),
          BlogModel.countDocuments(filter),
        ]);

        return ok(
          docs.map(toBlogDto),
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
