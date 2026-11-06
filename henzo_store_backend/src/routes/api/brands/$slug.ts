import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { withErrorHandling } from '@/server/http/handler';
import { ok } from '@/server/http/response';
import { notFound } from '@/server/http/errors';
import { BrandModel, toBrandDto } from '@/server/models/Brand';
import { connectDB } from '@/server/db';

export const Route = createFileRoute('/api/brands/$slug')({
  server: {
    middleware: [corsMiddleware],
    handlers: {
      GET: withErrorHandling(async ({ params }) => {
        await connectDB();

        const brand =
          (await BrandModel.findOne({ slug: params.slug }).lean()) ??
          (await BrandModel.findById(params.slug).lean());

        if (!brand) throw notFound('Không tìm thấy thương hiệu');

        return ok(toBrandDto(brand));
      }),
    },
  },
});
