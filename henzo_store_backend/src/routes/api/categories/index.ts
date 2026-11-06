import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { withErrorHandling } from '@/server/http/handler';
import { ok } from '@/server/http/response';
import { CategoryModel, toCategoryDto } from '@/server/models/Category';
import { connectDB } from '@/server/db';

export const Route = createFileRoute('/api/categories/')({
  server: {
    middleware: [corsMiddleware],
    handlers: {
      GET: withErrorHandling(async ({ request }) => {
        await connectDB();
        const url = new URL(request.url);
        const sp = url.searchParams;
        const flat = sp.get('flat') === '1';

        const all = await CategoryModel.find().sort({ order: 1, name: 1 }).lean();

        if (flat) {
          return ok(all.map(toCategoryDto));
        }

        const roots = all.filter((c) => !c.parentId);
        const childrenByParent = new Map<string, any[]>();

        for (const child of all.filter((c) => c.parentId)) {
          const key = String(child.parentId);
          const list = childrenByParent.get(key) ?? [];
          list.push(child);
          childrenByParent.set(key, list);
        }

        const tree = roots.map((root) => ({
          ...toCategoryDto(root),
          children: (childrenByParent.get(String(root._id)) ?? []).map(
            toCategoryDto,
          ),
        }));

        return ok(tree);
      }),
    },
  },
});
