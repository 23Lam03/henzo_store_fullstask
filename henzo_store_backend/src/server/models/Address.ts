import { Schema, type InferSchemaType } from 'mongoose';
import { defineModel } from './registry';

const addressSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    label: { type: String, default: 'Nhà riêng' },
    name: { type: String, required: true },
    phone: { type: String, required: true },
        address: { type: String, default: '' },
    ward: { type: String, default: '' },
    city: { type: String, default: '' },
    district: { type: String, default: '' },
    province: { type: String, default: '' },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true },
);

addressSchema.index({ userId: 1, isDefault: -1 });

export type AddressDoc = InferSchemaType<typeof addressSchema>;

export const AddressModel = defineModel('Address', addressSchema);

export function toAddressDto(addr: any) {
  if (!addr) return null;
  const obj = addr.toObject ? addr.toObject() : { ...addr };
  delete obj.__v;
  return {
    id: String(obj._id),
    label: obj.label ?? '',
    name: obj.name,
    phone: obj.phone,
    address: obj.address ?? '',
    ward: obj.ward ?? '',
    city: obj.city ?? '',
    district: obj.district ?? '',
    province: obj.province ?? '',
    isDefault: obj.isDefault ?? false,
  };
}
