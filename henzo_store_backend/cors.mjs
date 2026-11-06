
const corsOrigins = (() => {
  const list = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  for (const key of ['RENDER_EXTERNAL_URL', 'RENDER_EXTERNAL_HOSTNAME']) {
    const value = process.env[key];
    if (!value) continue;
    const origin = value.startsWith('http') ? value : `https://${value}`;
    if (!list.includes(origin)) list.push(origin);
  }

  return list;
})();

function resolveOrigin(requestOrigin) {
  if (!corsOrigins.length) return requestOrigin ?? null;
  if (requestOrigin && corsOrigins.includes(requestOrigin)) return requestOrigin;
  return corsOrigins[0] ?? null;
}

export { corsOrigins, resolveOrigin };
