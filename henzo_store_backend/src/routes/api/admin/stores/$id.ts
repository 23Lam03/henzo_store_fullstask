import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { requireAuth } from '@/server/middleware/auth';
import { requireAdmin, requirePermission } from '@/server/middleware/admin';
import { withErrorHandling } from '@/server/http/handler';
import { ok } from '@/server/http/response';
import { readJson } from '@/server/http/request';
import { z } from 'zod';
import { StoreModel, toAdminStore } from '@/server/models/Store';
import { ProductModel } from '@/server/models/Product';
import { OrderModel } from '@/server/models/Order';
import { StoreStatus } from '@/server/constants';
import { notFound } from '@/server/http/errors';
import { connectDB } from '@/server/db';

const updateSchema = z.object({
  name: z.string().trim().min(1).max(150).optional(),
  email: z.string().trim().email('Email không hợp lệ.').optional(),
  phone: z.string().trim().max(30).optional(),
  address: z.string().trim().max(500).optional(),
  avatar: z.string().trim().max(1000).optional(),
  banner: z.string().trim().max(1000).optional(),
  description: z.string().trim().max(2000).optional(),
  isVerified: z.boolean().optional(),
  status: z.enum(Object.values(StoreStatus)).optional(),
  taxId: z.string().trim().max(50).optional(),
  bankAccount: z.string().trim().max(50).optional(),
  bankName: z.string().trim().max(100).optional(),
});

const actionSchema = z.object({
  action: z.enum(['verify', 'unverify', 'lock', 'unlock', 'suspend']),
});

export const Route = createFileRoute('/api/admin/stores/$id')({
  server: {
    middleware: [corsMiddleware, requireAuth, requireAdmin, requirePermission('Quản lý cửa hàng')],
    handlers: {
            GET: withErrorHandling(async ({ params }) => {
        await connectDB();

        const store = await StoreModel.findById(params.id).lean();
        if (!store) throw notFound('Không tìm thấy cửa hàng');

        const [productCount, orderCount, revenue] = await Promise.all([
          ProductModel.countDocuments({ storeId: store._id }),
          OrderModel.countDocuments({ 'subOrders.storeId': store._id }),
          OrderModel.aggregate([
            { $match: { 'subOrders.storeId': store._id } },
            { $unwind: '$subOrders' },
            {
              $group: {
                _id: null,
                total: { $sum: '$subOrders.totalPrice' },
              },
            },
          ]),
        ]);

        return ok({
          store: toAdminStore(store),
          stats: {
            productCount,
            orderCount,
            revenue: revenue[0]?.total ?? 0,
          },
        });
      }),

            PATCH: withErrorHandling(async ({ request, params }) => {
        await connectDB();
        const body = await readJson(request, updateSchema);

        const store = await StoreModel.findById(params.id);
        if (!store) throw notFound('Không tìm thấy cửa hàng');

        if (body.name !== undefined) store.name = body.name;
        if (body.email !== undefined) store.email = body.email.toLowerCase();
        if (body.phone !== undefined) store.phone = body.phone;
        if (body.address !== undefined) store.address = body.address;
        if (body.avatar !== undefined) store.avatar = body.avatar;
        if (body.banner !== undefined) store.banner = body.banner;
        if (body.description !== undefined) store.description = body.description;
        if (body.isVerified !== undefined) store.isVerified = body.isVerified;
        if (body.status !== undefined) store.status = body.status;
        if (body.taxId !== undefined) store.taxId = body.taxId;
        if (body.bankAccount !== undefined) store.bankAccount = body.bankAccount;
        if (body.bankName !== undefined) store.bankName = body.bankName;

        await store.save();
        return ok(toAdminStore(store));
      }),

            POST: withErrorHandling(async ({ request, params }) => {
        await connectDB();
        const body = await readJson(request, actionSchema);

        const store = await StoreModel.findById(params.id);
        if (!store) throw notFound('Không tìm thấy cửa hàng');

        switch (body.action) {
          case 'verify':
            store.isVerified = true;
            break;
          case 'unverify':
            store.isVerified = false;
            break;
          case 'lock':
          case 'suspend':
            store.status = StoreStatus.SUSPENDED;
            break;
          case 'unlock':
            store.status = StoreStatus.ACTIVE;
            break;
        }

        await store.save();
        return ok(toAdminStore(store));
      }),

            DELETE: withErrorHandling(async ({ params }) => {
        await connectDB();

        const store = await StoreModel.findById(params.id);
        if (!store) throw notFound('Không tìm thấy cửa hàng');

        const storeId = store._id;

        await ProductModel.updateMany(
          { storeId },
          { $set: { status: 'hidden' } },
        );

        await StoreModel.deleteOne({ _id: storeId });

        return ok({ id: String(storeId), deleted: true });
      }),
    },
  },
});
