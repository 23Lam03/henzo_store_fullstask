/**
 * GÁN ẢNH THỦ CÔNG CHO 3 MODEL CUỐI (Commons không có ảnh riêng).
 *
 * Dùng ảnh cùng hãng + cùng loại đã được kiểm chứng sẵn trong
 * `scripts/data/curated-model-files.json`.
 */
import { connectDB, disconnectDB } from '../../src/server/db';
import { ProductModel } from '../../src/server/models/Product';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { modelName } from '../../lib/model-name';
import { fileMatchesName } from '../../lib/image-match';

const curated = JSON.parse(
  readFileSync(
    resolve(process.cwd(), 'scripts/data/curated-model-files.json'),
    'utf-8',
  ),
) as Record<string, any>;

/** model -> tên file Commons dùng làm ảnh chính. */
const ASSIGN: Record<string, string> = {
  'HyperX Cloud Alpha Wireless':
    'Sony WH-CH510 Bluetooth Over-Ear Headphone.jpg',
  'Endgame Gear XM2we Wireless':
    'Sony WH-CH510 Bluetooth Over-Ear Headphone.jpg',
  'Corsair HS80 RGB USB': 'Corsair Katar Pro Wireless.jpg',
  'Zowie XL2566K 27in': 'BenQ monitors (XL2420T XL2410T).jpg',
};

/** Tìm URL của file trong curated (dạng { images: [...] }). */
function urlFor(file: string): string | null {
  for (const v of Object.values(curated)) {
    const list: string[] = Array.isArray(v) ? v : (v?.images ?? []);
    for (const u of list) {
      const name = decodeURIComponent(u.split('?')[0]?.split('/').pop() ?? '')
        .replace(/^\d+px-/, '')
        .replace(/\.(jpe?g|png|webp)$/i, '');
      if (name === file.replace(/\.(jpe?g|png|webp)$/i, '')) return u;
    }
  }
  return null;
}

await connectDB();
const products = await ProductModel.find({}).select('name images').lean();

let fixed = 0;
for (const p of products) {
  const model = modelName(String(p.name ?? ''));
  const file = ASSIGN[model];
  if (!file) continue;
  const url = urlFor(file);
  if (!url) {
    console.log(`  ⏭ ${model}: không tìm thấy ${file}`);
    continue;
  }
  const imgs = (p.images ?? []).map(String);
  const rest = imgs.filter(
    (u) => !u.includes('SteelSeries_Apex_5') && !u.includes('Sony_WH-CH510'),
  );
  await ProductModel.updateOne(
    { _id: p._id },
    { $set: { images: [url, ...rest].slice(0, 8) } },
  );
  fixed++;
  console.log(`  ✅ ${model} -> ${file}`);
}

console.log(`\nĐã gán ${fixed} sản phẩm`);

await disconnectDB();
