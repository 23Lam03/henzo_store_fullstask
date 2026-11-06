import { connectDB, disconnectDB } from '../../src/server/db';
import { ProductModel } from '../../src/server/models/Product';
import { modelName } from '../../lib/model-name';
import {
  fileMatchesName,
  fileNameFromUrl,
  normalizeFileTitle,
} from '../../lib/image-match';

await connectDB();
const products = await ProductModel.find({}).select('name images brand').lean();

const stats = { exact: 0, brandOnly: 0, unrelated: 0 };
const rows: string[] = [];

for (const p of products) {
  const imgs = (p.images ?? []).map(String);
  if (!imgs.length) continue;
  const name = String(p.name ?? '');
  const brand = String(p.brand ?? '');
  const model = modelName(name);
  const main = imgs[0];

  if (fileMatchesName(model, main)) stats.exact++;
  else if (fileMatchesName(brand, main)) {
    stats.brandOnly++;
    rows.push(`${name}\n     -> ${normalizeFileTitle(fileNameFromUrl(main)).slice(0, 80)}`);
  } else {
    stats.unrelated++;
    rows.push(
      `[KHÁC HÃNG] ${name}\n     -> ${normalizeFileTitle(fileNameFromUrl(main)).slice(0, 80)}`,
    );
  }
}

console.log(`Tổng: ${products.length}`);
console.log(`✅ Ảnh khớp đúng model: ${stats.exact}`);
console.log(`🟡 Ảnh đúng hãng/series (anh em cùng dòng): ${stats.brandOnly}`);
console.log(`🔴 Ảnh không liên quan hãng: ${stats.unrelated}`);
console.log('\n--- Danh sách 🟡 + 🔴 ---');
rows.forEach((r) => console.log(`  - ${r}`));

await disconnectDB();
