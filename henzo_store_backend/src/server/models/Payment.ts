import { Schema, type InferSchemaType } from 'mongoose';
import { defineModel } from './registry';
import { AdminPaymentStatus, TransactionStatus } from '../constants';

const paymentSchema = new Schema(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    orderCode: { type: String, default: '', index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
        storeId: { type: Schema.Types.ObjectId, ref: 'Store', index: true },

    amount: { type: Number, required: true, min: 0 },
        platformFee: { type: Number, default: 0 },
        netAmount: { type: Number, default: 0 },

    method: { type: String, default: 'cod' },
        paymentMethod: { type: String, default: 'cod' },
    status: {
      type: String,
      enum: Object.values(TransactionStatus),
      default: TransactionStatus.PENDING,
      index: true,
    },
    transactionId: { type: String, required: true, unique: true, index: true },
        note: { type: String, default: '' },
    refundedAt: { type: Date },
  },
  { timestamps: true },
);

paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });

export type PaymentDoc = InferSchemaType<typeof paymentSchema>;

export const PaymentModel = defineModel('Payment', paymentSchema);

export function toPaymentDto(payment: any) {
  if (!payment) return null;
  const obj = payment.toObject ? payment.toObject() : { ...payment };
  delete obj.__v;
  return {
    id: String(obj._id),
    orderId: obj.orderId ? String(obj.orderId) : '',
    orderCode: obj.orderCode ?? '',
    amount: obj.amount,
    platformFee: obj.platformFee ?? 0,
    netAmount: obj.netAmount ?? 0,
    method: obj.method ?? 'cod',

    paymentMethod: obj.paymentMethod ?? obj.method ?? 'cod',
    status: obj.status,
    transactionId: obj.transactionId,
    note: obj.note ?? '',
    storeId: obj.storeId ? String(obj.storeId) : '',
    createdAt: obj.createdAt,
  };
}

export function toAdminPaymentDto(payment: any) {
  const dto = toPaymentDto(payment);
  if (!dto) return null;
  const map: Record<string, string> = {
    success: AdminPaymentStatus.COMPLETED,
    pending: AdminPaymentStatus.PENDING,
    failed: AdminPaymentStatus.FAILED,
    refunded: AdminPaymentStatus.REFUNDED,
  };
  const obj = payment.toObject ? payment.toObject() : { ...payment };
  return {
    ...dto,
    status: map[dto.status] ?? dto.status,
        storeName:
      obj.storeId?.name ??
      (typeof obj.storeId === 'object' ? (obj.storeId as any)?.name : undefined) ??
      '',
  };
}
