/**
 * Model Promotion — chương trình khuyến mãi (admin quản lý).
 * Model Voucher — mã giảm giá áp dụng khi checkout (seller/admin quản lý).
 */
import { Schema, type InferSchemaType } from 'mongoose';
import { defineModel } from './registry';
import {
  AdminPromotionStatus,
  DiscountType,
  PromotionType,
  SellerPromotionStatus,
} from '../constants';

// ─── Promotion ────────────────────────────────────────────────────────────────
const promotionSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    discount: { type: Number, default: 0, min: 0, max: 100 },
    code: { type: String, default: '', index: true },
    type: {
      type: String,
      enum: Object.values(PromotionType),
      default: PromotionType.DISCOUNT_CAMPAIGN,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: {
      type: String,
      enum: Object.values(SellerPromotionStatus),
      default: SellerPromotionStatus.ACTIVE,
      index: true,
    },
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', index: true },

    // ─── Cấu hình chi tiết (dùng cho voucher của seller) ───────────────────
    discountType: {
      type: String,
      enum: Object.values(DiscountType),
      default: DiscountType.PERCENT,
    },
    discountValue: { type: Number, default: 0, min: 0 },
    minOrderValue: { type: Number, default: 0, min: 0 },
    maxDiscount: { type: Number, default: 0, min: 0 },
    usageLimit: { type: Number, default: 0, min: 0 },
    usedCount: { type: Number, default: 0, min: 0 },
    targetProducts: { type: [Schema.Types.ObjectId], default: [] },
    targetCategories: { type: [Schema.Types.ObjectId], default: [] },
  },
  { timestamps: true },
);

promotionSchema.index({ startDate: 1, endDate: 1 });

export type PromotionDoc = InferSchemaType<typeof promotionSchema>;

export const PromotionModel = defineModel('Promotion', promotionSchema);

/** Trạng thái hiển thị suy ra từ ngày bắt đầu/kết thúc (khớp `getPromoStatus`). */
export function promotionStatus(promo: {
  startDate?: Date | string;
  endDate?: Date | string;
}): string {
  const now = Date.now();
  const start = new Date(promo.startDate ?? 0).getTime();
  const end = new Date(promo.endDate ?? 0).getTime();
  if (now < start) return AdminPromotionStatus.UPCOMING;
  if (now > end) return AdminPromotionStatus.ENDED;
  return AdminPromotionStatus.ACTIVE;
}

export function toPromotionDto(promo: any) {
  if (!promo) return null;
  const obj = promo.toObject ? promo.toObject() : { ...promo };
  delete obj.__v;
  const status = promotionStatus(obj);
  return {
    id: String(obj._id),
    title: obj.title,
    description: obj.description ?? '',
    image: obj.image ?? '',
    discount: obj.discount ?? 0,
    code: obj.code || undefined,
    type: obj.type ?? PromotionType.DISCOUNT_CAMPAIGN,
    startDate: obj.startDate,
    endDate: obj.endDate,
    isActive: status === AdminPromotionStatus.ACTIVE,
    status,
    storeId: obj.storeId ? String(obj.storeId) : '',
    createdAt: obj.createdAt,
  };
}

/** DTO phía seller — shape `SellerPromotion`. */
export function toSellerPromotion(promo: any) {
  if (!promo) return null;
  const obj = promo.toObject ? promo.toObject() : { ...promo };
  delete obj.__v;
  return {
    id: String(obj._id),
    name: obj.title ?? obj.name ?? '',
    type: obj.type ?? PromotionType.VOUCHER,
    code: obj.code ?? '',
    discountType: obj.discountType ?? DiscountType.PERCENT,
    discountValue: obj.discountValue ?? obj.discount ?? 0,
    minOrderValue: obj.minOrderValue ?? 0,
    maxDiscount: obj.maxDiscount ?? 0,
    startDate: obj.startDate,
    endDate: obj.endDate,
    status: obj.status ?? SellerPromotionStatus.ACTIVE,
    usageLimit: obj.usageLimit ?? 0,
    usedCount: obj.usedCount ?? 0,
    targetProducts: (obj.targetProducts ?? []).map(String),
    targetCategories: (obj.targetCategories ?? []).map(String),
    storeId: obj.storeId ? String(obj.storeId) : '',
    createdAt: obj.createdAt,
  };
}

// ─── Voucher ──────────────────────────────────────────────────────────────────
const voucherSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    name: { type: String, default: '' },
    description: { type: String, default: '' },
    discountType: {
      type: String,
      enum: Object.values(DiscountType),
      default: DiscountType.FIXED,
    },
    discountValue: { type: Number, required: true, min: 0 },
    maxDiscount: { type: Number, default: 0, min: 0 },
    minOrderValue: { type: Number, default: 0, min: 0 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: Object.values(SellerPromotionStatus),
      default: SellerPromotionStatus.ACTIVE,
      index: true,
    },
    usageLimit: { type: Number, default: 0, min: 0 },
    usedCount: { type: Number, default: 0, min: 0 },
    perUserLimit: { type: Number, default: 1, min: 0 },
    targetProducts: { type: [Schema.Types.ObjectId], default: [] },
    targetCategories: { type: [Schema.Types.ObjectId], default: [] },
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', index: true },
    savedBy: { type: [Schema.Types.ObjectId], default: [] },
  },
  { timestamps: true },
);

export type VoucherDoc = InferSchemaType<typeof voucherSchema>;

export const VoucherModel = defineModel('Voucher', voucherSchema);

export function toVoucherDto(voucher: any, saved = false) {
  if (!voucher) return null;
  const obj = voucher.toObject ? voucher.toObject() : { ...voucher };
  delete obj.__v;
  return {
    id: String(obj._id),
    code: obj.code,
    name: obj.name ?? '',
    desc: obj.description ?? '',
    description: obj.description ?? '',
    value: obj.discountValue ?? 0,
    discountValue: obj.discountValue ?? 0,
    discountType: obj.discountType ?? DiscountType.FIXED,
    maxDiscount: obj.maxDiscount ?? 0,
    minOrder: obj.minOrderValue ?? 0,
    minOrderValue: obj.minOrderValue ?? 0,
    startDate: obj.startDate,
    endDate: obj.endDate,
    exp: new Date(obj.endDate).toLocaleDateString('vi-VN'),
    status: obj.status ?? SellerPromotionStatus.ACTIVE,
    usageLimit: obj.usageLimit ?? 0,
    usedCount: obj.usedCount ?? 0,
    isSaved: saved,
    storeId: obj.storeId ? String(obj.storeId) : '',
  };
}
