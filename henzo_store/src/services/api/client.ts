
function normalizeApiBaseUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, '');
  if (!trimmed) return 'http://localhost:4000/api';
  if (/\/api$/.test(trimmed)) return trimmed;
  return `${trimmed}/api`;
}

export const API_BASE_URL = normalizeApiBaseUrl(
  import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api',
);

export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

const WIKIMEDIA_HOSTS = [
  'upload.wikimedia.org',
  'thumb.wikimedia.org',
  'commons.wikimedia.org',
];

export function proxiedImageUrl(url: string | undefined | null): string {
  if (!url) return '';
  let parsed: URL;
  try {
    parsed = new URL(url, window.location.origin);
  } catch {
    return url;
  }
  if (!WIKIMEDIA_HOSTS.includes(parsed.hostname)) return url;

  parsed.search = '';
  return `${API_ORIGIN}/api/image?url=${encodeURIComponent(parsed.toString())}`;
}

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

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const ACCESS_TOKEN_KEY = 'henzo_access_token';

export const tokenStore = {
    get: (): string | null => {
    try {
      return (
        localStorage.getItem(ACCESS_TOKEN_KEY) ??
        sessionStorage.getItem(ACCESS_TOKEN_KEY)
      );
    } catch {
      return null;
    }
  },
    set: (token: string, remember = true): void => {
    try {
      const store = remember ? localStorage : sessionStorage;
      store.setItem(ACCESS_TOKEN_KEY, token);

      const other = remember ? sessionStorage : localStorage;
      other.removeItem(ACCESS_TOKEN_KEY);
    } catch {void 0; 
          }
  },
  clear: (): void => {
    try {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    } catch {void 0; 
          }
  },
};

export type QueryValue = string | number | boolean | undefined | null;

export function qs(params?: Record<string, QueryValue>): string {
  if (!params) return '';
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }
  const str = search.toString();
  return str ? `?${str}` : '';
}

type AuthFailureHandler = () => void;
const authFailureHandlers = new Set<AuthFailureHandler>();

export function onAuthFailure(handler: AuthFailureHandler): () => void {
  authFailureHandlers.add(handler);
  return () => authFailureHandlers.delete(handler);
}

function notifyAuthFailure(): void {
  for (const handler of authFailureHandlers) handler();
}

async function readEnvelope<T>(res: Response): Promise<ApiEnvelope<T>> {
  const text = await res.text();
  if (!text) {
    return { success: res.ok, data: null as T };
  }
  try {
    const parsed = JSON.parse(text) as ApiEnvelope<T>;

    return { ...parsed, data: rewriteImageUrls(parsed.data) };
  } catch {
    throw new ApiError(
      res.status,
      'INVALID_RESPONSE',
      'Máy chủ trả về dữ liệu không hợp lệ.',
    );
  }
}

function rewriteImageUrls<T>(value: T): T {
  if (typeof value === 'string') {
    return (proxiedImageUrl(value) as unknown) as T;
  }
  if (Array.isArray(value)) {
    return value.map((v) => rewriteImageUrls(v)) as unknown as T;
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = rewriteImageUrls(v);
    }
    return out as unknown as T;
  }
  return value;
}

async function refreshAccessToken(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) return false;
    const payload = (await res.json()) as ApiEnvelope<{
      accessToken: string | null;
    }>;
    const token = payload.data?.accessToken;
    if (!token) return false;
    tokenStore.set(token);
    return true;
  } catch {
    return false;
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
    headers?: Record<string, string>;
    auth?: boolean;
}

export async function apiFetch<T>(
  url: string,
  options: RequestOptions = {},
  retry = true,
): Promise<T> {
  const method = options.method ?? 'GET';
  const headers: Record<string, string> = {
    ...(options.headers ?? {}),
  };

  if (options.body !== undefined && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (options.auth !== false) {
    const token = tokenStore.get();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    credentials: 'include',
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 401 && retry && options.auth !== false) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return apiFetch<T>(url, options, false);
    }
    tokenStore.clear();
    notifyAuthFailure();
  }

  const payload = await readEnvelope<T>(res);

  if (!res.ok || !payload.success) {
    throw new ApiError(
      res.status,
      payload.error?.code ?? 'UNKNOWN_ERROR',
      payload.error?.message ?? `Lỗi ${res.status}`,
      payload.error?.details,
    );
  }

  return payload.data;
}

export async function apiFetchWithMeta<T>(
  url: string,
  options: RequestOptions = {},
): Promise<{ data: T; meta?: ApiMeta }> {
  const method = options.method ?? 'GET';
  const headers: Record<string, string> = { ...(options.headers ?? {}) };

  if (options.body !== undefined && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (options.auth !== false) {
    const token = tokenStore.get();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    credentials: 'include',
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 401 && options.auth !== false) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return apiFetchWithMeta<T>(url, options);
    }
    tokenStore.clear();
    notifyAuthFailure();
  }

  const payload = await readEnvelope<T>(res);

  if (!res.ok || !payload.success) {
    throw new ApiError(
      res.status,
      payload.error?.code ?? 'UNKNOWN_ERROR',
      payload.error?.message ?? `Lỗi ${res.status}`,
      payload.error?.details,
    );
  }

  return { data: payload.data, meta: payload.meta };
}

export function clearSession(): void {
  tokenStore.clear();
  try {
    localStorage.removeItem('henzo_auth_user');
    sessionStorage.removeItem('henzo_auth_user');
    localStorage.removeItem('henzo_auth_token');
    sessionStorage.removeItem('henzo_auth_token');
  } catch {void 0; 
      }
}

export interface UploadedFileInfo {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

export async function apiUpload<T>(
  url: string,
  files: File[] | File,
  fieldName = 'file',
  retry = true,
): Promise<T> {
  const list = Array.isArray(files) ? files : [files];
  const form = new FormData();
  for (const file of list) form.append(fieldName, file);

  const headers: Record<string, string> = {};

  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: form,
  });

  if (res.status === 401 && retry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return apiUpload<T>(url, list, fieldName, false);
    }
    tokenStore.clear();
    notifyAuthFailure();
  }

  const payload = await readEnvelope<T>(res);

  if (!res.ok || !payload.success) {
    throw new ApiError(
      res.status,
      payload.error?.code ?? 'UPLOAD_FAILED',
      payload.error?.message ?? `Tải lên thất bại (${res.status})`,
      payload.error?.details,
    );
  }

  return payload.data;
}
