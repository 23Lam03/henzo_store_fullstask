import { connectDB, disconnectDB } from '../src/server/db';
import { ProductModel } from '../src/server/models/Product';

const TIMEOUT = 15_000;

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
  const docs = await ProductModel.find({}).lean();

  const curated = (docs as any[]).filter(
    (d) => !/^product-\d+-/.test(String(d.slug ?? '')),
  );
  const urls = new Set<string>();
  for (const d of curated) {
    for (const u of (d.images ?? []) as string[]) urls.add(u);
  }
  const list = [...urls];
  console.log(`[curated] ${curated.length} sản phẩm, ${list.length} URL duy nhất`);

  const results: Array<{ url: string; status: number; usedBy: string[] }> = [];
  for (const url of list) {
    const status = await checkUrl(url);
    const usedBy = curated
      .filter((d) => ((d.images ?? []) as string[]).includes(url))
      .map((d) => d.name);
    results.push({ url, status, usedBy });
  }

  const dead = results.filter((r) => r.status !== 200);
  const alive = results.filter((r) => r.status === 200);

  console.log(`[curated] SỐNG: ${alive.length} | CHẾT: ${dead.length}\n`);

  console.log('── ẢNH CHẾT ──');
  for (const r of dead) {
    console.log(`  ✗ [${r.status}] ${r.url}`);
    console.log(`      dùng cho ${r.usedBy.length} sp: ${r.usedBy.slice(0, 4).join(' | ')}`);
  }

  console.log('\n── ẢNH SỐNG (theo nhóm sản phẩm) ──');
  for (const r of alive) {
    console.log(`  ✓ ${r.url.split('/').pop()?.split('?')[0]}  (${r.usedBy.length} sp)`);
  }

  await disconnectDB();
}

main().catch((e) => {
  console.error('ERROR:', e);
  process.exit(1);
});
