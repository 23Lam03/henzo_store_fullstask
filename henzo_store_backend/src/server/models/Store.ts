/**
 * Model Store — cửa hàng / người bán.
 * Gộp cả `Store` (admin) và `SellerStore` (seller) của frontend vào một entity.
 */
import { Schema, type InferSchemaType } from 'mongoose';
import { defineModel } from './registry';
import { StoreStatus } from '../constants';

const storeSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    avatar: { type: String, default: '' },
    banner: { type: String, default: '' },
    description: { type: String, default: '' },
    tagline: { type: String, default: '' },
    /** Xác minh bởi admin — hiển thị badge "Đã xác minh". */
    isVerified: { type: Boolean, default: false },
    status: {
      type: String,
      enum: Object.values(StoreStatus),
      default: StoreStatus.ACTIVE,
      index: true,
    },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    productCount: { type: Number, default: 0 },
    orderCount: { type: Number, default: 0 },
    followerCount: { type: Number, default: 0 },
    /** Thông tin pháp lý & thanh toán. */
    taxId: { type: String, default: '' },
    bankAccount: { type: String, default: '' },
    bankName: { type: String, default: '' },
    /** Chủ cửa hàng (user role SHOP). */
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  },
  { timestamps: true },
);

storeSchema.index({ status: 1, isVerified: 1, createdAt: -1 });
storeSchema.index({ name: 'text', description: 'text', address: 'text' });

export type StoreDoc = InferSchemaType<typeof storeSchema>;

export const StoreModel = defineModel('Store', storeSchema);

/** DTO cho trang admin quản lý cửa hàng. */
export function toAdminStore(store: any) {
  if (!store) return null;
  const obj = store.toObject ? store.toObject() : { ...store };
  delete obj.__v;
  return {
    id: String(obj._id),
    name: obj.name,
    slug: obj.slug,
    email: obj.email,
    phone: obj.phone ?? '',
    address: obj.address ?? '',
    avatar: obj.avatar ?? '',
    banner: obj.banner ?? '',
    description: obj.description ?? '',
    isVerified: obj.isVerified ?? false,
    status: obj.status ?? StoreStatus.ACTIVE,
    rating: obj.rating ?? 0,
    reviewCount: obj.reviewCount ?? 0,
    productCount: obj.productCount ?? 0,
    orderCount: obj.orderCount ?? 0,
    followerCount: obj.followerCount ?? 0,
    taxId: obj.taxId ?? '',
    bankAccount: obj.bankAccount ?? '',
    bankName: obj.bankName ?? '',
    createdAt: obj.createdAt,
  };
}

/** DTO rút gọn cho trang danh sách cửa hàng phía khách. */
export function toPublicStore(store: any) {
  if (!store) return null;
  const admin = toAdminStore(store);
  if (!admin) return null;
  return {
    id: admin.id,
    name: admin.name,
    slug: admin.slug,
    email: admin.email,
    phone: admin.phone,
    address: admin.address,
    avatar: admin.avatar,
    banner: admin.banner,
    description: admin.description,
    rating: admin.rating,
    reviewCount: admin.reviewCount,
    productCount: admin.productCount,
    orderCount: admin.orderCount,
    followerCount: admin.followerCount,
    isVerified: admin.isVerified,
    status: admin.status,
    createdAt: admin.createdAt,
  };
}
