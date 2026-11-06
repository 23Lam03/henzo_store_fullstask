import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { requireAuth } from '@/server/middleware/auth';
import { withErrorHandling } from '@/server/http/handler';
import { ok } from '@/server/http/response';
import { readJson } from '@/server/http/request';
import { z } from 'zod';
import {
  updateCartItem,
  toggleCartItem,
  removeCartItem,
} from '@/server/services/order.service';
import { connectDB } from '@/server/db';

const updateSchema = z.object({
  quantity: z.coerce.number().int().min(0).max(999),
});

const toggleSchema = z.object({
  selected: z.boolean().default(true),
});

export const Route = createFileRoute('/api/cart/items/$productId')({
  server: {
    middleware: [corsMiddleware, requireAuth],
    handlers: {
      /** Cập nhật số lượng (quantity = 0 => xoá khỏi giỏ). */
      PATCH: withErrorHandling(async ({ request, params, context }) => {
        await connectDB();
        const body = await readJson(request, updateSchema);
        return ok(
          await updateCartItem(context.auth.userId, params.productId, body.quantity),
        );
      }),

      /** Chọn / bỏ chọn một mục trong giỏ. */
      PUT: withErrorHandling(async ({ request, params, context }) => {
        await connectDB();
        const body = await readJson(request, toggleSchema);
        return ok(
          await toggleCartItem(context.auth.userId, params.productId, body.selected),
        );
      }),

      /** Xoá một mục khỏi giỏ. */
      DELETE: withErrorHandling(async ({ params, context }) => {
        await connectDB();
        return ok(await removeCartItem(context.auth.userId, params.productId));
      }),
    },
  },
});
