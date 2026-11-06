import { Schema, type InferSchemaType } from 'mongoose';
import { defineModel } from './registry';

const categorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    icon: { type: String, default: '' },
    image: { type: String, default: '' },
    banner: { type: String, default: '' },
    description: { type: String, default: '' },
        parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
      index: true,
    },
    featured: { type: Boolean, default: false, index: true },
    order: { type: Number, default: 0 },
    productCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

categorySchema.index({ parentId: 1, order: 1 });

export type CategoryDoc = InferSchemaType<typeof categorySchema>;

export const CategoryModel = defineModel('Category', categorySchema);

export function toCategoryDto(category: any) {
  if (!category) return null;
  const obj = category.toObject ? category.toObject() : { ...category };
  delete obj.__v;
  return {
    id: String(obj._id),
    name: obj.name,
    slug: obj.slug,
    icon: obj.icon ?? '',
    image: obj.image ?? '',
    banner: obj.banner ?? '',
    description: obj.description ?? '',
    parentId: obj.parentId ? String(obj.parentId) : null,
    featured: obj.featured ?? false,
    order: obj.order ?? 0,
    productCount: obj.productCount ?? 0,
  };
}
