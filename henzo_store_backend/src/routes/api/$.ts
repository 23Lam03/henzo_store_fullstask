import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { fail } from '@/server/http/response';

/**
 * Catch-all cho mọi path dưới `/api` không khớp route nào.
 *
 * Backend này là API-only, nên mọi path `/api/...` lạ đều phải trả JSON theo
 * chuẩn envelope — không phải HTML 404 của TanStack Router (mặc định).
 * Nếu không có route này, client sẽ parse HTML thất bại và báo
 * "Máy chủ trả về dữ liệu không hợp lệ" thay vì lỗi 404 có nghĩa.
 */
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
