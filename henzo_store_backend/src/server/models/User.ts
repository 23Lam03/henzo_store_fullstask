/**
 * Model User — khách hàng, người bán (SHOP) và nhân viên quản trị.
 */
import { Schema, type InferSchemaType } from 'mongoose';
import { defineModel } from './registry';
import { UserRole, UserRoleValue } from '../constants';

const addressSchema = new Schema(
  {
    label: { type: String, trim: true },
    name: { type: String, trim: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    ward: { type: String, trim: true },
    city: { type: String, trim: true },
    district: { type: String, trim: true },
    province: { type: String, trim: true },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true },
);

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: { type: String, required: true, select: false },
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    avatar: { type: String, default: '' },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.CUSTOMER,
      index: true,
    },
    /** Trạng thái tài khoản — admin có thể khóa. */
    status: {
      type: String,
      enum: ['active', 'locked'],
      default: 'active',
      index: true,
    },
    /** Thông tin cửa hàng (chỉ role SHOP). */
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', index: true },
    /** Quyền hạn tuỳ chỉnh (dùng cho MODERATOR/STAFF/ADMIN). */
    permissions: { type: [String], default: [] },
    /** Địa chỉ mặc định dạng chuỗi (khớp trường `User.address` ở frontend). */
    address: { type: String, trim: true },
    /** Sổ địa chỉ đầy đủ. */
    addresses: { type: [addressSchema], default: [] },
    gender: { type: String, enum: ['Nam', 'Nữ', 'Khác'], default: undefined },
    dob: { type: Date },
    bio: { type: String, default: '' },
    /** Điểm thưởng — hiển thị ở trang Account. */
    points: { type: Number, default: 0 },
    lastLoginAt: { type: Date },
  },
  { timestamps: true },
);

userSchema.index({ role: 1, status: 1, createdAt: -1 });

export type UserDoc = InferSchemaType<typeof userSchema>;

export const UserModel = defineModel('User', userSchema);

/** Chuyển doc -> object public (loại bỏ password & các field nội bộ). */
export function toPublicUser(user: any) {
  if (!user) return null;
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.password;
  delete obj.__v;
  return {
    id: String(obj._id),
    email: obj.email,
    name: obj.name,
    phone: obj.phone ?? '',
    avatar: obj.avatar ?? '',
    role: obj.role as UserRoleValue,
    address: obj.address,
    gender: obj.gender ?? '',
    dob: obj.dob ?? null,
    bio: obj.bio ?? '',
    points: obj.points ?? 0,
    createdAt: obj.createdAt,
  };
}

/** Chuyển doc -> object đầy đủ cho các màn hình quản trị. */
export function toAdminUser(user: any) {
  if (!user) return null;
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.password;
  delete obj.__v;
  return {
    ...obj,
    id: String(obj._id),
    role: obj.role as UserRoleValue,
    status: obj.status ?? 'active',
    isLocked: (obj.status ?? 'active') === 'locked',
  };
}
