import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { withErrorHandling } from '@/server/http/handler';
import { ok } from '@/server/http/response';
import { badRequest } from '@/server/http/errors';
import { listWards, findDistrict } from '@/server/services/location.service';

export const Route = createFileRoute('/api/locations/districts/$code/wards')({
  server: {
    middleware: [corsMiddleware],
    handlers: {
      GET: withErrorHandling(async ({ params }) => {
        if (!findDistrict(params.code)) {
          throw badRequest('Mã quận/huyện không hợp lệ.');
        }
        return ok(listWards(params.code));
      }),
    },
  },
});
