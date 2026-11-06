import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { okWithHeaders } from '@/server/http/response';
import { withErrorHandling } from '@/server/http/handler';
import {
  buildRefreshCookie,
  clearRefreshCookie,
  readCookie,
} from '@/server/auth/cookies';
import { verifyRefreshToken } from '@/server/auth/tokens';
import { refreshSession } from '@/server/services/auth.service';

export const Route = createFileRoute('/api/auth/refresh')({
  server: {
    middleware: [corsMiddleware],
    handlers: {
      POST: withErrorHandling(async ({ request }) => {
        const token = readCookie(request);
        if (!token) {
          return okWithHeaders(
            { accessToken: null },
            { 'Set-Cookie': clearRefreshCookie() },
            undefined,
            401,
          );
        }

        const payload = verifyRefreshToken(token);
        if (!payload) {
          return okWithHeaders(
            { accessToken: null },
            { 'Set-Cookie': clearRefreshCookie() },
            undefined,
            401,
          );
        }

        const result = await refreshSession(
          payload.sub,
          payload.role,
          payload.storeId,
        );

        return okWithHeaders(
          { accessToken: result.accessToken, user: result.user },
          { 'Set-Cookie': buildRefreshCookie(result.refreshToken) },
        );
      }),
    },
  },
});
