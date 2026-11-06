import { connectDB, disconnectDB } from '../src/server/db';
import { ProductModel } from '../src/server/models/Product';
import { CATEGORY_IMAGES } from '../src/server/data/product-images';

async function main() {
  await connectDB();
  const docs = await ProductModel.find({}).lean();
  const img2cat: Record<string, string> = {};
  for (const [c, l] of Object.entries(CATEGORY_IMAGES))
    for (const u of l) img2cat[u] = c;
  let mismatch = 0;
  const samples: unknown[] = [];
  for (const d of docs as any[]) {
    const cat = String(d.categoryName ?? '');
    const imgs = (d.images ?? []) as string[];
    const pool = CATEGORY_IMAGES[cat] ?? [];
    const ok = imgs.length > 0 && imgs.every((u) => pool.includes(u));
    if (!ok) {
      mismatch++;
      if (samples.length < 15)
        samples.push({
          name: d.name,
          cat,
          imgCats: [...new Set(imgs.map((u) => img2cat[u] ?? '??'))],
          img: imgs[0],
        });
    }
  }
  console.log('tong', docs.length, ' sai danh-muc-anh:', mismatch);
  console.log(JSON.stringify(samples, null, 1));
  await disconnectDB();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
