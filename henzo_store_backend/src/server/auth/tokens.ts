/**
 * Mật khẩu & token.
 * - Hash: bcryptjs (thuần JS, không cần native binding)
 * - Access token: JWT ngắn hạn, trả về trong body để client lưu localStorage
 * - Refresh token: JWT dài hạn, nằm trong cookie httpOnly
 */
import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { config } from '../../config/env';

const SALT_ROUNDS = 10;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(
  plain: string,
  hashed: string,
): Promise<boolean> {
  if (!hashed) return false;
  return bcrypt.compare(plain, hashed);
}

export interface TokenPayload {
  sub: string; // userId
  role: string;
  storeId?: string; // dành cho role SHOP
  type: 'access' | 'refresh';
}

export function signAccessToken(payload: Omit<TokenPayload, 'type'>): string {
  return jwt.sign(
    { ...payload, type: 'access' },
    config.JWT_ACCESS_SECRET,
    { expiresIn: config.JWT_ACCESS_EXPIRES } as SignOptions,
  );
}

export function signRefreshToken(payload: Omit<TokenPayload, 'type'>): string {
  return jwt.sign(
    { ...payload, type: 'refresh' },
    config.JWT_REFRESH_SECRET,
    { expiresIn: config.JWT_REFRESH_EXPIRES } as SignOptions,
  );
}

export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, config.JWT_ACCESS_SECRET) as TokenPayload;
    if (decoded.type !== 'access') return null;
    return decoded;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, config.JWT_REFRESH_SECRET) as TokenPayload;
    if (decoded.type !== 'refresh') return null;
    return decoded;
  } catch {
    return null;
  }
}

/** Sinh mã đơn hàng dạng HDN-YYYYMMDD-XXX */
export function buildOrderNumber(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const suffix = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
  return `HDN-${y}${m}${d}-${suffix}`;
}

/** Sinh mã ticket hỗ trợ dạng TKTSPT-XXX */
export function buildTicketCode(seq: number): string {
  return `TKTSPT-${String(seq).padStart(3, '0')}`;
}

/** Sinh mã giao dịch thanh toán. */
export function buildTransactionId(): string {
  return `TXN${Date.now()}${Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0')}`;
}
