import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { modelName } from '../lib/model-name';

const mock = JSON.parse(
  readFileSync(resolve(process.cwd(), 'scripts/data/frontend-mock.json'), 'utf-8'),
);
const dest = resolve(process.cwd(), 'scripts/data/model-images.json');

const images: Record<string, { images: string[]; source: string; title: string }> =
  existsSync(dest) ? JSON.parse(readFileSync(dest, 'utf-8')) : {};

const all: Array<{ name: string; brand: string; categoryName: string }> = [
  ...(mock.products as any[]),
  ...((mock.sellerProducts ?? []) as any[]),
];

const byModel = new Map<
  string,
  { brand: string; count: number; categoryName: string }
>();
for (const p of all) {
  const m = modelName(p.name);
  const cur = byModel.get(m);
  if (cur) cur.count++;
  else byModel.set(m, { brand: p.brand, count: 1, categoryName: p.categoryName ?? '' });
}

const missing: string[] = [];
const weak: string[] = [];
for (const [m, v] of [...byModel.entries()].sort()) {
  const hit = images[m];
  if (!hit?.images?.length) missing.push(m);
  else if (hit.images.length < 4) weak.push(m);
}

console.log(`Tổng model: ${byModel.size}`);
console.log(`Đã có ảnh: ${byModel.size - missing.length}`);
console.log(`THIẾU ảnh: ${missing.length}`);
console.log(`Có <4 ảnh: ${weak.length}`);
console.log('\n=== THIẾU ẢNH ===');
for (const m of missing) {
  const info = byModel.get(m)!;
  console.log(
    `${m}\t${info.brand}\t${info.categoryName}\t${info.count} sp`,
  );
}
console.log('\n=== ÍT ẢNH (<4) ===');
for (const m of weak) {
  const info = byModel.get(m)!;
  console.log(`${m}\t${info.brand}\t${info.categoryName}\t${images[m].images.length} ảnh\t${images[m].source}`);
}
