import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { connectDB, disconnectDB } from '../src/server/db';
import { ProductModel } from '../src/server/models/Product';

async function main() {
  await connectDB();
  const backup = JSON.parse(
    readFileSync(
      resolve(process.cwd(), 'scripts/data/products-backup.json'),
      'utf-8',
    ),
  );

  let restored = 0;
  for (const p of backup as any[]) {
    await ProductModel.updateOne(
      { _id: p._id },
      {
        $set: {
          name: p.name,
          slug: p.slug,
          categoryName: p.categoryName,
          brand: p.brand,
          images: p.images ?? [],
        },
      },
    );
    restored++;
  }

  console.log(`[restore] Đã khôi phục ${restored} sản phẩm`);
  await disconnectDB();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
