import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { withErrorHandling } from '@/server/http/handler';
import { ok } from '@/server/http/response';
import { BrandModel, toBrandDto } from '@/server/models/Brand';
import { connectDB } from '@/server/db';

export const Route = createFileRoute('/api/brands/')({
  server: {
    middleware: [corsMiddleware],
    handlers: {
      GET: withErrorHandling(async () => {
        await connectDB();
        const brands = await BrandModel.find().sort({ name: 1 }).lean();
        return ok(brands.map(toBrandDto));
      }),
    },
  },
});
