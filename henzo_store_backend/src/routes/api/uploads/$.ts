import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { withErrorHandling } from '@/server/http/handler';
import { fail } from '@/server/http/response';
import { readUploadedImage } from '@/server/services/upload.service';

export const Route = createFileRoute('/api/uploads/$')({
  server: {
    middleware: [corsMiddleware],
    handlers: {
      GET: withErrorHandling(async ({ params }) => {
        const filename = params._splat ?? '';
        if (!filename) {
          return fail('Không tìm thấy ảnh', 404, 'NOT_FOUND');
        }

        const found = await readUploadedImage(filename);

        if (!found) {
          return fail('Không tìm thấy ảnh', 404, 'NOT_FOUND');
        }

        return new Response(new Uint8Array(found.data), {
          status: 200,
          headers: {
            'Content-Type': found.mimeType,
            'Content-Length': String(found.data.byteLength),
            'Cache-Control': 'public, max-age=31536000, immutable',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }),
    },
  },
});
