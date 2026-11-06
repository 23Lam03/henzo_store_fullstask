import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { requireAuth } from '@/server/middleware/auth';
import { withErrorHandling } from '@/server/http/handler';
import { ok } from '@/server/http/response';
import { notFound, forbidden } from '@/server/http/errors';
import { readJson } from '@/server/http/request';
import { z } from 'zod';
import { TicketModel, toCustomerTicket } from '@/server/models/SupportTicket';
import { CustomerTicketStatus, MessageSender } from '@/server/constants';
import { connectDB } from '@/server/db';

const replySchema = z.object({
  content: z.string().trim().min(1, 'Vui lòng nhập nội dung.').max(5000),
  attachments: z.array(z.string()).max(10).optional().default([]),
});

export const Route = createFileRoute('/api/support/tickets/$id')({
  server: {
    middleware: [corsMiddleware, requireAuth],
    handlers: {
      /** Chi tiết phiếu hỗ trợ. */
      GET: withErrorHandling(async ({ params, context }) => {
        await connectDB();

        const ticket = await TicketModel.findById(params.id).lean();
        if (!ticket) throw notFound('Không tìm thấy phiếu hỗ trợ');

        const isOwner = String(ticket.userId) === context.auth.userId;
        const isStaff = context.auth.role === 'ADMIN';
        if (!isOwner && !isStaff) {
          throw forbidden('Không có quyền xem phiếu hỗ trợ này');
        }

        return ok(toCustomerTicket(ticket));
      }),

      /** Khách phản hồi trong phiếu hỗ trợ. */
      POST: withErrorHandling(async ({ request, params, context }) => {
        await connectDB();
        const body = await readJson(request, replySchema);

        const ticket = await TicketModel.findById(params.id);
        if (!ticket) throw notFound('Không tìm thấy phiếu hỗ trợ');

        const isOwner = String(ticket.userId) === context.auth.userId;
        const isStaff = context.auth.role === 'ADMIN';
        if (!isOwner && !isStaff) {
          throw forbidden('Không có quyền phản hồi phiếu hỗ trợ này');
        }

        // Phiếu đã đóng thì không nhận thêm phản hồi.
        if (
          ticket.status === CustomerTicketStatus.CLOSED &&
          !isStaff
        ) {
          throw forbidden('Phiếu hỗ trợ đã đóng');
        }

        ticket.messages.push({
          sender: isStaff ? MessageSender.ADMIN : MessageSender.CUSTOMER,
          senderName: context.auth.name,
          content: body.content,
          attachments: body.attachments,
        } as any);

        // Khách phản hồi -> ticket quay lại trạng thái đang xử lý.
        if (!isStaff) {
          ticket.status = CustomerTicketStatus.OPEN;
        }

        await ticket.save();

        return ok(toCustomerTicket(ticket));
      }),
    },
  },
});
