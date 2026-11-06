import { connectDB, disconnectDB } from '../../src/server/db';
import { ProductModel } from '../../src/server/models/Product';
import { modelName } from '../../lib/model-name';
import { findCandidates } from '../../lib/commons-model-search';

const SCORE_MIN = 8;
const COVERAGE_MIN = 0.5;
const DELAY_MS = 350;

const STOP = new Set([
  'pro', 'plus', 'max', 'ultra', 'mini', 'air', 'se', 'gen', 'series',
  'gaming', 'wireless', 'rgb', 'black', 'white', 'silver', 'grey', 'gray',
  'titanium', 'magnetic', 'tkl', 'full', 'size', 'edition', 'combo',
  'package', 'kit', 'new', 'type', 'model', 'with', 'and', 'the', 'for',
  'dung', 'luu', 'cho', 'gia', 're', 'sieu', 'toc', 'phan', 'bo', 'mau',
  'do', 'den', 'trang', 'xanh', 'inch', 'gb', 'tb',
]);

const tokenize = (s: string): string[] =>
  s
    .replace(/[()"]/g, ' ')
    .split(/[^A-Za-z0-9]+/)
    .filter((t) => t.length >= 2 && !STOP.has(t.toLowerCase()))
    .map((t) => t.toLowerCase());

const fileOf = (url: string): string =>
  decodeURIComponent(url.split('?')[0]?.split('/').pop() ?? '')
    .replace(/^\d+px-/, '')
    .replace(/\.(jpe?g|png|webp)$/i, '')
    .replace(/[_.]/g, ' ')
    .toLowerCase();

const hasModelToken = (model: string, url: string): boolean => {
  const fTokens = new Set(tokenize(fileOf(url)));
  return tokenize(model).some((t) => t.length >= 3 && fTokens.has(t));
};

const isUnusable = (title: string): boolean =>
  /\b(logo|packaging|box|diagram|chart|map|flag|screenshot|poster|drawing|svg|icon|specs?|label|tag|sticker|banner|comparison|compare|graph|infographic|cover|back cover)\b/i.test(
    title,
  );

await connectDB();
const products = await ProductModel.find({}).select('name images').lean();

const groups = new Map<string, { ids: string[]; main: string }>();
for (const p of products) {
  const imgs = (p.images ?? []).map(String);
  if (!imgs.length) continue;
  const model = modelName(String(p.name ?? ''));
  if (!model) continue;
  if (hasModelToken(model, imgs[0])) continue;
  const g = groups.get(model) ?? { ids: [], main: imgs[0] };
  g.ids.push(String(p._id));
  groups.set(model, g);
}

console.log(`Model cần tìm ảnh: ${groups.size} (${[...groups.values()].reduce((a, g) => a + g.ids.length, 0)} sản phẩm)`);

let fixedModels = 0;
let fixedProducts = 0;
let skipped = 0;
const report: any[] = [];

const modelList = [...groups.entries()];

for (let i = 0; i < modelList.length; i++) {
  const [model, g] = modelList[i];
  if (i % 25 === 0) console.log(`\n--- ${i}/${modelList.length} ---`);

  let cands = await findCandidates(model, 12);
  cands = cands.filter((c) => !isUnusable(c.title));

  const best = cands[0];

  if (!best || best.score < SCORE_MIN || best.coverage < COVERAGE_MIN) {
    skipped++;
    report.push({ model, status: 'skip', best: best?.title ?? null, score: best?.score ?? 0 });
    console.log(`  ⏭ ${model} (điểm ${best?.score ?? 0}, phủ ${(best?.coverage ?? 0).toFixed(2)})`);
    continue;
  }

  const primary = cands[0].url;
  const extras = cands.slice(1, 4).map((c) => c.url);

  for (const id of g.ids) {
    const p = products.find((x) => String(x._id) === id);
    const old = (p?.images ?? []).map(String);
    const rest = old.filter((u) => !extras.includes(u) && fileOf(u) !== fileOf(primary));
    await ProductModel.updateOne(
      { _id: id },
      { $set: { images: [primary, ...extras, ...rest].slice(0, 8) } },
    );
    fixedProducts++;
  }

  fixedModels++;
  report.push({ model, status: 'fixed', file: best.file, score: best.score });
  console.log(`  ✅ ${model} -> ${best.title} (điểm ${best.score}, phủ ${best.coverage.toFixed(2)})`);

  await new Promise((s) => setTimeout(s, DELAY_MS));
}

console.log(`\nKết quả: sửa ${fixedModels} model / ${fixedProducts} sản phẩm | bỏ qua ${skipped} model`);

await disconnectDB();
