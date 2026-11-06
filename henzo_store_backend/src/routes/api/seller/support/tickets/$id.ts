import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { requireAuth } from '@/server/middleware/auth';
import { requireStoreOwner } from '@/server/middleware/store';
import { withErrorHandling } from '@/server/http/handler';
import { ok } from '@/server/http/response';
import { readJson } from '@/server/http/request';
import { getStoreScope } from '@/server/http/store-scope';
import { z } from 'zod';
import { TicketModel, toSellerTicket } from '@/server/models/SupportTicket';
import { MessageSender, SellerTicketStatus } from '@/server/constants';
import { notFound, forbidden } from '@/server/http/errors';
import { connectDB } from '@/server/db';

const replySchema = z.object({
  content: z.string().trim().min(1, 'Vui lòng nhập nội dung.').max(5000),
  attachments: z.array(z.string()).max(10).optional().default([]),
});

const patchSchema = z
  .object({
    status: z.enum(Object.values(SellerTicketStatus)).optional(),
    content: z.string().trim().min(1).max(5000).optional(),
    attachments: z.array(z.string()).max(10).optional().default([]),
  })
  .refine((v) => v.status || v.content, {
    message: 'Cần có `status` hoặc `content`.',
  });

export const Route = createFileRoute('/api/seller/support/tickets/$id')({
  server: {
    middleware: [corsMiddleware, requireAuth, requireStoreOwner],
    handlers: {
      /** Chi tiết phiếu hỗ trợ. */
      GET: withErrorHandling(async ({ params, context }) => {
        await connectDB();
        const scope = getStoreScope(context);

        const ticket = await TicketModel.findById(params.id).lean();
        if (!ticket) throw notFound('Không tìm thấy phiếu hỗ trợ');

        if (ticket.storeId && String(ticket.storeId) !== String(scope.storeId)) {
          throw forbidden('Phiếu hỗ trợ không thuộc cửa hàng của bạn');
        }

        return ok(toSellerTicket(ticket));
      }),

      /** Trả lời phiếu hỗ trợ. */
      POST: withErrorHandling(async ({ request, params, context }) => {
        await connectDB();
        const scope = getStoreScope(context);
        const body = await readJson(request, replySchema);

        const ticket = await TicketModel.findById(params.id);
        if (!ticket) throw notFound('Không tìm thấy phiếu hỗ trợ');

        // Ticket có storeId = cửa hàng cụ thể, hoặc ticket chung do admin tạo.
        if (ticket.storeId && String(ticket.storeId) !== String(scope.storeId)) {
          throw forbidden('Phiếu hỗ trợ không thuộc cửa hàng của bạn');
        }

        ticket.messages.push({
          sender: MessageSender.SELLER,
          senderName: context.auth.name,
          content: body.content,
          attachments: body.attachments,
        } as any);

        ticket.status = SellerTicketStatus.REPLIED as any;
        await ticket.save();

        return ok(toSellerTicket(ticket));
      }),

      /**
       * Cập nhật trạng thái phiếu hỗ trợ.
       * Đồng thời hỗ trợ gửi nội dung trả lời (`content`) cho tiện.
       */
      PATCH: withErrorHandling(async ({ request, params, context }) => {
        await connectDB();
        const scope = getStoreScope(context);
        const body = await readJson(request, patchSchema);

        const ticket = await TicketModel.findById(params.id);
        if (!ticket) throw notFound('Không tìm thấy phiếu hỗ trợ');

        if (ticket.storeId && String(ticket.storeId) !== String(scope.storeId)) {
          throw forbidden('Phiếu hỗ trợ không thuộc cửa hàng của bạn');
        }

        if (body.content) {
          ticket.messages.push({
            sender: MessageSender.SELLER,
            senderName: context.auth.name,
            content: body.content,
            attachments: body.attachments ?? [],
          } as any);

          // Trả lời -> trạng thái chuyển sang `replied` (trừ khi người dùng
          // chỉ định trạng thái khác rõ ràng).
          if (!body.status) ticket.status = SellerTicketStatus.REPLIED as any;
        }

        if (body.status) ticket.status = body.status as any;

        await ticket.save();

        return ok(toSellerTicket(ticket));
      }),
    },
  },
});
