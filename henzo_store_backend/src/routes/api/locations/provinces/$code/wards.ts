import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { withErrorHandling } from '@/server/http/handler';
import { ok } from '@/server/http/response';
import { badRequest } from '@/server/http/errors';
import { listDistricts, listWards, findProvince } from '@/server/services/location.service';

/** Phường/xã thuộc tỉnh/thành phố (gộp toàn bộ xã của các huyện). */
export const Route = createFileRoute('/api/locations/provinces/$code/wards')({
  server: {
    middleware: [corsMiddleware],
    handlers: {
      GET: withErrorHandling(async ({ params }) => {
        if (!findProvince(params.code)) {
          throw badRequest('Mã tỉnh/thành phố không hợp lệ.');
        }
        // Gộp toàn bộ xã của tỉnh (tương thích dữ liệu cũ chỉ có 2 cấp).
        return ok(listDistricts(params.code).flatMap((d) => listWards(d.code)));
      }),
    },
  },
});
