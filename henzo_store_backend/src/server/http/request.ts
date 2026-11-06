/**
 * Tiện ích đọc & kiểm tra request.
 */
import { z } from 'zod';
import { badRequest } from './errors';
import { PAGINATION } from '../constants';

export async function readJson<T = unknown>(
  request: Request,
  schema?: z.ZodType<T>,
): Promise<T> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw badRequest('Dữ liệu gửi lên không hợp lệ');
  }
  if (!schema) return raw as T;

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw badRequest(
      'Dữ liệu gửi lên không hợp lệ',
      parsed.error.issues.map((i) => ({
        field: i.path.join('.'),
        message: i.message,
      })),
    );
  }
  return parsed.data;
}

/** Parse số nguyên an toàn. */
export function toInt(value: string | null, fallback: number): number {
  if (value === null || value === '') return fallback;
  const n = Number.parseInt(value, 10);
  return Number.isNaN(n) ? fallback : n;
}

/** Parse số thực an toàn. */
export function toFloat(value: string | null, fallback: number): number {
  if (value === null || value === '') return fallback;
  const n = Number.parseFloat(value);
  return Number.isNaN(n) ? fallback : n;
}

/** Parse boolean từ query string ('1', 'true', 'yes'). */
export function toBool(value: string | null): boolean {
  return value === '1' || value === 'true' || value === 'yes';
}

/**
 * Đọc tham số phân trang từ URLSearchParams.
 * Giới hạn pageSize để tránh query quá nặng.
 */
export function readPagination(searchParams: URLSearchParams) {
  const page = Math.max(1, toInt(searchParams.get('page'), 1));
  const rawSize = toInt(
    searchParams.get('pageSize'),
    PAGINATION.defaultPageSize,
  );
  const pageSize = Math.min(
    Math.max(1, rawSize),
    PAGINATION.maxPageSize,
  );
  return { page, pageSize };
}

/** Tính meta phân trang. */
export function buildMeta(
  page: number,
  pageSize: number,
  total: number,
) {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

/** Tách chuỗi comma-separated thành mảng (loại bỏ rỗng). */
export function splitCsv(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

/** Lấy giá trị đầu tiên từ mảng (hỗ trợ `?brands=a&brands=b`). */
export function firstParam(
  searchParams: URLSearchParams,
  key: string,
): string | null {
  const all = searchParams.getAll(key);
  if (all.length === 0) return null;
  // Nếu có nhiều giá trị dạng CSV, gộp lại.
  return all.join(',');
}

/**
 * Chuẩn hoá chuỗi tìm kiếm: bỏ khoảng trắng thừa, giới hạn độ dài.
 */
export function normalizeSearch(value: string | null | undefined): string {
  if (!value) return '';
  return value.trim().slice(0, 120);
}
