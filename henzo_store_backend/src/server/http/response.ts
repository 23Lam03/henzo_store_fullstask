
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

export function ok<T>(data: T, meta?: ApiMeta, status = 200): Response {
  const body: ApiEnvelope<T> = { success: true, data };
  if (meta) body.meta = meta;
  return Response.json(body, { status });
}

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

export function paginated<T>(
  items: T[],
  meta: ApiMeta,
  headers?: HeadersInit,
): Response {
  const body: ApiEnvelope<T[]> = { success: true, data: items, meta };
  return Response.json(body, headers ? { headers } : undefined);
}
