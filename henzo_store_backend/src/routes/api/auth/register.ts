import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { readJson } from '@/server/http/request';
import { okWithHeaders } from '@/server/http/response';
import { withErrorHandling } from '@/server/http/handler';
import { registerSchema, register } from '@/server/services/auth.service';
import { buildRefreshCookie } from '@/server/auth/cookies';

export const Route = createFileRoute('/api/auth/register')({
  server: {
    middleware: [corsMiddleware],
    handlers: {
      POST: withErrorHandling(async ({ request }) => {
        const body = await readJson(request, registerSchema);
        const result = await register(body);

        return okWithHeaders(
          { user: result.user, accessToken: result.accessToken },
          { 'Set-Cookie': buildRefreshCookie(result.refreshToken) },
        );
      }),
    },
  },
});
