/**
 * Model Shipping — vận đơn vận chuyển của seller.
 */
import { Schema, type InferSchemaType } from 'mongoose';
import { defineModel } from './registry';
import { ShippingStatus } from '../constants';

const shippingSchema = new Schema(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    orderCode: { type: String, default: '', index: true },
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', index: true },

    trackingNumber: { type: String, default: '', index: true },
    carrier: { type: String, default: '' },
    status: {
      type: String,
      enum: Object.values(ShippingStatus),
      default: ShippingStatus.WAITING_PICKUP,
      index: true,
    },

    senderName: { type: String, default: '' },
    senderPhone: { type: String, default: '' },
    senderAddress: { type: String, default: '' },
    receiverName: { type: String, default: '' },
    receiverPhone: { type: String, default: '' },
    receiverAddress: { type: String, default: '' },

    weight: { type: Number, default: 0 },
    dimensions: { type: String, default: '' },
    shippingFee: { type: Number, default: 0 },
    /** Tiền thu hộ (COD). */
    codAmount: { type: Number, default: 0 },
    estimatedDelivery: { type: Date },
    actualDelivery: { type: Date },
  },
  { timestamps: true },
);

shippingSchema.index({ storeId: 1, status: 1, createdAt: -1 });

export type ShippingDoc = InferSchemaType<typeof shippingSchema>;

export const ShippingModel = defineModel('Shipping', shippingSchema);

export function toShippingDto(ship: any) {
  if (!ship) return null;
  const obj = ship.toObject ? ship.toObject() : { ...ship };
  delete obj.__v;
  return {
    id: String(obj._id),
    orderId: obj.orderId ? String(obj.orderId) : '',
    orderCode: obj.orderCode ?? '',
    trackingNumber: obj.trackingNumber ?? '',
    carrier: obj.carrier ?? '',
    status: obj.status,
    senderName: obj.senderName ?? '',
    senderPhone: obj.senderPhone ?? '',
    senderAddress: obj.senderAddress ?? '',
    receiverName: obj.receiverName ?? '',
    receiverPhone: obj.receiverPhone ?? '',
    receiverAddress: obj.receiverAddress ?? '',
    weight: obj.weight ?? 0,
    dimensions: obj.dimensions ?? '',
    shippingFee: obj.shippingFee ?? 0,
    codAmount: obj.codAmount ?? 0,
    estimatedDelivery: obj.estimatedDelivery,
    actualDelivery: obj.actualDelivery,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
    storeId: obj.storeId ? String(obj.storeId) : '',
  };
}
