/**
 * THAY ẢNH ĐỘNG VẬT / SAI LOẠI trong DB bằng ảnh đúng loại từ pool đã lọc.
 */
import { connectDB, disconnectDB } from '../../src/server/db';
import { ProductModel } from '../../src/server/models/Product';
import { modelName } from '../../lib/model-name';
import { modelType } from '../../lib/model-type';
import { isWrongType } from '../../lib/image-type';
import { fileNameFromUrl } from '../../lib/image-match';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const pools = JSON.parse(
  readFileSync(resolve(process.cwd(), 'scripts/data/type-image-pools.json'), 'utf-8'),
) as Record<string, string[]>;

await connectDB();
const products = await ProductModel.find({}).select('name images brand categoryName').lean();

const byModel = new Map<string, any[]>();
const meta = new Map<string, { brand: string; type: string }>();
for (const p of products) {
  const m = modelName(String(p.name ?? ''));
  if (!m) continue;
  const arr = byModel.get(m) ?? [];
  arr.push(p);
  byModel.set(m, arr);
  if (!meta.has(m)) {
    meta.set(m, {
      brand: String(p.brand ?? ''),
      type: modelType(String(p.name ?? ''), String(p.categoryName ?? '')),
    });
  }
}

const primaryOwner = new Map<string, string>();
for (const [model, list] of byModel) {
  const main = String(list[0].images?.[0] ?? '');
  if (main) primaryOwner.set(main, model);
}

/** Ảnh pool nào đã dùng làm ảnh chính. */
const poolUsed = new Set(primaryOwner.keys());

let fixed = 0;
let unresolved = 0;

for (const [model, list] of byModel) {
  const m = meta.get(model)!;
  const imgs = list[0].images.map(String);
  const main = imgs[0];
  if (!main || !isWrongType(main, m.type)) continue;

  const pool = pools[m.type] ?? [];
  const replacement = pool.find((u) => !poolUsed.has(u));
  if (!replacement) {
    unresolved++;
    console.log(`  ✗ ${model} [${m.type}]`);
    continue;
  }
  poolUsed.add(replacement);

  for (const p of list) {
    const old = p.images.map(String);
    const merged = [
      replacement,
      ...old.filter((u) => fileNameFromUrl(u) !== fileNameFromUrl(replacement)),
    ];
    await ProductModel.updateOne(
      { _id: p._id },
      { $set: { images: merged.slice(0, 8) } },
    );
  }
  fixed++;
  console.log(`  ✅ ${model} [${m.type}] -> ${fileNameFromUrl(replacement).slice(0, 55)}`);
}

console.log(`\nĐã thay ${fixed} | còn ${unresolved}`);

await disconnectDB();
