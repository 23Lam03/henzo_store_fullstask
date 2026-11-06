import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { requireAuth } from '@/server/middleware/auth';
import { withErrorHandling } from '@/server/http/handler';
import { ok } from '@/server/http/response';
import { readJson } from '@/server/http/request';
import { z } from 'zod';
import { toCustomerOrder } from '@/server/models/Order';
import { updateOrderStatus } from '@/server/services/order-workflow.service';
import { connectDB } from '@/server/db';

const statusSchema = z.object({
  status: z.string().min(1, 'Thiếu trạng thái'),
  note: z.string().trim().max(500).optional(),
  trackingNumber: z.string().trim().max(100).optional(),
  shippingPartner: z.string().trim().max(100).optional(),
});

export const Route = createFileRoute('/api/orders/$id/status')({
  server: {
    middleware: [corsMiddleware, requireAuth],
    handlers: {
      /**
       * Cập nhật trạng thái đơn.
       * - Seller cập nhật sub-order của cửa hàng mình.
       * - Admin cập nhật toàn bộ đơn.
       */
      PATCH: withErrorHandling(async ({ request, params, context }) => {
        await connectDB();
        const body = await readJson(request, statusSchema);

        const actorRole =
          context.auth.role === 'ADMIN'
            ? 'ADMIN'
            : context.auth.role === 'SHOP'
              ? 'SHOP'
              : 'CUSTOMER';

        const order = await updateOrderStatus({
          orderId: params.id,
          storeId: context.auth.storeId,
          status: body.status,
          note: body.note,
          trackingNumber: body.trackingNumber,
          shippingPartner: body.shippingPartner,
          actorRole,
        });

        return ok(toCustomerOrder(order));
      }),
    },
  },
});
