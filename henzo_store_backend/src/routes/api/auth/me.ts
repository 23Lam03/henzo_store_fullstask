import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { requireAuth } from '@/server/middleware/auth';
import { ok } from '@/server/http/response';
import { withErrorHandling } from '@/server/http/handler';
import { UserModel, toPublicUser } from '@/server/models/User';

export const Route = createFileRoute('/api/auth/me')({
  server: {
    middleware: [corsMiddleware, requireAuth],
    handlers: {
      GET: withErrorHandling(async ({ context }) => {
        const user = await UserModel.findById(context.auth!.userId);
        return ok(toPublicUser(user));
      }),
    },
  },
});
