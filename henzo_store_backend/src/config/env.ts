import { z } from 'zod';
import { loadEnvFiles } from './load-env.ts';

loadEnvFiles();

function emptyToUndefined(value: unknown): unknown {
  return typeof value === 'string' && value.trim() === '' ? undefined : value;
}

function isRender(): boolean {
  return Boolean(process.env.RENDER) || process.env.NODE_ENV === 'production';
}

const envSchema = z.object({
  MONGODB_URI: z.string().min(1, 'Thiếu MONGODB_URI'),
  PORT: z.coerce.number().default(4000),
    NODE_ENV: z.preprocess(
    (value) =>

      value === undefined && isRender() ? 'production' : value,
    z.enum(['development', 'production', 'test']).default('development'),
  ),

  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET phải có ít nhất 16 ký tự'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET phải có ít nhất 16 ký tự'),
  JWT_ACCESS_EXPIRES: z.string().default('15m'),
  JWT_REFRESH_EXPIRES: z.string().default('7d'),

  COOKIE_NAME: z.string().default('henzo_refresh_token'),
  COOKIE_DOMAIN: z.string().optional(),
    COOKIE_SECURE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true')
    .transform((v) => (v ? true : isRender())),
    COOKIE_SAME_SITE: z
    .enum(['Lax', 'Strict', 'None'])
    .default('Lax')
    .transform((v) => (isRender() ? 'None' : v)),

  CORS_ORIGINS: z.string().default('http://localhost:5173,http://localhost:3000'),

    UPLOAD_DIR: z.string().default('storage/uploads'),
    UPLOAD_MAX_SIZE: z.coerce.number().int().positive().default(5 * 1024 * 1024),
    UPLOAD_PUBLIC_PATH: z.string().default('/api/uploads'),
    UPLOAD_STORE: z.preprocess(
    emptyToUndefined,
    z.enum(['mongo', 'disk']).optional(),
  ),

    IMAGE_CACHE_DIR: z.string().default('storage/image-cache'),
});

function buildCorsOrigins(raw: string): string[] {
  const list = raw
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  for (const key of ['RENDER_EXTERNAL_URL', 'RENDER_EXTERNAL_HOSTNAME']) {
    const value = process.env[key];
    if (!value) continue;
    const origin = value.startsWith('http') ? value : `https://${value}`;
    if (!list.includes(origin)) list.push(origin);
  }

  return list;
}

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
    .join('\n');
  console.error(`\n[CONFIG] Cấu hình môi trường không hợp lệ:\n${issues}\n`);
  console.error('Hãy kiểm tra file .env hoặc .env.example\n');
  process.exit(1);
}

export const config = {
  ...parsed.data,
  isProd: parsed.data.NODE_ENV === 'production',
  corsOrigins: buildCorsOrigins(parsed.data.CORS_ORIGINS),
};

export type Config = typeof config;
