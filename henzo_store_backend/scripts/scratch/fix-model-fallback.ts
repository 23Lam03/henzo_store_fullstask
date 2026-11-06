import { connectDB, disconnectDB } from '../../src/server/db';
import { ProductModel } from '../../src/server/models/Product';
import { modelName } from '../../lib/model-name';
import { resolveFiles } from '../../lib/commons-files';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const pools = JSON.parse(
  readFileSync(resolve(process.cwd(), 'scripts/data/type-brand-pools.json'), 'utf-8'),
) as Record<string, Record<string, string[]>>;

const TYPE_BY_CATEGORY: Record<string, string> = {
  'Điện thoại': 'PHONE',
  'Tablet': 'TABLET',
  'Laptop': 'LAPTOP',
  'Màn hình': 'MONITOR',
  'PC Gaming': 'GPU',
  'Chuột': 'MOUSE',
  'Bàn phím': 'KEYBOARD',
  'Tai nghe': 'HEADSET',
  'Phụ kiện': 'ACCESSORY',
};

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

await connectDB();
const products = await ProductModel.find({}).select('name images brand categoryName').lean();

const groups = new Map<string, { ids: string[]; brand: string; categoryName: string }>();
for (const p of products) {
  const imgs = (p.images ?? []).map(String);
  if (!imgs.length) continue;
  const model = modelName(String(p.name ?? ''));
  if (!model) continue;
  if (hasModelToken(model, imgs[0])) continue;
  const g = groups.get(model) ?? {
    ids: [],
    brand: String(p.brand ?? ''),
    categoryName: String(p.categoryName ?? ''),
  };
  g.ids.push(String(p._id));
  groups.set(model, g);
}

console.log(`Model chưa có ảnh riêng: ${groups.size}`);

const wanted = new Set<string>();
const plan = new Map<string, { ids: string[]; files: string[] }>();

for (const [model, g] of groups) {
  const typeKey =
    TYPE_BY_CATEGORY[g.categoryName] ??

    (/headset|headphone|tai nghe/i.test(model)
      ? 'HEADSET'
      : /mouse|chuột/i.test(model)
        ? 'MOUSE'
        : /keyboard|bàn phím/i.test(model)
          ? 'KEYBOARD'
          : /webcam/i.test(model)
            ? 'WEBCAM'
            : /ram|memory|ddr/i.test(model)
              ? 'RAM'
              : /ssd|storage|wd |sn\d|hdd/i.test(model)
                ? 'STORAGE'
                : /gpu|rtx|geforce/i.test(model)
                  ? 'GPU'
                  : 'LAPTOP');
  const brandKey = g.brand.toLowerCase().trim();
  const byBrand = pools[typeKey] ?? {};
  const files = byBrand[brandKey] ?? [];
  if (!files.length) continue;
  wanted.add(files[0]);
  plan.set(model, { ids: g.ids, files });
}

console.log(`Có pool cho: ${plan.size} model (cần resolve ${wanted.size} file)`);
if (!wanted.size) {
  await disconnectDB();
  process.exit(0);
}

const urlMap = await resolveFiles([...wanted]);

const normKey = (s: string): string =>
  decodeURIComponent(s)
    .replace(/^\d+px-/, '')
    .replace(/\.(jpe?g|png|webp|tiff)$/i, '')
    .replace(/[_\s]+/g, ' ')
    .trim()
    .toLowerCase();

const byKey = new Map<string, string>();
for (const [k, v] of urlMap) byKey.set(normKey(k), v);

let fixed = 0;
for (const [model, { ids, files }] of plan) {
  const url = byKey.get(normKey(files[0]));
  if (!url) {
    console.log(`  ⏭ ${model} (không resolve được file)`);
    continue;
  }
  for (const id of ids) {
    const p = products.find((x) => String(x._id) === id);
    const old = (p?.images ?? []).map(String);
    const rest = old.filter((u) => fileOf(u) !== fileOf(url));
    await ProductModel.updateOne(
      { _id: id },
      { $set: { images: [url, ...rest].slice(0, 8) } },
    );
    fixed++;
  }
  console.log(`  ✅ ${model} -> ${files[0]}`);
}

console.log(`\nĐã gán fallback cho ${fixed} sản phẩm`);

await disconnectDB();
