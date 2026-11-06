import { connectDB, disconnectDB } from '../src/server/db';
import { ProductModel } from '../src/server/models/Product';

const TIMEOUT = 10_000;

async function checkUrl(url: string): Promise<number> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT);
  try {
    let res = await fetch(url, { method: 'HEAD', signal: ctrl.signal });
    if (res.status === 405 || res.status === 501) {
      res = await fetch(url, { method: 'GET', signal: ctrl.signal });
    }
    return res.status;
  } catch {
    return -1;
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  await connectDB();
  const docs = await ProductModel.find({}, { images: 1, name: 1, slug: 1 }).lean();

  const urlMap = new Map<string, { count: number; products: string[] }>();
  for (const d of docs as any[]) {
    for (const u of (d.images ?? []) as string[]) {
      const entry = urlMap.get(u) ?? { count: 0, products: [] };
      entry.count++;
      if (entry.products.length < 3) entry.products.push(d.name);
      urlMap.set(u, entry);
    }
  }

  const urls = [...urlMap.keys()];
  console.log(`[check] ${urls.length} URL duy nhất / ${docs.length} sản phẩm`);

  const dead: string[] = [];
  const alive: string[] = [];
  const errors: string[] = [];

  const CONCURRENCY = 10;
  let idx = 0;
  async function worker() {
    while (idx < urls.length) {
      const url = urls[idx++];
      const status = await checkUrl(url);
      if (status === 200) alive.push(url);
      else if (status === -1) errors.push(url);
      else dead.push(url);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  console.log(`[check] SỐNG (200)   : ${alive.length}`);
  console.log(`[check] CHẾT (4xx/5xx): ${dead.length}`);
  console.log(`[check] LỖI mạng      : ${errors.length}`);

  const deadSet = new Set(dead);
  const errorSet = new Set(errors);
  const affected = (docs as any[]).filter((d) =>
    ((d.images ?? []) as string[]).some((u) => deadSet.has(u) || errorSet.has(u)),
  );
  console.log(`[check] Sản phẩm bị ảnh chết: ${affected.length} / ${docs.length}`);

  console.log('\n[check] ẢNH SỐNG (mẫu 25):');
  for (const u of alive.slice(0, 25)) {
    const e = urlMap.get(u)!;
    console.log(`  ✓ ${u}\n      dùng cho: ${e.products.join(' | ')}`);
  }

  console.log('\n[check] ẢNH CHẾT (mẫu 10):');
  for (const u of dead.slice(0, 10)) {
    console.log(`  ✗ ${u}`);
  }

  await disconnectDB();
}

main().catch((e) => {
  console.error('ERROR:', e);
  process.exit(1);
});
