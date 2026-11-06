import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { fail } from '@/server/http/response';

export const Route = createFileRoute('/api/$')({
  server: {
    middleware: [corsMiddleware],
    handlers: {
      ANY: ({ params }) => {
        const path = (params._splat ?? '').replace(/\/+$/, '');
        return fail(
          `Endpoint không tồn tại: /api/${path}`,
          404,
          'NOT_FOUND',
        );
      },
    },
  },
});
