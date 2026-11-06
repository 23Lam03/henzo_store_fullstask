/**
 * Trích danh sách model (base key) chưa có trong bảng spec.
 * Ghi ra scripts/data/missing-spec-keys.json
 */
import { writeFileSync } from 'fs';
import { resolve } from 'path';
import { connectDB, disconnectDB } from '../src/server/db';
import { ProductModel } from '../src/server/models/Product';
import { specModelKey } from '../../henzo_store/src/data/modelSpecs';

async function main() {
  await connectDB();
  const products = await ProductModel.find({}).select('name categoryName brand');
  const map = new Map<string, { category: string; brand: string; count: number; samples: string[] }>();

  for (const p of products) {
    const name = String(p.name);
    const key = specModelKey(name);
    const cur = map.get(key);
    if (!cur) {
      map.set(key, {
        category: String(p.categoryName || ''),
        brand: String(p.brand || ''),
        count: 1,
        samples: [name],
      });
    } else {
      cur.count++;
      if (cur.samples.length < 3) cur.samples.push(name);
    }
  }

  const out = [...map.entries()].map(([key, v]) => ({ key, ...v }));
  writeFileSync(
    resolve(process.cwd(), 'scripts/data/missing-spec-keys.json'),
    JSON.stringify(out, null, 2),
  );
  console.log(`Tổng model khác nhau: ${out.length}`);
  await disconnectDB();
}
main().catch((e) => { console.error(e); process.exit(1); });
