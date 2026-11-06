import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { withErrorHandling } from '@/server/http/handler';
import { ok } from '@/server/http/response';
import { listProvinces } from '@/server/services/location.service';

export const Route = createFileRoute('/api/locations/provinces')({
  server: {
    middleware: [corsMiddleware],
    handlers: {
      GET: withErrorHandling(async () => {
        return ok(listProvinces());
      }),
    },
  },
});
