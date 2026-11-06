import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { requireAuth } from '@/server/middleware/auth';
import { requireStoreOwner } from '@/server/middleware/store';
import { withErrorHandling } from '@/server/http/handler';
import { ok } from '@/server/http/response';
import { readJson } from '@/server/http/request';
import { getStoreScope } from '@/server/http/store-scope';
import { z } from 'zod';
import { InventoryModel, toInventoryDto, recalcInventory } from '@/server/models/Inventory';
import { ProductModel } from '@/server/models/Product';
import { notFound, badRequest } from '@/server/http/errors';
import { connectDB } from '@/server/db';

const stockSchema = z.object({
  stock: z.coerce.number().int().min(0, 'Số lượng không hợp lệ.'),
  minStock: z.coerce.number().int().min(0).optional(),
});

export const Route = createFileRoute('/api/seller/inventory/$sku')({
  server: {
    middleware: [corsMiddleware, requireAuth, requireStoreOwner],
    handlers: {
            GET: withErrorHandling(async ({ params, context }) => {
        await connectDB();
        const scope = getStoreScope(context);

        const item = await InventoryModel.findOne({
          ...scope.filter(),
          sku: params.sku,
        }).lean();

        if (!item) throw notFound('Không tìm thấy mã sản phẩm trong kho');

        return ok(toInventoryDto(item));
      }),

            PATCH: withErrorHandling(async ({ request, params, context }) => {
        await connectDB();

        const storeId = getStoreScope(context).require();
        const body = await readJson(request, stockSchema);

        const item = await InventoryModel.findOne({
          storeId,
          sku: params.sku,
        });
        if (!item) throw notFound('Không tìm thấy mã sản phẩm trong kho');

        if (body.stock < (item.reserved ?? 0)) {
          throw badRequest(
            `Số lượng không thể nhỏ hơn số lượng đang đặt trước (${item.reserved})`,
          );
        }

        item.stock = body.stock;
        if (body.minStock !== undefined) item.minStock = body.minStock;

        const { status, available } = recalcInventory(
          item.stock,
          item.minStock,
          item.reserved ?? 0,
        );
        item.status = status as any;
        item.available = available;
        item.lastRestocked = new Date();
        await item.save();

        await ProductModel.updateOne(
          { _id: item.productId, storeId },
          { $set: { stock: item.stock, minStock: item.minStock } },
        );

        return ok(toInventoryDto(item));
      }),
    },
  },
});
