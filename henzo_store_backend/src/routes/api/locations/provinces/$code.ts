import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { withErrorHandling } from '@/server/http/handler';
import { ok } from '@/server/http/response';
import { badRequest } from '@/server/http/errors';
import { listDistricts, findProvince } from '@/server/services/location.service';

/**
 * Quận/huyện thuộc một tỉnh/thành phố.
 *
 * Route con `/api/locations/provinces/$code/districts` được tách sang file
 * riêng (`districts.ts`) theo convention file-based routing của TanStack
 * Router — khai báo nhiều `createFileRoute` trong cùng một file làm
 * TypeScript không sinh đúng route tree và báo lỗi typecheck.
 */
export const Route = createFileRoute('/api/locations/provinces/$code')({
  server: {
    middleware: [corsMiddleware],
    handlers: {
      GET: withErrorHandling(async ({ params }) => {
        if (!findProvince(params.code)) {
          throw badRequest('Mã tỉnh/thành phố không hợp lệ.');
        }
        return ok(listDistricts(params.code));
      }),
    },
  },
});
