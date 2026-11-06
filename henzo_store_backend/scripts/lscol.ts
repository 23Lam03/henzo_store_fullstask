import { connectDB, disconnectDB } from '../src/server/db';
import { ProductModel } from '../src/server/models/Product';
import { modelName } from './lib/model-name';
import { readFileSync } from 'node:fs';

async function main() {
  const mock = JSON.parse(
    readFileSync('scripts/data/frontend-mock.json', 'utf-8'),
  );
  const all = [
    ...(mock.products as any[]),
    ...((mock.sellerProducts ?? []) as any[]),
  ];
  await connectDB();
  const products = (await ProductModel.find({})
    .select('name slug images')
    .lean()) as any[];
  const dbModels = new Set(products.map((p) => modelName(String(p.name ?? ''))));
  const missing: string[] = [];
  const seen = new Set<string>();
  for (const p of all) {
    const m = modelName(p.name);
    if (dbModels.has(m) || seen.has(m)) continue;
    seen.add(m);
    missing.push(`${m}   (${p.name})`);
  }
  console.log('DB models:', dbModels.size);
  console.log('Model trong mock chưa có ảnh/model trong DB:', missing.length);
  console.log(missing.join('\n'));
  await disconnectDB();
}

void main();
