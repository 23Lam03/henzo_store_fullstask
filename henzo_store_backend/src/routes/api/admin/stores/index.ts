import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { requireAuth } from '@/server/middleware/auth';
import { requireAdmin, requirePermission } from '@/server/middleware/admin';
import { withErrorHandling } from '@/server/http/handler';
import { ok } from '@/server/http/response';
import { readJson, readPagination, buildMeta } from '@/server/http/request';
import { z } from 'zod';
import { StoreModel, toAdminStore } from '@/server/models/Store';
import { StoreStatus } from '@/server/constants';
import { badRequest, conflict } from '@/server/http/errors';
import { connectDB } from '@/server/db';

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const storeSchema = z.object({
  name: z.string().trim().min(1, 'Vui lòng nhập tên cửa hàng.').max(150),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(150)
    .regex(/^[a-z0-9-]+$/, 'Slug chỉ gồm chữ thường, số và dấu "-".')
    .optional(),
  email: z.string().trim().email('Email không hợp lệ.'),
  phone: z.string().trim().max(30).optional().default(''),
  address: z.string().trim().max(500).optional().default(''),
  avatar: z.string().trim().max(1000).optional().default(''),
  banner: z.string().trim().max(1000).optional().default(''),
  description: z.string().trim().max(2000).optional().default(''),
  isVerified: z.boolean().optional().default(false),
  status: z.enum(Object.values(StoreStatus)).optional().default(StoreStatus.ACTIVE),
  taxId: z.string().trim().max(50).optional().default(''),
  bankAccount: z.string().trim().max(50).optional().default(''),
  bankName: z.string().trim().max(100).optional().default(''),
});

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 140);
}

export const Route = createFileRoute('/api/admin/stores/')({
  server: {
    middleware: [corsMiddleware, requireAuth, requireAdmin],
    handlers: {
            GET: withErrorHandling(async ({ request }) => {
        await connectDB();
        const url = new URL(request.url);
        const sp = url.searchParams;
        const { page, pageSize } = readPagination(sp);

        const filter: Record<string, any> = {};

        const status = sp.get('status');
        if (status && status !== 'all') filter.status = status;

        const verified = sp.get('verified');
        if (verified === 'verified') filter.isVerified = true;
        if (verified === 'unverified') filter.isVerified = false;

        const search = (sp.get('search') ?? '').trim();
        if (search) {
          const rx = new RegExp(escapeRegex(search), 'i');
          filter.$or = [
            { name: rx },
            { email: rx },
            { phone: rx },
            { address: rx },
          ];
        }

        const [docs, total, verifiedCount, unverifiedCount] = await Promise.all([
          StoreModel.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .lean(),
          StoreModel.countDocuments(filter),
          StoreModel.countDocuments({ isVerified: true }),
          StoreModel.countDocuments({ isVerified: false }),
        ]);

        return ok(
          {
            stores: docs.map(toAdminStore),
            counts: { verified: verifiedCount, unverified: unverifiedCount },
          },
          buildMeta(page, pageSize, total),
        );
      }),

            POST: withErrorHandling(async ({ request }) => {
        await connectDB();
        const body = await readJson(request, storeSchema);

        const slug = body.slug || slugify(body.name);
        if (!slug) throw badRequest('Không tạo được slug cho cửa hàng.');

        const exists = await StoreModel.findOne({ slug });
        if (exists) throw conflict('Slug cửa hàng đã tồn tại.');

        const store = await StoreModel.create({
          name: body.name,
          slug,
          email: body.email.toLowerCase(),
          phone: body.phone,
          address: body.address,
          avatar: body.avatar,
          banner: body.banner,
          description: body.description,
          isVerified: body.isVerified,
          status: body.status,
          taxId: body.taxId,
          bankAccount: body.bankAccount,
          bankName: body.bankName,
        });

        return ok(toAdminStore(store), undefined, 201);
      }),
    },
  },
});
