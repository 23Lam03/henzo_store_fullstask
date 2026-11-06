import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { fail } from '@/server/http/response';

/**
 * Catch-all cho mọi path không thuộc `/api` (vd: `/`, `/random-page`).
 *
 * Backend này là API-only: không có UI để render, nên trả JSON 404 theo chuẩn
 * envelope thay vì HTML 404 của TanStack Router. Route này cũng loại bỏ
 * warning "notFoundError was encountered on the route with ID __root__".
 *
 * Độ ưu tiên: TanStack Router ưu tiên route tĩnh > route có param > splat,
 * nên `/api/$` và các route cụ thể vẫn được khớp trước route này.
 */
export const Route = createFileRoute('/$')({
  server: {
    middleware: [corsMiddleware],
    handlers: {
      ANY: ({ params }) => {
        const path = (params._splat ?? '').replace(/^\/+|\/+$/g, '');
        return fail(
          path
            ? `Endpoint không tồn tại: /${path}`
            : 'Henzo Store API — chỉ phục vụ các endpoint dưới /api',
          404,
          'NOT_FOUND',
        );
      },
    },
  },
});
