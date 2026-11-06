import { connectDB, disconnectDB } from '../../src/server/db';
import { ProductModel } from '../../src/server/models/Product';
import { modelName } from '../../lib/model-name';

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
  const mTokens = tokenize(model);
  const hit = mTokens.filter((t) => t.length >= 3 && fTokens.has(t));
  return hit.length >= 1;
};

await connectDB();
const products = await ProductModel.find({}).select('name images').lean();

const byModel = new Map<string, number>();
for (const p of products) {
  const imgs = (p.images ?? []).map(String);
  if (!imgs.length) continue;
  const model = modelName(String(p.name ?? ''));
  if (!model) continue;
  if (hasModelToken(model, imgs[0])) continue;
  byModel.set(model, (byModel.get(model) ?? 0) + 1);
}

console.log(`Sản phẩm cần sửa: ${[...byModel.values()].reduce((a, b) => a + b, 0)}`);
console.log(`Model unique cần sửa: ${byModel.size}`);
console.log(
  'Top 20:',
  [...byModel.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20),
);

await disconnectDB();
