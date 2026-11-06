/**
 * Model SupportTicket — phiếu hỗ trợ.
 * Dùng chung cho khách hàng, seller và admin; phân biệt bằng `scope`.
 */
import { Schema, type InferSchemaType } from 'mongoose';
import { defineModel } from './registry';
import {
  AdminTicketStatus,
  CustomerTicketStatus,
  MessageSender,
  SellerTicketStatus,
  TicketCategory,
  TicketPriority,
} from '../constants';

const messageSchema = new Schema(
  {
    sender: {
      type: String,
      enum: Object.values(MessageSender),
      default: MessageSender.CUSTOMER,
    },
    senderName: { type: String, default: '' },
    content: { type: String, required: true },
    attachments: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const ticketSchema = new Schema(
  {
    ticketCode: { type: String, required: true, unique: true, index: true },

    /** CUSTOMER | SELLER | ADMIN */
    scope: { type: String, default: 'CUSTOMER', index: true },

    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    customerName: { type: String, default: '' },
    customerEmail: { type: String, default: '' },
    customerAvatar: { type: String, default: '' },
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', index: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', index: true },

    subject: { type: String, required: true },
    category: {
      type: String,
      enum: Object.values(TicketCategory),
      default: TicketCategory.OTHER,
      index: true,
    },
    priority: {
      type: String,
      enum: Object.values(TicketPriority),
      default: TicketPriority.MEDIUM,
      index: true,
    },
    status: {
      type: String,
      enum: [
        ...Object.values(CustomerTicketStatus),
        ...Object.values(SellerTicketStatus),
        ...Object.values(AdminTicketStatus),
      ],
      default: CustomerTicketStatus.OPEN,
      index: true,
    },

    messages: { type: [messageSchema], default: [] },
    /** Người được admin giao xử lý. */
    assignee: { type: String, default: '' },
  },
  { timestamps: true },
);

ticketSchema.index({ scope: 1, status: 1, createdAt: -1 });
ticketSchema.index({ storeId: 1, createdAt: -1 });

export type TicketDoc = InferSchemaType<typeof ticketSchema>;

export const TicketModel = defineModel('SupportTicket', ticketSchema);

export function toCustomerTicket(ticket: any) {
  if (!ticket) return null;
  const obj = ticket.toObject ? ticket.toObject() : { ...ticket };
  delete obj.__v;
  return {
    id: String(obj._id),
    ticketCode: obj.ticketCode,
    subject: obj.subject,
    /** Nội dung phiếu — frontend `SupportTicket.message` đọc field này. */
    message: obj.messages?.[0]?.content ?? '',
    category: obj.category,
    priority: obj.priority,
    status: obj.status,
    messages: (obj.messages ?? []).map((m: any) => ({
      id: String(m._id),
      sender: m.sender,
      senderName: m.senderName ?? '',
      content: m.content,
      attachments: m.attachments ?? [],
      createdAt: m.createdAt,
    })),
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
}

/** DTO phía seller — shape `SellerSupportTicket`. */
export function toSellerTicket(ticket: any) {
  if (!ticket) return null;
  const obj = ticket.toObject ? ticket.toObject() : { ...ticket };
  delete obj.__v;
  return {
    id: String(obj._id),
    ticketCode: obj.ticketCode,
    subject: obj.subject,
    category: obj.category,
    priority: obj.priority,
    status: obj.status,
    customerName: obj.customerName ?? '',
    customerEmail: obj.customerEmail ?? '',
    messages: (obj.messages ?? []).map((m: any) => ({
      id: String(m._id),
      sender: m.sender,
      senderName: m.senderName ?? '',
      content: m.content,
      attachments: m.attachments ?? [],
      createdAt: m.createdAt,
    })),
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
    storeId: obj.storeId ? String(obj.storeId) : '',
  };
}

/** DTO phía admin — shape `SupportTicket` của frontend. */
export function toAdminTicket(ticket: any) {
  if (!ticket) return null;
  const obj = ticket.toObject ? ticket.toObject() : { ...ticket };
  delete obj.__v;
  const first = obj.messages?.[0];
  return {
    id: String(obj._id),
    ticketCode: obj.ticketCode,
    subject: obj.subject,
    message: first?.content ?? '',
    category: obj.category,
    priority: obj.priority,
    status: obj.status,
    assignee: obj.assignee ?? '',
    senderName: obj.customerName ?? '',
    customerEmail: obj.customerEmail ?? '',
    storeId: obj.storeId ? String(obj.storeId) : '',
    messages: (obj.messages ?? []).map((m: any) => ({
      id: String(m._id),
      userId: m.sender === MessageSender.CUSTOMER ? String(obj.userId ?? '') : '',
      userName: m.senderName ?? '',
      message: m.content,
      createdAt: m.createdAt,
    })),
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
}
