import { connectDB, disconnectDB } from '../src/server/db';
import { ProductModel } from '../src/server/models/Product';
import { BrandModel } from '../src/server/models/Brand';

async function main() {
  await connectDB();
  const docs = (await ProductModel.find({})
    .select('name categoryName brand images')
    .lean()) as any[];
  const byUrl = new Map<string, { names: Set<string>; cats: Set<string> }>();
  for (const d of docs) {
    for (const u of (d.images ?? []) as string[]) {
      let e = byUrl.get(u);
      if (!e) {
        e = { names: new Set(), cats: new Set() };
        byUrl.set(u, e);
      }
      e.names.add(String(d.name));
      e.cats.add(String(d.categoryName));
    }
  }
  console.log('UNIQUE_IMG_URLS:', byUrl.size);
  const sorted = [...byUrl.entries()].sort(
    (a, b) => b[1].names.size - a[1].names.size,
  );
  for (const [u, e] of sorted) {
    console.log('---');
    console.log('IMG:', u);
    console.log('CATS:', [...e.cats].join(' | '));
    console.log('COUNT:', e.names.size);
    for (const n of [...e.names].slice(0, 12)) console.log('   -', n);
  }
  console.log('=== BRANDS ===');
  const brands = (await BrandModel.find({}).select('name slug logo').lean()) as any[];
  for (const b of brands) console.log(b.name, '|', b.slug, '|', b.logo);
  await disconnectDB();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
