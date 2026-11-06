import { connectDB, disconnectDB } from '../src/server/db';
import { ProductModel } from '../src/server/models/Product';
import {
  inferBrand,
  inferCategory,
} from '../src/server/data/product-classify';

const SUSPECTS = [
  'MagicPad',
  'Xiaomi Pad',
  'iPhone 16e',
  'TECNO',
  'HONOR',
  'Nokia',
  'OnePlus',
  'Poco F6',
  'Realme GT',
  'ROG Phone',
  'ThinkBook',
  'MateBook',
  'Gram 17',
  'Aspire',
  'Gaming Buds',
  'Watch',
];

async function main() {
  await connectDB();
  const docs = (await ProductModel.find({}).select('name categoryName brand images').lean()) as any[];
  console.log('TOTAL:', docs.length);
  const bad: any[] = [];
  for (const d of docs) {
    const cat = inferCategory(d.name);
    const br = inferBrand(d.name);
    if (cat !== d.categoryName || br !== d.brand) {
      bad.push({ name: d.name, dbCat: d.categoryName, infCat: cat, dbBrand: d.brand, infBrand: br });
    }
  }
  console.log('MISMATCH classify-vs-db:', bad.length);
  for (const b of bad.slice(0, 40)) console.log(JSON.stringify(b));
  console.log('--- suspects ---');
  for (const s of SUSPECTS) {
    const hits = docs.filter((d) => String(d.name).toLowerCase().includes(s.toLowerCase()));
    for (const h of hits.slice(0, 6)) {
      console.log(
        `${h.name} | dbCat=${h.categoryName} infCat=${inferCategory(h.name)} | dbBrand=${h.brand} infBrand=${inferBrand(h.name)} | img=${(h.images ?? [])[0]}`,
      );
    }
  }
  await disconnectDB();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
