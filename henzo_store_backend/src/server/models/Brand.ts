import { Schema, type InferSchemaType } from 'mongoose';
import { defineModel } from './registry';

const brandSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    logo: { type: String, default: '' },
    banner: { type: String, default: '' },
    tagline: { type: String, default: '' },
    description: { type: String, default: '' },
    color: { type: String, default: '#4F46E5' },
    productCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export type BrandDoc = InferSchemaType<typeof brandSchema>;

export const BrandModel = defineModel('Brand', brandSchema);

export function toBrandDto(brand: any) {
  if (!brand) return null;
  const obj = brand.toObject ? brand.toObject() : { ...brand };
  delete obj.__v;
  return {
    id: String(obj._id),
    name: obj.name,
    slug: obj.slug,
    logo: obj.logo ?? '',
    banner: obj.banner ?? '',
    tagline: obj.tagline ?? '',
    description: obj.description ?? '',
    color: obj.color ?? '#4F46E5',
    productCount: obj.productCount ?? 0,
  };
}
