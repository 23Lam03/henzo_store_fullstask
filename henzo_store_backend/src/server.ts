import {
  createStartHandler,
  defaultStreamHandler,
  createServerEntry as createCoreServerEntry,
} from '@tanstack/react-start/server';
import type { Register } from '@tanstack/react-router';
import type { RequestHandler } from '@tanstack/react-start/server';

const startHandler = createStartHandler(defaultStreamHandler);

/**
 * Khi client đóng socket giữa chừng (đóng tab, huỷ request, đổi trang),
 * Node hủy request với lỗi ECONNRESET / message "aborted". Đây là hành vi
 * bình thường, nhưng nếu để lỗi nổi lên, TanStack Start gọi `handleStartError`
 * -> `resolveErrorStatus` -> `console.error(error)`, in ra cả stack trace đầy
 * đủ trông giống server crash.
 *
 * Ở đây ta nuốt lỗi loại này và trả response rỗng. Client đã biến mất nên
 * response cũng không tới đâu, nhưng quan trọng là log không bị nhiễu.
 *
 * Mọi lỗi khác vẫn được ném lên để error handler chuẩn của framework xử lý.
 */
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
