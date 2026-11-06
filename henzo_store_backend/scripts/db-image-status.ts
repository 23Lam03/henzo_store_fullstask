import { connectDB, disconnectDB } from '../src/server/db';
import { ProductModel } from '../src/server/models/Product';
import { modelName } from './lib/model-name';

async function main() {
  await connectDB();
  const products = (await ProductModel.find({})
    .select('name slug images categoryName')
    .lean()) as any[];
  const byModel = new Map<string, any[]>();
  for (const p of products) {
    const k = modelName(String(p.name ?? ''));
    byModel.set(k, [...(byModel.get(k) ?? []), p]);
  }
  console.log('Tổng sản phẩm DB:', products.length, '| model:', byModel.size);

  const noImg = products.filter((p) => !(p.images ?? []).length);
  console.log('Sản phẩm KHÔNG có ảnh:', noImg.length);
  for (const p of noImg.slice(0, 40)) console.log('  -', p.name);

  const mainCount = new Map<string, number>();
  for (const p of products) {
    const m = (p.images ?? [])[0];
    if (m) mainCount.set(m, (mainCount.get(m) ?? 0) + 1);
  }
  const dupes = [...mainCount.entries()].filter(([, c]) => c > 1);
  console.log(`\nẢnh chính trùng: ${dupes.length} URL (max ${dupes.length ? Math.max(...dupes.map((d) => d[1])) : 0} lần)`);
  const nonCommons = products.filter((p) => !(p.images ?? [])[0]?.includes('wikimedia'));
  console.log('Ảnh chính KHÔNG từ wikimedia:', nonCommons.length);
  for (const p of nonCommons.slice(0, 20)) console.log('  -', p.name, '=>', (p.images ?? [])[0]);
  await disconnectDB();
}

void main();
