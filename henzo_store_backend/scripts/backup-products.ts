import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { connectDB, disconnectDB } from '../src/server/db';
import { ProductModel } from '../src/server/models/Product';

async function main() {
  await connectDB();
  const docs = await ProductModel.find({}).lean();
  const out = resolve(process.cwd(), 'scripts/data/products-backup.json');
  writeFileSync(
    out,
    JSON.stringify(
      docs.map((d: any) => ({
        _id: String(d._id),
        name: d.name,
        slug: d.slug,
        categoryName: d.categoryName,
        brand: d.brand,
        images: d.images,
      })),
      null,
      2,
    ),
    'utf-8',
  );
  console.log(`[backup] Đã lưu ${docs.length} sản phẩm -> ${out}`);
  await disconnectDB();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
