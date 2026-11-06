import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { requireAuth } from '@/server/middleware/auth';
import { withErrorHandling } from '@/server/http/handler';
import { ok } from '@/server/http/response';
import { readJson } from '@/server/http/request';
import { z } from 'zod';
import { AddressModel, toAddressDto } from '@/server/models/Address';
import { connectDB } from '@/server/db';

const addressSchema = z.object({
  label: z.string().trim().max(50).optional().default('Nhà riêng'),
  name: z.string().trim().min(1, 'Vui lòng nhập họ tên.'),
  phone: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập số điện thoại.')
    .regex(/^0[0-9]{9}$/, 'Số điện thoại không hợp lệ.'),
  address: z.string().trim().min(1, 'Vui lòng nhập địa chỉ.'),
  ward: z.string().trim().optional().default(''),
  city: z.string().trim().optional().default(''),
  district: z.string().trim().optional().default(''),
  province: z.string().trim().optional().default(''),
  isDefault: z.boolean().optional().default(false),
});

export const Route = createFileRoute('/api/addresses/')({
  server: {
    middleware: [corsMiddleware, requireAuth],
    handlers: {
      /** Danh sách địa chỉ của khách. */
      GET: withErrorHandling(async ({ context }) => {
        await connectDB();
        const list = await AddressModel.find({
          userId: context.auth.userId,
        })
          .sort({ isDefault: -1, createdAt: -1 })
          .lean();
        return ok(list.map(toAddressDto));
      }),

      /** Thêm địa chỉ mới. */
      POST: withErrorHandling(async ({ request, context }) => {
        await connectDB();
        const body = await readJson(request, addressSchema);

        const count = await AddressModel.countDocuments({
          userId: context.auth.userId,
        });

        // Địa chỉ đầu tiên luôn là mặc định.
        const isDefault = body.isDefault || count === 0;

        if (isDefault) {
          await AddressModel.updateMany(
            { userId: context.auth.userId },
            { $set: { isDefault: false } },
          );
        }

        const address = await AddressModel.create({
          userId: context.auth.userId,
          ...body,
          isDefault,
        });

        return ok(toAddressDto(address), undefined, 201);
      }),
    },
  },
});
