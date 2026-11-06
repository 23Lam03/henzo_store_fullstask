import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { requireAuth } from '@/server/middleware/auth';
import { readJson } from '@/server/http/request';
import { ok } from '@/server/http/response';
import { withErrorHandling } from '@/server/http/handler';
import {
  changePasswordSchema,
  changePassword,
} from '@/server/services/auth.service';

export const Route = createFileRoute('/api/auth/password')({
  server: {
    middleware: [corsMiddleware, requireAuth],
    handlers: {
      POST: withErrorHandling(async ({ request, context }) => {
        const body = await readJson(request, changePasswordSchema);
        await changePassword(context.auth!.userId, body);
        return ok({ success: true });
      }),
    },
  },
});
