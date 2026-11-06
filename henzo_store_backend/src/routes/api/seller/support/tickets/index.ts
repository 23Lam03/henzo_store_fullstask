import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { requireAuth } from '@/server/middleware/auth';
import { requireStoreOwner } from '@/server/middleware/store';
import { withErrorHandling } from '@/server/http/handler';
import { ok } from '@/server/http/response';
import { readJson } from '@/server/http/request';
import { readPagination } from '@/server/http/request';
import { getStoreScope } from '@/server/http/store-scope';
import { z } from 'zod';
import { TicketModel, toSellerTicket } from '@/server/models/SupportTicket';
import {
  MessageSender,
  SellerTicketStatus,
} from '@/server/constants';
import { notFound, forbidden } from '@/server/http/errors';
import { connectDB } from '@/server/db';

const replySchema = z.object({
  content: z.string().trim().min(1, 'Vui lòng nhập nội dung.').max(5000),
  attachments: z.array(z.string()).max(10).optional().default([]),
});

export const Route = createFileRoute('/api/seller/support/tickets/')({
  server: {
    middleware: [corsMiddleware, requireAuth, requireStoreOwner],
    handlers: {
            GET: withErrorHandling(async ({ request, context }) => {
        await connectDB();
        const scope = getStoreScope(context);

        const url = new URL(request.url);
        const sp = url.searchParams;
        const { page, pageSize } = readPagination(sp);

        const filter: Record<string, any> = scope.storeOnlyFilter();
        if (sp.get('status')) filter.status = sp.get('status');
        if (sp.get('category')) filter.category = sp.get('category');

        const [docs, total] = await Promise.all([
          TicketModel.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .lean(),
          TicketModel.countDocuments(filter),
        ]);

        return ok(
          docs.map(toSellerTicket),
          {
            page,
            pageSize,
            total,
            totalPages: Math.max(1, Math.ceil(total / pageSize)),
          },
        );
      }),
    },
  },
});
