import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { okWithHeaders } from '@/server/http/response';
import { clearRefreshCookie } from '@/server/auth/cookies';

export const Route = createFileRoute('/api/auth/logout')({
  server: {
    middleware: [corsMiddleware],
    handlers: {
      POST: async () =>
        okWithHeaders({ success: true }, { 'Set-Cookie': clearRefreshCookie() }),
    },
  },
});
