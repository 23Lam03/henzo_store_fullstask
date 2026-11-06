import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { requireAuth } from '@/server/middleware/auth';
import { requireStoreOwner } from '@/server/middleware/store';
import { withErrorHandling } from '@/server/http/handler';
import { ok } from '@/server/http/response';
import { badRequest } from '@/server/http/errors';
import { saveUploadedImage } from '@/server/services/upload.service';

export const Route = createFileRoute('/api/seller/uploads')({
  server: {
    middleware: [corsMiddleware, requireAuth, requireStoreOwner],
    handlers: {
      POST: withErrorHandling(async ({ request }) => {
        const contentType = request.headers.get('content-type') ?? '';
        if (!contentType.includes('multipart/form-data')) {
          throw badRequest(
            'Yêu cầu phải là multipart/form-data khi tải ảnh lên.',
          );
        }

        let form: FormData;
        try {
          form = await request.formData();
        } catch {
          throw badRequest('Không đọc được dữ liệu tải lên.');
        }

        const files = form.getAll('file').filter(f => f instanceof File);
        if (files.length === 0) {
          throw badRequest('Không tìm thấy file ảnh nào trong yêu cầu.');
        }

        const uploaded = [];
        for (const file of files) {
          uploaded.push(await saveUploadedImage(file));
        }

        return ok({
          files: uploaded.map(f => ({
            url: f.url,
            filename: f.filename,
            size: f.size,
            mimeType: f.mimeType,
          })),
        });
      }),
    },
  },
});
