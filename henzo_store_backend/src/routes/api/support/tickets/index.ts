import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { requireAuth } from '@/server/middleware/auth';
import { withErrorHandling } from '@/server/http/handler';
import { ok } from '@/server/http/response';
import { readJson } from '@/server/http/request';
import { z } from 'zod';
import { TicketModel, toCustomerTicket } from '@/server/models/SupportTicket';
import { buildTicketCode } from '@/server/auth/tokens';
import {
  CustomerTicketStatus,
  MessageSender,
  TicketCategory,
  TicketPriority,
} from '@/server/constants';
import { connectDB } from '@/server/db';

const createSchema = z
  .object({
    subject: z.string().trim().min(1, 'Vui lòng nhập tiêu đề.').max(200),
        message: z.string().trim().min(1, 'Vui lòng nhập nội dung.').max(5000).optional(),
    content: z.string().trim().min(1, 'Vui lòng nhập nội dung.').max(5000).optional(),
    category: z
      .string()
      .refine((v) => Object.values(TicketCategory).includes(v as any), {
        message: 'Danh mục không hợp lệ',
      })
      .optional()
      .default(TicketCategory.OTHER),
    priority: z
      .string()
      .refine((v) => Object.values(TicketPriority).includes(v as any), {
        message: 'Mức độ ưu tiên không hợp lệ',
      })
      .optional()
      .default(TicketPriority.MEDIUM),
    orderId: z.string().optional(),
  })
  .refine((v) => !!(v.message ?? v.content), {
    message: 'Vui lòng nhập nội dung.',
    path: ['message'],
  });

export const Route = createFileRoute('/api/support/tickets/')({
  server: {
    middleware: [corsMiddleware, requireAuth],
    handlers: {
            GET: withErrorHandling(async ({ request, context }) => {
        await connectDB();
        const url = new URL(request.url);
        const sp = url.searchParams;

        const filter: Record<string, any> = {
          userId: context.auth.userId,
          scope: 'CUSTOMER',
        };
        if (sp.get('status')) filter.status = sp.get('status');

        const list = await TicketModel.find(filter)
          .sort({ createdAt: -1 })
          .limit(200)
          .lean();

        return ok(list.map(toCustomerTicket));
      }),

            POST: withErrorHandling(async ({ request, context }) => {
        await connectDB();
        const body = await readJson(request, createSchema);

        const count = await TicketModel.countDocuments();
        const ticketCode = buildTicketCode(count + 1);

        const ticket = await TicketModel.create({
          ticketCode,
          scope: 'CUSTOMER',
          userId: context.auth.userId,
          customerName: context.auth.name,
          customerEmail: context.auth.email,
          orderId: body.orderId || undefined,
          subject: body.subject,
          category: body.category as any,
          priority: body.priority as any,
          status: CustomerTicketStatus.OPEN,
          messages: [
            {
              sender: MessageSender.CUSTOMER,
              senderName: context.auth.name,
              content: body.message ?? body.content ?? '',
              attachments: [],
            },
          ],
        });

        return ok(toCustomerTicket(ticket), undefined, 201);
      }),
    },
  },
});
