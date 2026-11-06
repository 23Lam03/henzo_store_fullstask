import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { requireAuth } from '@/server/middleware/auth';
import { requireStoreOwner } from '@/server/middleware/store';
import { withErrorHandling } from '@/server/http/handler';
import { ok } from '@/server/http/response';
import { readJson } from '@/server/http/request';
import { getStoreScope } from '@/server/http/store-scope';
import { z } from 'zod';
import { toSellerOrder } from '@/server/models/Order';
import { updateOrderStatus } from '@/server/services/order-workflow.service';
import { SellerOrderStatus } from '@/server/constants';
import { badRequest } from '@/server/http/errors';
import { connectDB } from '@/server/db';

const statusSchema = z.object({
  status: z
    .string()
    .refine((v) => Object.values(SellerOrderStatus).includes(v as any), {
      message: 'Trạng thái không hợp lệ',
    }),
  note: z.string().trim().max(500).optional(),
  trackingNumber: z.string().trim().max(100).optional(),
  shippingPartner: z.string().trim().max(100).optional(),
});

export const Route = createFileRoute('/api/seller/orders/$id/status')({
  server: {
    middleware: [corsMiddleware, requireAuth, requireStoreOwner],
    handlers: {
      /**
       * Seller cập nhật trạng thái sub-order của cửa hàng mình.
       * Sơ đồ trạng thái được kiểm tra trong `order-workflow.service`.
       */
      PATCH: withErrorHandling(async ({ request, params, context }) => {
        await connectDB();
        // Đổi trạng thái là thao tác ghi -> bắt buộc có một cửa hàng cụ thể.
        const storeId = getStoreScope(context).require();
        const body = await readJson(request, statusSchema);

        const order = await updateOrderStatus({
          orderId: params.id,
          storeId,
          status: body.status,
          note: body.note,
          trackingNumber: body.trackingNumber,
          shippingPartner: body.shippingPartner,
          actorRole: 'SHOP',
        });

        return ok(toSellerOrder(order, storeId));
      }),
    },
  },
});
