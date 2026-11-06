/**
 * Model Product — kho sản phẩm chung của sàn (mỗi sản phẩm thuộc 1 store).
 */
import { Schema, type InferSchemaType } from 'mongoose';
import { defineModel } from './registry';
import { ProductStatus } from '../constants';

const productSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    description: { type: String, default: '' },
    shortDescription: { type: String, default: '' },

    // ─── Giá ───────────────────────────────────────────────────────────────
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, default: 0, min: 0 },
    /** Phần trăm giảm — được tính lại khi sửa giá. */
    discount: { type: Number, default: 0, min: 0, max: 100 },

    // ─── Media ─────────────────────────────────────────────────────────────
    images: { type: [String], default: [] },

    // ─── Phân loại ─────────────────────────────────────────────────────────
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', index: true },
    /** Denormalised để frontend đọc trực tiếp `product.categoryName`. */
    categoryName: { type: String, default: '', index: true },
    brand: { type: String, default: '', index: true },

    // ─── Tồn kho & bán hàng ────────────────────────────────────────────────
    stock: { type: Number, default: 0, min: 0 },
    reserved: { type: Number, default: 0, min: 0 },
    sold: { type: Number, default: 0, min: 0 },
    viewCount: { type: Number, default: 0, min: 0 },
    minStock: { type: Number, default: 10, min: 0 },
    lastRestockedAt: { type: Date },

    // ─── Đánh giá ──────────────────────────────────────────────────────────
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },

    // ─── Thuộc tính ────────────────────────────────────────────────────────
    tags: { type: [String], default: [], index: true },
    specifications: { type: Map, of: String, default: {} },

    // ─── Cờ hiển thị ───────────────────────────────────────────────────────
    isFeatured: { type: Boolean, default: false, index: true },
    isNew: { type: Boolean, default: false, index: true },
    isHot: { type: Boolean, default: false, index: true },

    // ─── Quản lý ───────────────────────────────────────────────────────────
    /** Store sở hữu sản phẩm — mọi truy vấn seller đều scope theo field này. */
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', index: true },
    status: {
      type: String,
      enum: Object.values(ProductStatus),
      default: ProductStatus.ACTIVE,
      index: true,
    },
    sku: { type: String, default: '', index: true },
  },
  {
    timestamps: true,
    // `isNew` trùng tên với getter/setter `isNew` của Mongoose Document.
    // Đã kiểm chứng round-trip với MongoDB thật: create -> save -> lean read
    // -> update -> save đều giữ đúng giá trị, và `toObject()`/`modifiedPaths()`
    // vẫn xem `isNew` là một schema path bình thường.
    suppressReservedKeysWarning: true,
  },
);

productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ status: 1, isFeatured: -1, sold: -1 });
productSchema.index({ storeId: 1, status: 1 });
productSchema.index({ categoryId: 1, brand: 1, price: 1 });
productSchema.index({ createdAt: -1 });

export type ProductDoc = InferSchemaType<typeof productSchema>;

export const ProductModel = defineModel('Product', productSchema);

/** Tính lại % giảm giá. */
export function computeDiscount(price: number, originalPrice: number): number {
  if (!originalPrice || originalPrice <= price) return 0;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
}

/**
 * DTO sản phẩm — giữ đúng tên field mà frontend đọc.
 * `specifications` là Map trong Mongo, frontend cần object thuần.
 */
export function toProductDto(product: any) {
  if (!product) return null;
  const obj = product.toObject ? product.toObject() : { ...product };
  delete obj.__v;

  const specs: Record<string, string> = {};
  if (obj.specifications) {
    if (obj.specifications instanceof Map) {
      for (const [k, v] of obj.specifications.entries()) specs[k] = v;
    } else {
      Object.assign(specs, obj.specifications);
    }
  }

  return {
    id: String(obj._id),
    name: obj.name,
    slug: obj.slug,
    description: obj.description ?? '',
    shortDescription: obj.shortDescription ?? '',
    price: obj.price,
    originalPrice: obj.originalPrice ?? obj.price,
    discount: obj.discount ?? 0,
    images: obj.images ?? [],
    categoryId: obj.categoryId ? String(obj.categoryId) : '',
    categoryName: obj.categoryName ?? '',
    brand: obj.brand ?? '',
    rating: obj.rating ?? 0,
    reviewCount: obj.reviewCount ?? 0,
    stock: obj.stock ?? 0,
    sold: obj.sold ?? 0,
    tags: obj.tags ?? [],
    specifications: specs,
    isFeatured: obj.isFeatured ?? false,
    isNew: obj.isNew ?? false,
    isHot: obj.isHot ?? false,
    sku: obj.sku ?? '',
    viewCount: obj.viewCount ?? 0,
    status: obj.status ?? ProductStatus.ACTIVE,
    storeId: obj.storeId ? String(obj.storeId) : '',
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
}
