/**
 * Chuẩn response thống nhất — khớp `ApiEnvelope` trong frontend
 * (`henzo_store/src/services/api.ts`).
 *
 *   { success, data, meta?: { page, pageSize, total, totalPages }, error?: { code, message, details } }
 */

export interface ApiMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  meta?: ApiMeta;
  error?: ApiErrorPayload;
}

/** Trả về response thành công (200). */
export function ok<T>(data: T, meta?: ApiMeta, status = 200): Response {
  const body: ApiEnvelope<T> = { success: true, data };
  if (meta) body.meta = meta;
  return Response.json(body, { status });
}

/** Trả về response thành công kèm header (vd: Set-Cookie refresh token). */
export function okWithHeaders<T>(
  data: T,
  headers: HeadersInit,
  meta?: ApiMeta,
  status = 200,
): Response {
  const body: ApiEnvelope<T> = { success: true, data };
  if (meta) body.meta = meta;
  return Response.json(body, { status, headers });
}

/** Trả về response lỗi. */
export function fail(
  message: string,
  status = 400,
  code = 'BAD_REQUEST',
  details?: unknown,
): Response {
  const body: ApiEnvelope<null> = {
    success: false,
    data: null,
    error: { code, message, ...(details ? { details } : {}) },
  };
  return Response.json(body, { status });
}

/** Response phân trang chuẩn. */
export function paginated<T>(
  items: T[],
  meta: ApiMeta,
  headers?: HeadersInit,
): Response {
  const body: ApiEnvelope<T[]> = { success: true, data: items, meta };
  return Response.json(body, headers ? { headers } : undefined);
}
