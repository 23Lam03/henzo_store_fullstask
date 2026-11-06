/**
 * Model Notification — thông báo đẩy tới người dùng (khách, seller, admin).
 */
import { Schema, type InferSchemaType } from 'mongoose';
import { defineModel } from './registry';
import {
  AdminNotificationType,
  CustomerNotificationType,
  NotificationAudience,
  SellerNotificationType,
} from '../constants';

const notificationSchema = new Schema(
  {
    /** Người nhận — null nghĩa là gửi broadcast theo `audience`. */
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    /** Người nhận theo role (dùng cho broadcast). */
    audience: {
      type: String,
      enum: Object.values(NotificationAudience),
      default: NotificationAudience.ALL,
      index: true,
    },
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', index: true },

    type: {
      type: String,
      enum: [
        ...Object.values(CustomerNotificationType),
        ...Object.values(SellerNotificationType),
        ...Object.values(AdminNotificationType),
      ],
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false, index: true },
    link: { type: String, default: '' },
    /** Thông báo do hệ thống tự sinh (đơn hàng, thanh toán...). */
    isSystem: { type: Boolean, default: false },
  },
  { timestamps: true },
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ createdAt: -1 });

export type NotificationDoc = InferSchemaType<typeof notificationSchema>;

export const NotificationModel = defineModel('Notification', notificationSchema);

export function toNotificationDto(notif: any) {
  if (!notif) return null;
  const obj = notif.toObject ? notif.toObject() : { ...notif };
  delete obj.__v;
  return {
    id: String(obj._id),
    type: obj.type,
    title: obj.title,
    message: obj.message,
    msg: obj.message,
    isRead: obj.isRead ?? false,
    read: !(obj.isRead ?? false),
    link: obj.link || undefined,
    createdAt: obj.createdAt,
    time: obj.createdAt,
  };
}
