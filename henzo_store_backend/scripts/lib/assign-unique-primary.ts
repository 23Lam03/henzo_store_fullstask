/**
 * PHÂN BỔ LẠI ẢNH CHÍNH: mỗi model một ảnh chính RIÊNG.
 *
 * Nguồn ảnh: ưu tiên ảnh phụ đã có sẵn trong DB của chính model đó; nếu
 * không có thì lấy ảnh chính/ảnh phụ của một model cùng HÃNG + cùng LOẠI
 * (để mỗi model có ảnh riêng nhưng vẫn đúng nghiệp vụ hiển thị).
 */
import { connectDB, disconnectDB } from '../../src/server/db';
import { ProductModel } from '../../src/server/models/Product';
import { modelName } from '../lib/model-name';
import { fileMatchesName, fileNameFromUrl } from '../lib/image-match';
import { modelType } from '../lib/model-type';

await connectDB();
const products = await ProductModel.find({}).select('name images brand categoryName').lean();

const byModel = new Map<string, any[]>();
const modelMeta = new Map<string, { brand: string; type: string }>();
for (const p of products) {
  const m = modelName(String(p.name ?? ''));
  if (!m) continue;
  const arr = byModel.get(m) ?? [];
  arr.push(p);
  byModel.set(m, arr);
  if (!modelMeta.has(m)) {
    modelMeta.set(m, {
      brand: String(p.brand ?? ''),
      type: modelType(String(p.name ?? ''), String(p.categoryName ?? '')),
    });
  }
}

/** Ảnh chính -> model đang dùng. */
const primaryOwner = new Map<string, string>();
for (const [model, list] of byModel) {
  const main = String(list[0].images?.[0] ?? '');
  if (main) primaryOwner.set(main, model);
}

/** Tất cả ảnh trong DB theo model (chính + phụ). */
const allImagesOf = (model: string): string[] => {
  const out: string[] = [];
  for (const p of byModel.get(model) ?? []) {
    for (const u of (p.images ?? []).map(String)) out.push(u);
  }
  return out;
};

/** Nhóm model theo (brand, loại) — dùng làm nguồn ảnh dự phòng. */
const siblings = new Map<string, string[]>();
for (const [model, meta] of modelMeta) {
  const key = `${meta.brand}|${meta.type}`;
  const arr = siblings.get(key) ?? [];
  arr.push(model);
  siblings.set(key, arr);
}

let fixed = 0;
let unresolved = 0;

for (const [img, owner] of [...primaryOwner.entries()]) {
  // Tìm các model khác đang dùng chung ảnh này.
  const shared = [...byModel.keys()].filter((m) => {
    const list = byModel.get(m)!;
    return String(list[0].images?.[0] ?? '') === img;
  });
  if (shared.length <= 1) continue;

  const [keep, ...others] = shared;
  const keepMeta = modelMeta.get(keep)!;
  const pool = siblings.get(`${keepMeta.brand}|${keepMeta.type}`) ?? [];

  for (const model of others) {
    const meta = modelMeta.get(model)!;
    // Ảnh riêng của model này (đã có sẵn trong DB, chưa dùng làm chính).
    const own = allImagesOf(model).find(
      (u) => u !== img && !primaryOwner.has(u) && fileMatchesName(model, u),
    );
    let chosen = own;

    if (!chosen) {
      // Ảnh của model anh em cùng hãng + loại, chưa dùng làm ảnh chính.
      const siblingImg = pool
        .filter((m) => m !== keep && m !== model)
        .flatMap((m) => allImagesOf(m))
        .find((u) => !primaryOwner.has(u) && fileMatchesName(model, u));
      chosen = siblingImg;
    }

    if (!chosen) {
      // Ảnh bất kỳ chưa dùng làm chính của model cùng hãng + loại.
      const anySibling = pool
        .filter((m) => m !== keep && m !== model)
        .flatMap((m) => allImagesOf(m))
        .find((u) => !primaryOwner.has(u));
      chosen = anySibling;
    }

    if (!chosen) {
      unresolved++;
      console.log(`  ✗ ${model}: không có ảnh dự phòng`);
      continue;
    }

    primaryOwner.set(chosen, model);
    for (const p of byModel.get(model)!) {
      const old: string[] = (p.images ?? []).map((v: unknown) => String(v));
      const rest = old.filter((u) => fileNameFromUrl(u) !== fileNameFromUrl(chosen));
      await ProductModel.updateOne(
        { _id: p._id },
        { $set: { images: [chosen, ...rest].slice(0, 8) } },
      );
    }
    fixed++;
    console.log(
      `  ✅ ${model} [${meta.brand}/${meta.type}] -> ${fileNameFromUrl(chosen).slice(0, 55)}`,
    );
  }
}

console.log(`\nĐã tách ${fixed} model | còn ${unresolved} model`);

await disconnectDB();
