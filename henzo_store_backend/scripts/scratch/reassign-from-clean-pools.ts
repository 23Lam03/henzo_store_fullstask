/**
 * GÁN LẠI ẢNH CHO MODEL ĐANG THIẾU ẢNH HOẶC SAI LOẠI.
 *
 * Dùng pool sạch theo LOẠI (scripts/data/type-image-pools.json) — mỗi ảnh
 * trong pool đã được kiểm chứng là đúng loại (không phải ảnh chuột cho
 * bàn phím, ảnh cửa hàng...).
 *
 * Mỗi URL chỉ dùng cho MỘT model để không trùng ảnh giữa các model.
 */
import { connectDB, disconnectDB } from '../../src/server/db';
import { ProductModel } from '../../src/server/models/Product';
import { modelName } from '../../lib/model-name';
import { modelType } from '../../lib/model-type';
import { fileNameFromUrl } from '../../lib/image-match';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const MIN_IMAGES = 3;

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

/** URL đã dùng cho model nào. */
const used = new Map<string, string>();
for (const [model, list] of byModel) {
  for (const p of list) {
    for (const u of (p.images ?? []).map(String)) {
      if (!used.has(u)) used.set(u, model);
    }
  }
}

let fixed = 0;
let stillMissing = 0;

for (const [model, list] of byModel) {
  const have = new Set<string>();
  for (const p of list) for (const u of (p.images ?? []).map(String)) have.add(u);

  if (have.size >= MIN_IMAGES) continue;

  const m = meta.get(model)!;
  const pool = pools[m.type] ?? [];

  // Ưu tiên ảnh trong pool chưa dùng cho model khác.
  const picked = new Set(have);
  for (const u of pool) {
    if (picked.size >= MIN_IMAGES) break;
    const owner = used.get(u);
    if (owner && owner !== model) continue;
    picked.add(u);
  }

  if (picked.size < MIN_IMAGES) {
    stillMissing++;
    console.log(`  ✗ ${model} [${m.type}]: ${picked.size}/${MIN_IMAGES}`);
    continue;
  }

  const arr = [...picked];
  for (const u of arr) used.set(u, model);
  for (const p of list) {
    await ProductModel.updateOne({ _id: p._id }, { $set: { images: arr.slice(0, 8) } });
  }
  fixed++;
  console.log(`  ✅ ${model} [${m.type}]: ${arr.length} ảnh`);
}

console.log(`\nĐã gán lại cho ${fixed} model | còn thiếu ${stillMissing}`);

await disconnectDB();
