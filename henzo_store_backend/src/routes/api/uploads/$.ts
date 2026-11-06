import { createFileRoute } from '@tanstack/react-router';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { corsMiddleware } from '@/server/middleware/cors';
import { withErrorHandling } from '@/server/http/handler';
import { fail } from '@/server/http/response';
import { resolveUploadPath } from '@/server/services/upload.service';

/**
 * Phục vụ file ảnh đã tải lên.
 *
 * Đường dẫn: `/api/uploads/<tên-file>` → trả về binary với đúng
 * `Content-Type` để trình duyệt hiển thị đúng (JPEG/PNG/WEBP…).
 */
export const Route = createFileRoute('/api/uploads/$')({
  server: {
    middleware: [corsMiddleware],
    handlers: {
      GET: withErrorHandling(async ({ params }) => {
        const filename = params._splat ?? '';
        const filePath = resolveUploadPath(filename);

        if (!filePath || !existsSync(filePath)) {
          return fail('Không tìm thấy ảnh', 404, 'NOT_FOUND');
        }

        const buffer = await readFile(filePath);
        const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase();

        const MIME: Record<string, string> = {
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.png': 'image/png',
          '.webp': 'image/webp',
          '.gif': 'image/gif',
          '.avif': 'image/avif',
        };

        return new Response(new Uint8Array(buffer), {
          status: 200,
          headers: {
            'Content-Type': MIME[ext] ?? 'application/octet-stream',
            'Content-Length': String(buffer.byteLength),
            'Cache-Control': 'public, max-age=31536000, immutable',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }),
    },
  },
});
