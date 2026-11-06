import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { requireAuth } from '@/server/middleware/auth';
import { requireStoreOwner } from '@/server/middleware/store';
import { withErrorHandling } from '@/server/http/handler';
import { ok } from '@/server/http/response';
import { readJson } from '@/server/http/request';
import { readPagination, toBool, toInt, splitCsv } from '@/server/http/request';
import { getStoreScope } from '@/server/http/store-scope';
import { z } from 'zod';
import {
  ProductModel,
  toProductDto,
  computeDiscount,
} from '@/server/models/Product';
import { CategoryModel } from '@/server/models/Category';
import { InventoryModel, recalcInventory } from '@/server/models/Inventory';
import { ProductStatus } from '@/server/constants';
import { badRequest, notFound } from '@/server/http/errors';
import { connectDB } from '@/server/db';

const productSchema = z.object({
  name: z.string().trim().min(1, 'Vui lòng nhập tên sản phẩm.').max(300),
  slug: z.string().trim().max(200).optional(),
  description: z.string().trim().max(10000).optional().default(''),
  shortDescription: z.string().trim().max(500).optional().default(''),
  price: z.coerce.number().min(0, 'Giá không hợp lệ.'),
  originalPrice: z.coerce.number().min(0).optional(),
  images: z.array(z.string()).max(10).optional().default([]),
  categoryId: z.string().optional(),
  categoryName: z.string().trim().optional().default(''),
  brand: z.string().trim().optional().default(''),
  stock: z.coerce.number().int().min(0).optional().default(0),
  minStock: z.coerce.number().int().min(0).optional().default(10),
  sku: z.string().trim().optional().default(''),
  tags: z.array(z.string()).max(20).optional().default([]),
  specifications: z.record(z.string(), z.string()).optional().default({}),
  isFeatured: z.boolean().optional().default(false),
  isNew: z.boolean().optional().default(false),
  isHot: z.boolean().optional().default(false),
  status: z.enum(Object.values(ProductStatus)).optional().default(ProductStatus.ACTIVE),
});

export const Route = createFileRoute('/api/seller/products/')({
  server: {
    middleware: [corsMiddleware, requireAuth, requireStoreOwner],
    handlers: {
            GET: withErrorHandling(async ({ request, context }) => {
        await connectDB();
        const scope = getStoreScope(context);

        const url = new URL(request.url);
        const sp = url.searchParams;
        const { page, pageSize } = readPagination(sp);

        const filter: Record<string, any> = scope.filter();

        if (sp.get('status')) filter.status = sp.get('status');
        if (sp.get('category')) filter.categoryId = sp.get('category');
        if (sp.get('brand')) filter.brand = sp.get('brand');

        const search = sp.get('q')?.trim();
        if (search) {
          const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
          filter.$or = [{ name: rx }, { sku: rx }, { brand: rx }];
        }

        if (toBool(sp.get('inStock'))) filter.stock = { $gt: 0 };
        if (toBool(sp.get('lowStock'))) filter.stock = { $gt: 0, $lte: 10 };

        const sortMap: Record<string, Record<string, 1 | -1>> = {
          newest: { createdAt: -1 },
          oldest: { createdAt: 1 },
          priceAsc: { price: 1 },
          priceDesc: { price: -1 },
          sold: { sold: -1 },
          name: { name: 1 },
        };
        const sort = sortMap[sp.get('sort') ?? 'newest'] ?? { createdAt: -1 };

        const [docs, total] = await Promise.all([
          ProductModel.find(filter)
            .sort(sort)
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .lean(),
          ProductModel.countDocuments(filter),
        ]);

        return ok(
          docs.map(toProductDto),
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

        const storeId = getStoreScope(context).require();
        const body = await readJson(request, productSchema);

        const slug = await uniqueProductSlug(body.slug || body.name);

        let categoryName = body.categoryName;
        if (body.categoryId) {
          const category = await CategoryModel.findById(body.categoryId)
            .select('name')
            .lean();
          if (category) categoryName = category.name;
        }

        const originalPrice =
          body.originalPrice && body.originalPrice > body.price
            ? body.originalPrice
            : body.price;

        const product = await ProductModel.create({
          ...body,
          slug,
          storeId,
          originalPrice,
          discount: computeDiscount(body.price, originalPrice),
          categoryName,
          reserved: 0,
          sold: 0,
          viewCount: 0,
        });

        await syncInventory(product, storeId);

        return ok(toProductDto(product), undefined, 201);
      }),
    },
  },
});

async function uniqueProductSlug(input: string): Promise<string> {
  const base =
    input
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'san-pham';

  let slug = base;
  let i = 1;
  while (await ProductModel.exists({ slug })) {
    slug = `${base}-${i}`;
    i += 1;
  }
  return slug;
}

async function syncInventory(product: any, storeId: string) {
  const sku = product.sku || `SKU-${String(product._id).slice(-8).toUpperCase()}`;

  if (!product.sku) {
    product.sku = sku;
    await product.save();
  }

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
