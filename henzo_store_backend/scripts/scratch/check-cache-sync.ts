import { connectDB, disconnectDB } from '../../src/server/db';
import { ProductModel } from '../../src/server/models/Product';
import { PromotionModel } from '../../src/server/models/Promotion';
import { createHash } from 'node:crypto';
import { readdirSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.cwd(), 'storage/image-cache');
const cached = new Set(readdirSync(root).map((f) => f.replace(/\.\w+$/, '')));

const key = (u: string) =>
  createHash('sha256').update(u.split('?')[0]).digest('hex');

await connectDB();

const products = await ProductModel.find({}).select('name images').lean();
const promos = await PromotionModel.find({}).select('title image').lean();

let total = 0;
let miss = 0;
const missing: string[] = [];

for (const p of products) {
  for (const img of p.images ?? []) {
    const u = String(img);
    if (!/wikimedia\.org/.test(u)) continue;
    total++;
    if (!cached.has(key(u))) {
      miss++;
      if (missing.length < 10) missing.push(`${p.name} :: ${u.slice(0, 100)}`);
    }
  }
}
for (const pr of promos) {
  const u = String(pr.image ?? '');
  if (!u || !/wikimedia\.org/.test(u)) continue;
  total++;
  if (!cached.has(key(u))) {
    miss++;
    if (missing.length < 10) missing.push(`${pr.title} :: ${u.slice(0, 100)}`);
  }
}

console.log(`Tổng URL Wikimedia đang dùng: ${total}`);
console.log(`Chưa có trong cache: ${miss}`);
console.log(`Cache hiện có: ${cached.size} file`);
if (missing.length) console.log('Ví dụ thiếu:\n' + missing.join('\n'));

await disconnectDB();
