import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

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

function isFakeId(url: string): boolean {
  const slug = url.split('?')[0].split('/photo-')[1] ?? '';
  return slug.length < 20;
}

async function main() {
  const mock = JSON.parse(
    readFileSync(
      resolve(process.cwd(), 'scripts/data/frontend-mock.json'),
      'utf-8',
    ),
  );

  const all: Array<{ url: string; name: string }> = [];
  for (const p of mock.products ?? []) {
    for (const u of p.images ?? []) all.push({ url: u, name: p.name });
  }
  for (const p of mock.sellerProducts ?? []) {
    for (const u of p.images ?? []) all.push({ url: u, name: p.name });
  }
  for (const b of mock.blogs ?? []) {
    if (b.thumbnail) all.push({ url: b.thumbnail, name: b.title });
  }
  for (const c of mock.categories ?? []) {
    if (c.banner) all.push({ url: c.banner, name: `category:${c.name}` });
  }

  const fake = all.filter((x) => isFakeId(x.url));
  const unique = [...new Map(all.filter((x) => !isFakeId(x.url)).map((x) => [x.url, x])).values()];

  console.log(`[mock] Tổng ${all.length} ảnh | ${unique.length} URL duy nhất`);
  console.log(`[mock] Ảnh giả (URL không tồn tại): ${fake.length}`);

  const dead: string[] = [];
  const alive: string[] = [];
  let idx = 0;
  async function worker() {
    while (idx < unique.length) {
      const u = unique[idx++].url;
      const status = await checkUrl(u);
      if (status === 200) alive.push(u);
      else dead.push(u);
    }
  }
  await Promise.all(Array.from({ length: 10 }, worker));

  console.log(`[mock] SỐNG: ${alive.length} | CHẾT: ${dead.length}`);
  if (dead.length) {
    console.log('\nẢNH CHẾT:');
    for (const u of dead.slice(0, 20)) {
      const users = all.filter((x) => x.url === u).slice(0, 3);
      console.log(`  ✗ ${u}`);
      console.log(`      ${users.map((x) => x.name).join(' | ')}`);
    }
  }
  if (fake.length) {
    console.log('\nẢNH GIẢ (mẫu):');
    for (const x of fake.slice(0, 5)) console.log(`  ✗ ${x.url}  (${x.name})`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
