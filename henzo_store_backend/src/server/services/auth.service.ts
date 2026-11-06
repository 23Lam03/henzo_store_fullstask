import { z } from 'zod';
import {
  UserModel,
  toPublicUser,
  type UserDoc,
} from '../models/User';
import { StoreModel } from '../models/Store';
import {
  hashPassword,
  verifyPassword,
  signAccessToken,
  signRefreshToken,
} from '../auth/tokens';
import { conflict, unauthorized, badRequest } from '../http/errors';
import { UserRole } from '../constants';

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Vui lòng nhập họ tên.'),
  email: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập email.')
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email không hợp lệ.'),
  phone: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập số điện thoại.')
    .regex(/^0[0-9]{9}$/, 'Số điện thoại không hợp lệ.'),
  password: z
    .string()
    .min(1, 'Vui lòng nhập mật khẩu.')
    .min(6, 'Mật khẩu phải tối thiểu 6 ký tự.'),
});

export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Vui lòng nhập đầy đủ email và mật khẩu.'),
  password: z.string().min(1, 'Vui lòng nhập đầy đủ email và mật khẩu.'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
  newPassword: z.string().min(6, 'Mật khẩu mới phải ít nhất 6 ký tự'),
  confirmPassword: z.string().min(1, 'Vui lòng nhập mật khẩu mới'),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1).optional(),
  email: z
    .string()
    .trim()
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email không hợp lệ')
    .optional(),
  phone: z.string().trim().min(1).optional(),
  avatar: z.string().trim().optional(),
  address: z.string().trim().optional(),
  gender: z.enum(['Nam', 'Nữ', 'Khác']).optional(),
  dob: z.coerce.date().optional(),
  bio: z.string().optional(),
});

export interface AuthResult {
  user: ReturnType<typeof toPublicUser>;
  accessToken: string;
  refreshToken: string;
}

export async function register(data: z.infer<typeof registerSchema>): Promise<AuthResult> {
  const email = data.email.toLowerCase();
  const existing = await UserModel.findOne({ email });
  if (existing) {
    throw conflict('Đăng ký thất bại. Email có thể đã tồn tại!');
  }

  const hashed = await hashPassword(data.password);
  const user = await UserModel.create({
    email,
    password: hashed,
    name: data.name,
    phone: data.phone,
    role: UserRole.CUSTOMER,
    status: 'active',
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(data.name)}`,
  });

  return issueTokens(user);
}

export async function login(
  data: z.infer<typeof loginSchema>,
): Promise<AuthResult> {
  const email = data.email.toLowerCase();
  const user = await UserModel.findOne({ email }).select('+password');

  if (!user) {
    throw unauthorized('Email hoặc mật khẩu không đúng!');
  }

  const valid = await verifyPassword(data.password, user.password);
  if (!valid) {
    throw unauthorized('Email hoặc mật khẩu không đúng!');
  }

  if (user.status === 'locked') {
    throw unauthorized('Tài khoản đã bị khóa. Vui lòng liên hệ hỗ trợ.');
  }

  user.lastLoginAt = new Date();
  await user.save();

  return issueTokens(user);
}

export function issueTokens(user: UserDoc | any): AuthResult {
  const role = user.role as string;
  const storeId = user.storeId ? String(user.storeId) : undefined;

  const accessToken = signAccessToken({
    sub: String(user._id),
    role,
    storeId,
  });
  const refreshToken = signRefreshToken({
    sub: String(user._id),
    role,
    storeId,
  });

  return { user: toPublicUser(user), accessToken, refreshToken };
}

export async function refreshSession(
  userId: string,
  role: string,
  storeId?: string,
): Promise<AuthResult> {
  const user = await UserModel.findById(userId);
  if (!user) throw unauthorized('Phiên đăng nhập không hợp lệ');
  if (user.status === 'locked') {
    throw unauthorized('Tài khoản đã bị khóa.');
  }

  const accessToken = signAccessToken({ sub: userId, role, storeId });
  const refreshToken = signRefreshToken({ sub: userId, role, storeId });

  return { user: toPublicUser(user), accessToken, refreshToken };
}

export async function changePassword(
  userId: string,
  data: z.infer<typeof changePasswordSchema>,
): Promise<void> {
  if (data.newPassword !== data.confirmPassword) {
    throw badRequest('Xác nhận mật khẩu không khớp');
  }

  const user = await UserModel.findById(userId).select('+password');
  if (!user) throw unauthorized('Người dùng không tồn tại');

  const valid = await verifyPassword(data.currentPassword, user.password);
  if (!valid) {
    throw badRequest('Mật khẩu hiện tại không đúng');
  }

  user.password = await hashPassword(data.newPassword);
  await user.save();
}

export async function updateProfile(
  userId: string,
  data: z.infer<typeof updateProfileSchema>,
) {
  const user = await UserModel.findById(userId);
  if (!user) throw unauthorized('Người dùng không tồn tại');

  if (data.email && data.email.toLowerCase() !== user.email) {
    const dup = await UserModel.findOne({
      email: data.email.toLowerCase(),
      _id: { $ne: user._id },
    });
    if (dup) throw conflict('Email đã được sử dụng');
    user.email = data.email.toLowerCase();
  }

  if (data.name !== undefined) user.name = data.name;
  if (data.phone !== undefined) user.phone = data.phone;
  if (data.avatar !== undefined) user.avatar = data.avatar;
  if (data.address !== undefined) user.address = data.address;
  if (data.gender !== undefined) user.gender = data.gender;
  if (data.dob !== undefined) user.dob = data.dob;
  if (data.bio !== undefined) user.bio = data.bio;

  await user.save();
  return toPublicUser(user);
}

export async function registerStore(input: {
  name: string;
  email: string;
  phone: string;
  password: string;
  address?: string;
  description?: string;
}) {
  const email = input.email.toLowerCase();
  const existing = await UserModel.findOne({ email });
  if (existing) {
    throw conflict('Đăng ký thất bại. Email có thể đã tồn tại!');
  }

  const slug = await uniqueStoreSlug(input.name);
  const store = await StoreModel.create({
    name: input.name,
    slug,
    email,
    phone: input.phone,
    address: input.address ?? '',
    description: input.description ?? '',
    status: 'active',
    isVerified: false,
  });

  const hashed = await hashPassword(input.password);
  const user = await UserModel.create({
    email,
    password: hashed,
    name: input.name,
    phone: input.phone,
    role: UserRole.SHOP,
    status: 'active',
    storeId: store._id,
    avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${slug}`,
  });

  return { user: toPublicUser(user), store };
}

async function uniqueStoreSlug(name: string): Promise<string> {
  const base =
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 50) || 'store';

  let slug = base;
  let i = 1;
  while (await StoreModel.exists({ slug })) {
    slug = `${base}-${i}`;
    i += 1;
  }
  return slug;
}
