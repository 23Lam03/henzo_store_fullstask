import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { withErrorHandling } from '@/server/http/handler';
import { ok } from '@/server/http/response';
import { readPagination, toBool, toInt, toFloat, splitCsv } from '@/server/http/request';
import { queryProducts } from '@/server/services/catalog.service';
import { connectDB } from '@/server/db';

export const Route = createFileRoute('/api/products/')({
  server: {
    middleware: [corsMiddleware],
    handlers: {
      GET: withErrorHandling(async ({ request }) => {
        await connectDB();
        const url = new URL(request.url);
        const sp = url.searchParams;
        const { page, pageSize } = readPagination(sp);

        const result = await queryProducts({
          page,
          pageSize,
          search: sp.get('q') ?? sp.get('search') ?? undefined,
          categoryId: sp.get('categoryId') ?? undefined,
          categorySlug: sp.get('category') ?? sp.get('categorySlug') ?? undefined,
          brand: sp.get('brand') ?? undefined,
          brands: splitCsv(sp.get('brands')),
          storeId: sp.get('storeId') ?? undefined,
          minPrice: sp.has('minPrice') ? toInt(sp.get('minPrice'), 0) : undefined,
          maxPrice: sp.has('maxPrice') ? toInt(sp.get('maxPrice'), 0) : undefined,
          rating: sp.has('rating') ? toInt(sp.get('rating'), 0) : undefined,
          inStock: toBool(sp.get('inStock')),
          hasDiscount: toBool(sp.get('hasDiscount')),
          featured: toBool(sp.get('featured')),
          isNew: toBool(sp.get('isNew')),
          isHot: toBool(sp.get('isHot')),
          sort: sp.get('sort') ?? undefined,
          order: sp.get('order') ?? undefined,
        });

        return ok(result.products, result.meta);
      }),
    },
  },
});
