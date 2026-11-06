import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { requireAuth } from '@/server/middleware/auth';
import { withErrorHandling } from '@/server/http/handler';
import { ok } from '@/server/http/response';
import { notFound } from '@/server/http/errors';
import { readJson } from '@/server/http/request';
import { z } from 'zod';
import { AddressModel, toAddressDto } from '@/server/models/Address';
import { connectDB } from '@/server/db';

const updateSchema = z.object({
  label: z.string().trim().max(50).optional(),
  name: z.string().trim().min(1).optional(),
  phone: z
    .string()
    .trim()
    .regex(/^0[0-9]{9}$/, 'Số điện thoại không hợp lệ.')
    .optional(),
  address: z.string().trim().min(1).optional(),
  ward: z.string().trim().optional(),
  city: z.string().trim().optional(),
  district: z.string().trim().optional(),
  province: z.string().trim().optional(),
  isDefault: z.boolean().optional(),
});

export const Route = createFileRoute('/api/addresses/$id')({
  server: {
    middleware: [corsMiddleware, requireAuth],
    handlers: {
      /** Cập nhật địa chỉ. */
      PATCH: withErrorHandling(async ({ request, params, context }) => {
        await connectDB();
        const body = await readJson(request, updateSchema);

        const address = await AddressModel.findOne({
          _id: params.id,
          userId: context.auth.userId,
        });
        if (!address) throw notFound('Không tìm thấy địa chỉ');

        // Đặt mặc định -> bỏ mặc định các địa chỉ khác.
        if (body.isDefault) {
          await AddressModel.updateMany(
            { userId: context.auth.userId, _id: { $ne: address._id } },
            { $set: { isDefault: false } },
          );
        }

        for (const [key, value] of Object.entries(body)) {
          if (value !== undefined) (address as any)[key] = value;
        }
        await address.save();

        return ok(toAddressDto(address));
      }),

      /** Xoá địa chỉ. */
      DELETE: withErrorHandling(async ({ params, context }) => {
        await connectDB();

        const address = await AddressModel.findOne({
          _id: params.id,
          userId: context.auth.userId,
        });
        if (!address) throw notFound('Không tìm thấy địa chỉ');

        const wasDefault = address.isDefault;
        await address.deleteOne();

        // Xoá địa chỉ mặc định -> chuyển mặc định cho địa chỉ còn lại đầu tiên.
        if (wasDefault) {
          const next = await AddressModel.findOne({
            userId: context.auth.userId,
          }).sort({ createdAt: 1 });
          if (next) {
            next.isDefault = true;
            await next.save();
          }
        }

        return ok({ id: params.id, deleted: true });
      }),
    },
  },
});
