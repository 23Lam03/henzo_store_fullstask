import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { requireAuth } from '@/server/middleware/auth';
import { withErrorHandling } from '@/server/http/handler';
import { ok } from '@/server/http/response';
import { readJson } from '@/server/http/request';
import { z } from 'zod';
import { addToCart } from '@/server/services/order.service';
import { connectDB } from '@/server/db';

const addSchema = z.object({
  productId: z.string().min(1, 'Thiếu mã sản phẩm'),
  quantity: z.coerce.number().int().min(1).max(999).default(1),
});

export const Route = createFileRoute('/api/cart/items/')({
  server: {
    middleware: [corsMiddleware, requireAuth],
    handlers: {
      /** Thêm sản phẩm vào giỏ (tự cộng dồn nếu đã tồn tại). */
      POST: withErrorHandling(async ({ request, context }) => {
        await connectDB();
        const body = await readJson(request, addSchema);
        return ok(
          await addToCart(context.auth.userId, body.productId, body.quantity),
        );
      }),
    },
  },
});
