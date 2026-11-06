/**
 * LOẠI TRÙNG ẢNH CHÍNH GIỮA CÁC MODEL KHÁC NHAU.
 *
 * Nguyên tắc nghiệp vụ: hai model KHÁC NHAU không được dùng chung ảnh chính
 * (trừ khi chúng là biến thể cấu hình của cùng một thiết bị).
 *
 * Cách sửa: với mỗi ảnh bị dùng chung, tìm ảnh dự phòng cho từng model
 * (từ ảnh phụ sẵn có trong DB, hoặc từ Commons) và gán lại.
 */
import { connectDB, disconnectDB } from '../../src/server/db';
import { ProductModel } from '../../src/server/models/Product';
import { modelName } from '../../lib/model-name';
import { fileMatchesName, fileNameFromUrl } from '../../lib/image-match';
import { findCandidates } from '../../lib/commons-model-search';

await connectDB();
const products = await ProductModel.find({}).select('name images brand').lean();

/** model -> danh sách sản phẩm. */
const byModel = new Map<string, any[]>();
for (const p of products) {
  const m = modelName(String(p.name ?? ''));
  if (!m) continue;
  const arr = byModel.get(m) ?? [];
  arr.push(p);
  byModel.set(m, arr);
}

/** Ảnh chính -> các model dùng chung. */
const primaryOwners = new Map<string, string[]>();
for (const [model, list] of byModel) {
  const main = String(list[0].images?.[0] ?? '');
  if (!main) continue;
  const arr = primaryOwners.get(main) ?? [];
  arr.push(model);
  primaryOwners.set(main, arr);
}

const conflicts = [...primaryOwners.entries()].filter(([, ms]) => ms.length > 1);
console.log(`Ảnh chính bị dùng chung: ${conflicts.length} nhóm`);

let fixed = 0;
let unresolved = 0;

for (const [img, models] of conflicts) {
  // Model giữ nguyên ảnh (đã có ảnh riêng), các model còn lại tìm ảnh khác.
  const [keep, ...others] = models;
  console.log(`\n${img.split('/').pop()?.slice(0, 60)}`);
  console.log(`  giữ: ${keep}`);

  // Tập ảnh đã dùng làm ảnh chính (để tránh chọn lại).
  const usedPrimaries = new Set([...primaryOwners.keys()]);

  for (const model of others) {
    const list = byModel.get(model)!;
    const imgs = list[0].images.map(String);

    // 1. Ưu tiên ảnh phụ sẵn có trong DB của chính model này mà chưa dùng làm
    //    ảnh chính của model nào khác.
    const candidate = imgs
      .slice(1)
      .find((u) => !usedPrimaries.has(u) && fileMatchesName(model, u));

    let chosen = candidate;

    // 2. Nếu không có, tìm trên Commons.
    if (!chosen) {
      const cands = await findCandidates(model, 8);
      const fresh = cands.find(
        (c) => !usedPrimaries.has(c.url) && c.score >= 8 && c.coverage >= 0.5,
      );
      if (fresh) chosen = fresh.url;
    }

    if (!chosen) {
      unresolved++;
      console.log(`  ✗ ${model}: không tìm được ảnh khác`);
      continue;
    }

    usedPrimaries.add(chosen);
    for (const p of list) {
      const old = p.images.map(String);
      const rest = old.filter((u) => fileNameFromUrl(u) !== fileNameFromUrl(chosen));
      await ProductModel.updateOne(
        { _id: p._id },
        { $set: { images: [chosen, ...rest].slice(0, 8) } },
      );
    }
    fixed++;
    console.log(`  ✅ ${model} -> ${fileNameFromUrl(chosen).slice(0, 60)}`);
  }
}

console.log(`\nĐã tách ${fixed} model | còn ${unresolved} model chưa xử lý`);

await disconnectDB();
