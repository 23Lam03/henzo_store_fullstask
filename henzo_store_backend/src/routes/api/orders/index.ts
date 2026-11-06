import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { requireAuth } from '@/server/middleware/auth';
import { withErrorHandling } from '@/server/http/handler';
import { ok } from '@/server/http/response';
import { readJson, readPagination, toInt } from '@/server/http/request';
import { z } from 'zod';
import { createOrder } from '@/server/services/order.service';
import { OrderModel, toCustomerOrder } from '@/server/models/Order';
import { connectDB } from '@/server/db';

const orderItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(999),
});

const createOrderSchema = z.object({
  items: z.array(orderItemSchema).optional(),
  shippingName: z.string().trim().min(1, 'Vui lòng nhập họ tên.'),
  shippingPhone: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập số điện thoại.')
    .regex(/^0[0-9]{9}$/, 'Số điện thoại không hợp lệ.'),
  shippingAddress: z.string().trim().min(1, 'Vui lòng nhập địa chỉ giao hàng.'),
  shippingProvince: z.string().trim().optional(),
  shippingDistrict: z.string().trim().optional(),
  shippingWard: z.string().trim().optional(),
  note: z.string().trim().optional(),
  paymentMethod: z.string().trim().min(1, 'Vui lòng chọn phương thức thanh toán.'),
  voucherCode: z.string().trim().optional(),
});

export const Route = createFileRoute('/api/orders/')({
  server: {
    middleware: [corsMiddleware, requireAuth],
    handlers: {
            GET: withErrorHandling(async ({ request, context }) => {
        await connectDB();

        const url = new URL(request.url);
        const sp = url.searchParams;
        const { page, pageSize } = readPagination(sp);
        const status = sp.get('status');

        const filter: Record<string, any> = { customerId: context.auth.userId };
        if (status) filter.status = { $in: status.split(',').map((s) => s.trim()) };

        const [docs, total] = await Promise.all([
          OrderModel.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .lean(),
          OrderModel.countDocuments(filter),
        ]);

        return ok(
          docs.map(toCustomerOrder),
          {
            page,
            pageSize,
            total,
            totalPages: Math.max(1, Math.ceil(total / pageSize)),
          },
        );
      }),

            POST: withErrorHandling(async ({ request, context }) => {
        await connectDB();
        const body = await readJson(request, createOrderSchema);
        const order = await createOrder(context.auth.userId, body as any);
        return ok(toCustomerOrder(order), undefined, 201);
      }),
    },
  },
});
