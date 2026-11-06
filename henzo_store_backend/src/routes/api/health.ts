import { createFileRoute } from '@tanstack/react-router';
import { corsMiddleware } from '@/server/middleware/cors';
import { ok } from '@/server/http/response';
import { connectDB } from '@/server/db';

export const Route = createFileRoute('/api/health')({
  server: {
    middleware: [corsMiddleware],
    handlers: {
      GET: async () => {
        let dbStatus = 'disconnected';
        try {
          await connectDB();
          dbStatus = 'connected';
        } catch {
          dbStatus = 'error';
        }

        return ok({
          status: dbStatus === 'connected' ? 'ok' : 'degraded',
          service: 'henzo-store-api',
          database: dbStatus,
          timestamp: new Date().toISOString(),
          uptime: Math.round(process.uptime()),
        });
      },
    },
  },
});
