/**
 * Model Cart — giỏ hàng server-side (đồng bộ theo user).
 */
import { Schema, type InferSchemaType } from 'mongoose';
import { defineModel } from './registry';

const cartItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
    selected: { type: Boolean, default: true },
    /** Snapshot giá tại thời điểm thêm — dùng để hiển thị, server vẫn tính lại. */
    unitPrice: { type: Number, default: 0 },
  },
  { _id: true },
);

const cartSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    items: { type: [cartItemSchema], default: [] },
  },
  { timestamps: true },
);

export type CartDoc = InferSchemaType<typeof cartSchema>;

export const CartModel = defineModel('Cart', cartSchema);
