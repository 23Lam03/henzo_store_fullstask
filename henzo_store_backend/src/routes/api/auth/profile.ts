import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { requireAuth } from '@/server/middleware/auth';
import { readJson } from '@/server/http/request';
import { ok } from '@/server/http/response';
import { withErrorHandling } from '@/server/http/handler';
import {
  updateProfileSchema,
  updateProfile,
} from '@/server/services/auth.service';

export const Route = createFileRoute('/api/auth/profile')({
  server: {
    middleware: [corsMiddleware, requireAuth],
    handlers: {
      PATCH: withErrorHandling(async ({ request, context }) => {
        const body = await readJson(request, updateProfileSchema);
        const user = await updateProfile(context.auth!.userId, body);
        return ok(user);
      }),
    },
  },
});
