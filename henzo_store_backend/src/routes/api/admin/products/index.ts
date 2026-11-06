import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { requireAuth } from '@/server/middleware/auth';
import { requireAdmin, requirePermission } from '@/server/middleware/admin';
import { withErrorHandling } from '@/server/http/handler';
import { ok } from '@/server/http/response';
import { readJson, readPagination, buildMeta } from '@/server/http/request';
import { z } from 'zod';
import { ProductModel, toProductDto, computeDiscount } from '@/server/models/Product';
import { StoreModel } from '@/server/models/Store';
import { ProductStatus } from '@/server/constants';
import { notFound, badRequest } from '@/server/http/errors';
import { connectDB } from '@/server/db';

const updateSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(5000).optional(),
  shortDescription: z.string().trim().max(500).optional(),
  price: z.coerce.number().min(0).optional(),
  originalPrice: z.coerce.number().min(0).optional(),
  stock: z.coerce.number().int().min(0).optional(),
  minStock: z.coerce.number().int().min(0).optional(),
  status: z.enum(Object.values(ProductStatus)).optional(),
  isFeatured: z.boolean().optional(),
  isHot: z.boolean().optional(),
  isNew: z.boolean().optional(),
  categoryId: z.string().optional(),
  categoryName: z.string().trim().max(150).optional(),
  brand: z.string().trim().max(150).optional(),
  images: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  sku: z.string().trim().max(120).optional(),
  specifications: z.record(z.string(), z.string()).optional(),
});

export const Route = createFileRoute('/api/admin/products/')({
  server: {
    middleware: [corsMiddleware, requireAuth, requireAdmin, requirePermission('Quản lý sản phẩm')],
    handlers: {
            GET: withErrorHandling(async ({ request }) => {
        await connectDB();
        const url = new URL(request.url);
        const sp = url.searchParams;
        const { page, pageSize } = readPagination(sp);

        const filter: Record<string, any> = {};

        const status = sp.get('status');
        if (status && status !== 'all') filter.status = status;

        const stock = sp.get('stock');
        if (stock === 'instock') filter.stock = { $gt: 0 };
        if (stock === 'outofstock') filter.stock = 0;
        if (stock === 'low') filter.stock = { $gt: 0, $lte: 10 };

        if (sp.get('storeId')) filter.storeId = sp.get('storeId');
        if (sp.get('categoryId')) filter.categoryId = sp.get('categoryId');

        if (sp.get('isHot') === '1') filter.isHot = true;
        if (sp.get('isNew') === '1') filter.isNew = true;
        if (sp.get('isFeatured') === '1') filter.isFeatured = true;

        const search = (sp.get('search') ?? '').trim();
        if (search) {
          const rx = new RegExp(escapeRegex(search), 'i');
          filter.$or = [{ name: rx }, { brand: rx }, { categoryName: rx }];
        }

        const [docs, total, stores] = await Promise.all([
          ProductModel.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .lean(),
          ProductModel.countDocuments(filter),
          StoreModel.find({}).select('name').lean(),
        ]);

        const storeMap = new Map(
          stores.map((s: any) => [String(s._id), s.name]),
        );

        return ok(
          {
            products: docs.map((p: any) => ({
              ...toProductDto(p),
              storeName: storeMap.get(String(p.storeId)) ?? '',
            })),
          },
          buildMeta(page, pageSize, total),
        );
      }),

            PATCH: withErrorHandling(async ({ request }) => {
        await connectDB();
        const body = await readJson(request, updateSchema);

        const id = new URL(request.url).searchParams.get('id');
        if (!id) throw badRequest('Thiếu mã sản phẩm.');

        const product = await ProductModel.findById(id);
        if (!product) throw notFound('Không tìm thấy sản phẩm');

        if (body.name !== undefined) product.name = body.name;
        if (body.description !== undefined) product.description = body.description;
        if (body.shortDescription !== undefined) {
          product.shortDescription = body.shortDescription;
        }
        if (body.price !== undefined) product.price = body.price;
        if (body.originalPrice !== undefined) {
          product.originalPrice = body.originalPrice;
        }
        if (body.stock !== undefined) product.stock = body.stock;
        if (body.minStock !== undefined) product.minStock = body.minStock;
        if (body.status !== undefined) product.status = body.status;
        if (body.isFeatured !== undefined) product.isFeatured = body.isFeatured;
        if (body.isHot !== undefined) product.isHot = body.isHot;
        if (body.isNew !== undefined) product.isNew = body.isNew;
        if (body.categoryId !== undefined) {
          product.set('categoryId', body.categoryId);
        }
        if (body.categoryName !== undefined) {
          product.categoryName = body.categoryName;
        }
        if (body.brand !== undefined) product.brand = body.brand;
        if (body.images !== undefined) product.images = body.images;
        if (body.tags !== undefined) product.tags = body.tags;
        if (body.sku !== undefined) product.sku = body.sku;
        if (body.specifications !== undefined) {
          product.set('specifications', body.specifications);
        }

        if (body.price !== undefined || body.originalPrice !== undefined) {
          if (!product.originalPrice || product.originalPrice < product.price) {
            product.originalPrice = product.price;
          }
          product.discount = computeDiscount(product.price, product.originalPrice);
        }

        await product.save();
        return ok(toProductDto(product));
      }),

            DELETE: withErrorHandling(async ({ request }) => {
        await connectDB();
        const id = new URL(request.url).searchParams.get('id');
        if (!id) throw badRequest('Thiếu mã sản phẩm.');

        const product = await ProductModel.findById(id);
        if (!product) throw notFound('Không tìm thấy sản phẩm');

        await ProductModel.deleteOne({ _id: product._id });
        return ok({ id: String(product._id), deleted: true });
      }),
    },
  },
});

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
