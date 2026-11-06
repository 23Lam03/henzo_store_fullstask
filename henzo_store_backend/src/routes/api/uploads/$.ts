import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { withErrorHandling } from '@/server/http/handler';
import { fail } from '@/server/http/response';
import { readUploadedImage } from '@/server/services/upload.service';

/**
 * Phục vụ file ảnh đã tải lên.
 *
 * Đường dẫn: `/api/uploads/<tên-file>` → trả về binary với đúng
 * `Content-Type` để trình duyệt hiển thị đúng (JPEG/PNG/WEBP…).
 *
 * Nguồn dữ liệu: MongoDB (`UploadedImage`) trước, đĩa sau — để ảnh không
 * mất khi Render restart (disk là ephemeral).
 */
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
