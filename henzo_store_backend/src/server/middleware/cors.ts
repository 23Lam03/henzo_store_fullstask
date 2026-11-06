import { createMiddleware } from '@tanstack/react-start';
import { config } from '../../config/env';

function extractResponse(result: unknown): Response | undefined {
  if (!result) return undefined;
  if (result instanceof Response) return result;
  const maybe = result as { response?: unknown; result?: unknown };
  if (maybe.response instanceof Response) return maybe.response;
  if (maybe.result instanceof Response) return maybe.result;
  return undefined;
}

export const corsMiddleware = createMiddleware().server(async ({ next, request }) => {
  const origin = request.headers.get('origin');
  const allowed = Boolean(origin && config.corsOrigins.includes(origin));

  const headers: Record<string, string> = {};

  if (allowed && origin) {

    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Credentials'] = 'true';
    headers['Vary'] = 'Origin';
  }
  headers['Access-Control-Allow-Methods'] =
    'GET,POST,PUT,PATCH,DELETE,OPTIONS';
  headers['Access-Control-Max-Age'] = '86400';

  if (request.method === 'OPTIONS') {

    const requested = request.headers.get('access-control-request-headers');
    headers['Access-Control-Allow-Headers'] =
      requested ?? 'Content-Type,Authorization,X-Requested-With';

    return new Response(null, { status: 204, headers });
  }

  const result = await next();
  const response = extractResponse(result);

  if (!response) return result;

  const finalHeaders = new Headers(response.headers);
  for (const [k, v] of Object.entries(headers)) finalHeaders.set(k, v);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: finalHeaders,
  });
});
