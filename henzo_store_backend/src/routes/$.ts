import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { fail } from '@/server/http/response';

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
