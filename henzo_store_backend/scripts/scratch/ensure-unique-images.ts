import { connectDB, disconnectDB } from '../../src/server/db';
import { ProductModel } from '../../src/server/models/Product';
import { modelName } from '../../lib/model-name';
import {
  fileMatchesName,
  fileMatchesAll,
  fileNameFromUrl,
} from '../../lib/image-match';
import { findCandidates } from '../../lib/commons-model-search';

await connectDB();
const products = await ProductModel.find({}).select('name images brand').lean();

const byModel = new Map<string, any[]>();
for (const p of products) {
  const m = modelName(String(p.name ?? ''));
  if (!m) continue;
  const arr = byModel.get(m) ?? [];
  arr.push(p);
  byModel.set(m, arr);
}

const imgOwners = new Map<string, Set<string>>();
for (const [model, list] of byModel) {
  for (const p of list) {
    for (const u of (p.images ?? []).map(String)) {
      const set = imgOwners.get(u) ?? new Set<string>();
      set.add(model);
      imgOwners.set(u, set);
    }
  }
}

const primaryOf = new Map<string, string>();
for (const [model, list] of byModel) {
  const main = String(list[0].images?.[0] ?? '');
  if (main) primaryOf.set(main, model);
}

console.log(
  `Model: ${byModel.size} | ảnh: ${imgOwners.size} | ảnh dùng chung nhiều model: ` +
    `${[...imgOwners.values()].filter((s) => s.size > 1).length}`,
);

const toRemove = new Map<string, Set<string>>();
for (const [img, owners] of imgOwners) {
  if (owners.size <= 1) continue;
  const owner = primaryOf.get(img) ?? [...owners][0];
  for (const m of owners) {
    if (m === owner) continue;
    const set = toRemove.get(m) ?? new Set<string>();
    set.add(img);
    toRemove.set(m, set);
  }
}

let removed = 0;
for (const [model, imgs] of toRemove) {
  for (const p of byModel.get(model)!) {
    const keep = (p.images ?? []).map(String).filter((u) => !imgs.has(u));
    if (keep.length === (p.images ?? []).length) continue;
    await ProductModel.updateOne({ _id: p._id }, { $set: { images: keep } });
    removed++;
  }
}
console.log(`Đã gỡ ảnh dùng chung khỏi ${removed} bản ghi`);

const MIN_IMAGES = 3;
const used = new Set<string>(primaryOf.keys());

let added = 0;
let stillMissing = 0;

for (const [model, list] of byModel) {
  const have = new Set<string>();
  for (const p of list) for (const u of (p.images ?? []).map(String)) have.add(u);

  if (have.size >= MIN_IMAGES) continue;

  const cands = await findCandidates(model, 10);
  const fresh = cands.filter(
    (c) => !used.has(c.url) && c.score >= 8 && c.coverage >= 0.5,
  );

  let addedHere = 0;
  for (const c of fresh) {
    if (have.size + addedHere >= MIN_IMAGES) break;

    if (!fileMatchesAll(model, c.url)) continue;
    have.add(c.url);
    used.add(c.url);
    addedHere++;
  }

  if (!addedHere) {
    stillMissing++;
    console.log(`  ✗ ${model}: chỉ có ${have.size} ảnh riêng`);
    continue;
  }

  for (const p of list) {
    const old = (p.images ?? []).map(String);
    const merged = [...new Set([...old, ...cands.filter((c) => have.has(c.url)).map((c) => c.url)])];
    await ProductModel.updateOne(
      { _id: p._id },
      { $set: { images: merged.slice(0, 8) } },
    );
  }
  added++;
  console.log(`  ✅ ${model}: +${addedHere} ảnh riêng`);
}

console.log(`\nĐã bổ sung cho ${added} model | còn thiếu ${stillMissing} model`);

await disconnectDB();
