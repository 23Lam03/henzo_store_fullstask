import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { requireAuth } from '@/server/middleware/auth';
import { requireAdmin } from '@/server/middleware/admin';
import { withErrorHandling } from '@/server/http/handler';
import { ok } from '@/server/http/response';
import { readJson } from '@/server/http/request';
import { z } from 'zod';
import { TicketModel, toAdminTicket } from '@/server/models/SupportTicket';
import { NotificationModel } from '@/server/models/Notification';
import {
  AdminTicketStatus,
  MessageSender,
  TicketPriority,
} from '@/server/constants';
import { notFound } from '@/server/http/errors';
import { connectDB } from '@/server/db';

const updateSchema = z.object({
  status: z.enum(Object.values(AdminTicketStatus)).optional(),
  priority: z.enum(Object.values(TicketPriority)).optional(),
  assignee: z.string().trim().max(120).optional(),
  note: z.string().trim().max(500).optional(),
});

const replySchema = z.object({
  message: z.string().trim().min(1, 'Vui lòng nhập nội dung.').max(3000),
});

export const Route = createFileRoute('/api/admin/support/tickets/$id')({
  server: {
    middleware: [corsMiddleware, requireAuth, requireAdmin],
    handlers: {
            GET: withErrorHandling(async ({ params }) => {
        await connectDB();
        const ticket = await TicketModel.findById(params.id).lean();
        if (!ticket) throw notFound('Không tìm thấy phiếu hỗ trợ');
        return ok(toAdminTicket(ticket));
      }),

            PATCH: withErrorHandling(async ({ request, params }) => {
        await connectDB();
        const body = await readJson(request, updateSchema);

        const ticket = await TicketModel.findById(params.id);
        if (!ticket) throw notFound('Không tìm thấy phiếu hỗ trợ');

        if (body.status !== undefined) ticket.status = body.status;
        if (body.priority !== undefined) ticket.priority = body.priority;
        if (body.assignee !== undefined) ticket.assignee = body.assignee;

        await ticket.save();
        return ok(toAdminTicket(ticket));
      }),

            POST: withErrorHandling(async ({ request, params, context }) => {
        await connectDB();
        const body = await readJson(request, replySchema);

        const ticket = await TicketModel.findById(params.id);
        if (!ticket) throw notFound('Không tìm thấy phiếu hỗ trợ');

        const auth = context.auth as { name?: string };

        ticket.messages.push({
          sender: MessageSender.ADMIN,
          senderName: auth?.name ?? 'Admin',
          content: body.message,
          attachments: [],
          createdAt: new Date(),
        } as any);

        if (ticket.status === AdminTicketStatus.OPEN) {
          ticket.status = AdminTicketStatus.PENDING;
        }

        await ticket.save();

        if (ticket.userId) {
          await NotificationModel.create({
            userId: ticket.userId,
            type: 'system',
            title: `Phản hồi hỗ trợ: ${ticket.subject}`,
            message: body.message,
            link: `/support/tickets/${ticket._id}`,
            isSystem: true,
          });
        }

        return ok(toAdminTicket(ticket));
      }),

            DELETE: withErrorHandling(async ({ params }) => {
        await connectDB();
        const ticket = await TicketModel.findById(params.id);
        if (!ticket) throw notFound('Không tìm thấy phiếu hỗ trợ');

        ticket.status = AdminTicketStatus.CLOSED;
        await ticket.save();

        return ok(toAdminTicket(ticket));
      }),
    },
  },
});
