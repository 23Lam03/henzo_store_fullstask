import {
  createStartHandler,
  defaultStreamHandler,
  createServerEntry as createCoreServerEntry,
} from '@tanstack/react-start/server';
import type { Register } from '@tanstack/react-router';
import type { RequestHandler } from '@tanstack/react-start/server';
import { startImageWarmup } from '@/server/services/image-warmup.service';

const startHandler = createStartHandler(defaultStreamHandler);

// Render có disk ephemeral: mỗi lần restart là mất cache ảnh tải về.
// Warm up nền ngay khi module được nạp (không chặn request).
startImageWarmup();

function isAbortedRequest(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const err = error as { code?: string; name?: string; message?: string };
  if (err.code === 'ECONNRESET' || err.code === 'ECONNABORTED') return true;
  if (err.name === 'AbortError') return true;
  return typeof err.message === 'string' && err.message === 'aborted';
}

const fetch: RequestHandler<Register> = async (request, requestOpts) => {
  try {
    return await startHandler(request, requestOpts);
  } catch (error) {
    if (isAbortedRequest(error)) {
      return new Response(null, { status: 499 });
    }
    throw error;
  }
};

export type ServerEntry = { fetch: RequestHandler<Register> };

export const createServerEntry: (entry: ServerEntry) => ServerEntry =
  createCoreServerEntry<Register>;

export default createServerEntry({ fetch });
