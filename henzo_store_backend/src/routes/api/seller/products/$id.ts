import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { requireAuth } from '@/server/middleware/auth';
import { requireStoreOwner } from '@/server/middleware/store';
import { withErrorHandling } from '@/server/http/handler';
import { ok } from '@/server/http/response';
import { readJson } from '@/server/http/request';
import { getStoreScope } from '@/server/http/store-scope';
import { z } from 'zod';
import {
  ProductModel,
  toProductDto,
  computeDiscount,
} from '@/server/models/Product';
import { InventoryModel, recalcInventory } from '@/server/models/Inventory';
import { ProductStatus } from '@/server/constants';
import { notFound, forbidden } from '@/server/http/errors';
import { connectDB } from '@/server/db';

const updateSchema = z.object({
  name: z.string().trim().min(1).max(300).optional(),
  description: z.string().trim().max(10000).optional(),
  shortDescription: z.string().trim().max(500).optional(),
  price: z.coerce.number().min(0).optional(),
  originalPrice: z.coerce.number().min(0).optional(),
  images: z.array(z.string()).max(10).optional(),
  categoryId: z.string().optional(),
  categoryName: z.string().trim().optional(),
  brand: z.string().trim().optional(),
  stock: z.coerce.number().int().min(0).optional(),
  minStock: z.coerce.number().int().min(0).optional(),
  sku: z.string().trim().optional(),
  tags: z.array(z.string()).max(20).optional(),
  specifications: z.record(z.string(), z.string()).optional(),
  isFeatured: z.boolean().optional(),
  isNew: z.boolean().optional(),
  isHot: z.boolean().optional(),
  status: z.enum(Object.values(ProductStatus)).optional(),
});

export const Route = createFileRoute('/api/seller/products/$id')({
  server: {
    middleware: [corsMiddleware, requireAuth, requireStoreOwner],
    handlers: {
      /** Chi tiết sản phẩm của cửa hàng. */
      GET: withErrorHandling(async ({ params, context }) => {
        await connectDB();
        const storeId = getStoreScope(context).require();

        const product = await ProductModel.findById(params.id).lean();
        if (!product) throw notFound('Không tìm thấy sản phẩm');
        if (String(product.storeId) !== String(storeId)) {
          throw forbidden('Sản phẩm không thuộc cửa hàng của bạn');
        }

        return ok(toProductDto(product));
      }),

      /** Cập nhật sản phẩm. */
      PATCH: withErrorHandling(async ({ request, params, context }) => {
        await connectDB();
        const storeId = getStoreScope(context).require();
        const body = await readJson(request, updateSchema);

        const product = await ProductModel.findById(params.id);
        if (!product) throw notFound('Không tìm thấy sản phẩm');
        if (String(product.storeId) !== String(storeId)) {
          throw forbidden('Sản phẩm không thuộc cửa hàng của bạn');
        }

        for (const [key, value] of Object.entries(body)) {
          if (value !== undefined) (product as any)[key] = value;
        }

        // Tính lại % giảm giá nếu giá thay đổi.
        if (body.price !== undefined || body.originalPrice !== undefined) {
          product.originalPrice =
            body.originalPrice ?? product.originalPrice ?? product.price;
          if (product.originalPrice < product.price) {
            product.originalPrice = product.price;
          }
          product.discount = computeDiscount(
            product.price,
            product.originalPrice,
          );
        }

        await product.save();

        // Đồng bộ tồn kho nếu số lượng thay đổi.
        if (body.stock !== undefined || body.minStock !== undefined) {
          const sku = product.sku || `SKU-${String(product._id).slice(-8).toUpperCase()}`;
          const { status, available } = recalcInventory(
            product.stock ?? 0,
            product.minStock ?? 10,
            product.reserved ?? 0,
          );

          await InventoryModel.findOneAndUpdate(
            { storeId, sku },
            {
              $set: {
                storeId,
                productId: product._id,
                productName: product.name,
                productImage: product.images?.[0] ?? '',
                category: product.categoryName ?? '',
                sku,
                stock: product.stock ?? 0,
                minStock: product.minStock ?? 10,
                reserved: product.reserved ?? 0,
                available,
                status,
                lastRestocked: new Date(),
              },
            },
            { upsert: true, new: true },
          );
        }

        return ok(toProductDto(product));
      }),

      /** Xoá sản phẩm (soft delete -> chuyển sang hidden). */
      DELETE: withErrorHandling(async ({ params, context }) => {
        await connectDB();
        const storeId = getStoreScope(context).require();

        const product = await ProductModel.findById(params.id);
        if (!product) throw notFound('Không tìm thấy sản phẩm');
        if (String(product.storeId) !== String(storeId)) {
          throw forbidden('Sản phẩm không thuộc cửa hàng của bạn');
        }

        product.status = ProductStatus.HIDDEN;
        await product.save();

        return ok({ id: params.id, status: ProductStatus.HIDDEN });
      }),
    },
  },
});
