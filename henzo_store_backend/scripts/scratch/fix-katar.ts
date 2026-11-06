import { connectDB, disconnectDB } from '../../src/server/db';
import { ProductModel } from '../../src/server/models/Product';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const pools = JSON.parse(
  readFileSync(resolve(process.cwd(), 'scripts/data/type-image-pools.json'), 'utf-8'),
) as Record<string, string[]>;

await connectDB();
const ps = await ProductModel.find({ name: /Katar Pro XT/i }).select('name images').lean();
const used = new Set<string>();
const all = await ProductModel.find({}).select('images').lean();
for (const p of all) for (const u of (p.images ?? []).map(String)) used.add(u);

for (const p of ps) {
  const imgs = (p.images ?? []).map(String);
  const pool = pools['Chuột'] ?? [];
  const free = pool.find((u) => !used.has(u));
  if (!free) { console.log('không có ảnh dự phòng'); continue; }
  used.add(free);
  await ProductModel.updateOne({ _id: p._id }, { $set: { images: [...imgs, free].slice(0, 8) } });
  console.log('✅', p.name, '->', free.split('/').pop()?.slice(0, 50));
}
await disconnectDB();
