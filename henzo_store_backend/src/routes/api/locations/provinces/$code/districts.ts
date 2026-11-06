import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { withErrorHandling } from '@/server/http/handler';
import { ok } from '@/server/http/response';
import { badRequest } from '@/server/http/errors';
import { listDistricts, findProvince } from '@/server/services/location.service';

export const Route = createFileRoute(
  '/api/locations/provinces/$code/districts',
)({
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
