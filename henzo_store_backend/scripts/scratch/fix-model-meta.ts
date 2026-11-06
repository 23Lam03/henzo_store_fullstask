/**
 * GÁN ẢNH FALLBACK THÔNG MINH CHO MODEL CHƯA CÓ ẢNH RIÊNG.
 *
 * Dùng `extmetadata` của Commons để xác nhận ảnh đúng HÃNG + đúng DÒNG
 * sản phẩm (vì tên file Commons thường không chứa tên hãng, vd
 * "ST100VoidPro" là tai nghe Corsair).
 */
import { connectDB, disconnectDB } from '../../src/server/db';
import { ProductModel } from '../../src/server/models/Product';
import { modelName } from '../../lib/model-name';
import {
  fileMatchesName,
  fileNameFromUrl,
  normalizeFileTitle,
  tokenize,
} from '../../lib/image-match';
import { searchWithMeta, scoreMeta } from '../../lib/commons-meta-search';

const SCORE_MIN = 9;

await connectDB();
const products = await ProductModel.find({}).select('name images brand categoryName').lean();

// Gom theo model.
const groups = new Map<
  string,
  { ids: string[]; brand: string; categoryName: string }
>();
for (const p of products) {
  const imgs = (p.images ?? []).map(String);
  if (!imgs.length) continue;
  const model = modelName(String(p.name ?? ''));
  if (!model) continue;
  if (fileMatchesName(model, imgs[0])) continue;
  const g = groups.get(model) ?? {
    ids: [],
    brand: String(p.brand ?? ''),
    categoryName: String(p.categoryName ?? ''),
  };
  g.ids.push(String(p._id));
  groups.set(model, g);
}

console.log(`Model cần ảnh fallback: ${groups.size}`);

let fixed = 0;
let fixedProducts = 0;
let skipped = 0;

for (const [model, g] of groups) {
  const modelTokens = tokenize(model).filter((t) => t.length >= 3);
  const queries = [
    `intitle:"${g.brand}" ${g.categoryName}`,
    `"${g.brand}" ${g.categoryName} filetype:bitmap`,
    `intitle:"${model}" filetype:bitmap`,
  ];

  let best: { url: string; title: string; score: number } | null = null;
  for (const q of queries) {
    const cands = await searchWithMeta(q, 12);
    for (const c of cands) {
      const { score } = scoreMeta(c.title, c.description, g.brand, modelTokens);
      if (score > (best?.score ?? 0)) {
        best = { url: c.url, title: c.title, score };
      }
    }
    if (best && best.score >= SCORE_MIN + 3) break;
    await new Promise((s) => setTimeout(s, 200));
  }

  if (!best || best.score < SCORE_MIN) {
    skipped++;
    console.log(`  ⏭ ${model} (điểm ${best?.score ?? 0})`);
    continue;
  }

  for (const id of g.ids) {
    const p = products.find((x) => String(x._id) === id);
    const old = (p?.images ?? []).map(String);
    const rest = old.filter((u) => fileNameFromUrl(u) !== fileNameFromUrl(best!.url));
    await ProductModel.updateOne(
      { _id: id },
      { $set: { images: [best!.url, ...rest].slice(0, 8) } },
    );
    fixedProducts++;
  }
  fixed++;
  console.log(`  ✅ ${model} -> ${best.title} (điểm ${best.score})`);
}

console.log(`\nSửa ${fixed} model / ${fixedProducts} sản phẩm | bỏ qua ${skipped}`);

await disconnectDB();
