/**
 * Model Payment — giao dịch thanh toán.
 * Một đơn có thể có nhiều giao dịch (thử lại, hoàn tiền).
 */
import { Schema, type InferSchemaType } from 'mongoose';
import { defineModel } from './registry';
import { AdminPaymentStatus, TransactionStatus } from '../constants';

const paymentSchema = new Schema(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    orderCode: { type: String, default: '', index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    /**
     * Cửa hàng nhận giao dịch này.
     *
     * Một đơn marketplace có thể chứa sản phẩm của nhiều cửa hàng, nên ta tạo
     * **một giao dịch riêng cho từng cửa hàng** (`storeId` khác nhau).
     * Nhờ vậy mọi truy vấn tài chính của seller scope theo `storeId` hoạt động
     * đúng, và mỗi seller bị trừ đúng phí sàn trên phần doanh thu của mình.
     */
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', index: true },

    amount: { type: Number, required: true, min: 0 },
    /** Phí sàn trừ vào doanh thu seller (PLATFORM_FEE_RATE). */
    platformFee: { type: Number, default: 0 },
    /** Tiền seller thực nhận = amount - platformFee. */
    netAmount: { type: Number, default: 0 },

    method: { type: String, default: 'cod' },
    /** Alias trùng `method` — frontend `SellerPayment` đọc `paymentMethod`. */
    paymentMethod: { type: String, default: 'cod' },
    status: {
      type: String,
      enum: Object.values(TransactionStatus),
      default: TransactionStatus.PENDING,
      index: true,
    },
    transactionId: { type: String, required: true, unique: true, index: true },
    /** Lý do hoàn tiền / thất bại. */
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
    // Frontend `SellerPayment` dùng `paymentMethod` — trả cả hai để tương thích.
    paymentMethod: obj.paymentMethod ?? obj.method ?? 'cod',
    status: obj.status,
    transactionId: obj.transactionId,
    note: obj.note ?? '',
    storeId: obj.storeId ? String(obj.storeId) : '',
    createdAt: obj.createdAt,
  };
}

/** Map trạng thái giao dịch sang trạng thái hiển thị ở trang admin. */
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
    /** Tên cửa hàng (nếu đã được populate). */
    storeName:
      obj.storeId?.name ??
      (typeof obj.storeId === 'object' ? (obj.storeId as any)?.name : undefined) ??
      '',
  };
}
