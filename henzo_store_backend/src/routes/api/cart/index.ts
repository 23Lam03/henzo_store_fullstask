import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { requireAuth } from '@/server/middleware/auth';
import { withErrorHandling } from '@/server/http/handler';
import { ok } from '@/server/http/response';
import { readJson } from '@/server/http/request';
import { z } from 'zod';
import {
  getCart,
  clearCart,
  selectAllCartItems,
} from '@/server/services/order.service';
import { connectDB } from '@/server/db';

const selectAllSchema = z.object({
  selected: z.boolean().default(true),
});

export const Route = createFileRoute('/api/cart/')({
  server: {
    middleware: [corsMiddleware, requireAuth],
    handlers: {
      GET: withErrorHandling(async ({ context }) => {
        await connectDB();
        return ok(await getCart(context.auth.userId));
      }),

      /** Chọn / bỏ chọn tất cả mục trong giỏ. */
      PATCH: withErrorHandling(async ({ request, context }) => {
        await connectDB();
        const body = await readJson(request, selectAllSchema);
        return ok(
          await selectAllCartItems(context.auth.userId, body.selected),
        );
      }),

      DELETE: withErrorHandling(async ({ request, context }) => {
        await connectDB();
        const url = new URL(request.url);
        const onlySelected = url.searchParams.get('selected') === '1';
        return ok(await clearCart(context.auth.userId, onlySelected));
      }),
    },
  },
});
