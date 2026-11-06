import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { withErrorHandling } from '@/server/http/handler';
import { fail } from '@/server/http/response';
import {
  getCachedImage,
  isProxyableImageUrl,
} from '@/server/services/image-proxy.service';

export const Route = createFileRoute('/api/image')({
  server: {
    middleware: [corsMiddleware],
    handlers: {
      GET: withErrorHandling(async ({ request }) => {
        const url = new URL(request.url);
        const target = url.searchParams.get('url');

        if (!target) {
          return fail('Thiếu tham số url', 400, 'BAD_REQUEST');
        }
        if (!isProxyableImageUrl(target)) {
          return fail('URL ảnh không hợp lệ', 400, 'BAD_REQUEST');
        }

        try {
          const { body, contentType, fetched } = await getCachedImage(target);
          return new Response(body.buffer as ArrayBuffer, {
            status: 200,
            headers: {
              'Content-Type': contentType,
              'Content-Length': String(body.byteLength),

              'Cache-Control': 'public, max-age=2592000, immutable',
              'X-Image-Cache': fetched ? 'MISS' : 'HIT',
              'Access-Control-Allow-Origin': '*',
            },
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Lỗi tải ảnh';
          return fail(`Không tải được ảnh: ${message}`, 502, 'BAD_GATEWAY');
        }
      }),
    },
  },
});
