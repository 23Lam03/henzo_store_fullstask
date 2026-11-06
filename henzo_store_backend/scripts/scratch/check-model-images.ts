/**
 * KIỂM TRA ẢNH CHÍNH TRONG DB THEO ĐÚNG MODEL.
 *
 * `verify-product-criteria-deep.ts` chỉ phát hiện ảnh SAI LOẠI (điện thoại
 * mà ra ảnh laptop). Script này kiểm tra mức chặt hơn: ảnh chính có chứa
 * token tên model/series trong tên file hay không.
 */
import { connectDB, disconnectDB } from '../../src/server/db';
import { ProductModel } from '../../src/server/models/Product';

const STOP = new Set([
  'pro', 'plus', 'max', 'ultra', 'mini', 'air', 'se', 'gen', 'series',
  'gb', 'tb', 'gaming', 'wireless', 'rgb', 'black', 'white', 'silver',
  'grey', 'gray', 'titanium', 'magnetic', 'tkl', 'full', 'size', 'with',
  'and', 'the', 'for', 'edition', 'combo', 'package', 'kit', 'new',
  'inch', 'in', 'type', 'dung', 'luu', 'cho', 'gia', 're', 'sieu',
  'toc', 'phan', 'bo', 'mau', 'do', 'den', 'trang', 'xanh',
]);

const tokens = (model: string): string[] =>
  model
    .replace(/[()]/g, ' ')
    .split(/[^A-Za-z0-9.+-]+/)
    .filter((t) => t.length >= 2 && !STOP.has(t.toLowerCase()))
    .sort((a, b) => b.length - a.length);

const normTitle = (title: string): string =>
  title
    .replace(/^File:/, '')
    .replace(/\.(jpe?g|png|webp|tiff)$/i, '')
    .replace(/[_.]/g, ' ')
    .replace(/[()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

const fileFromUrl = (url: string): string => {
  const raw = decodeURIComponent(url.split('?')[0] ?? '');
  const parts = raw.split('/');
  return parts[parts.length - 1] ?? '';
};

/** Lấy phần "model" của tên sản phẩm: bỏ hãng + dung lượng/tối đa ở đuôi. */
function modelOf(name: string): string {
  return name
    .replace(/^\s*\S+\s+/, '') // bỏ hãng
    .replace(/\s+(256|512|128|256GB|512GB|1TB|2TB|4TB)\b.*$/i, '')
    .trim();
}

const isExact = (model: string, file: string): boolean => {
  const t = normTitle(file);
  const toks = tokens(model);
  const hit = toks.filter((x) => x.length >= 3 && t.includes(x.toLowerCase()));
  return hit.length >= 1;
};

await connectDB();
const products = await ProductModel.find({}).select('name images categoryName brand').lean();

const bad: string[] = [];
for (const p of products) {
  const imgs = (p.images ?? []).map(String);
  if (!imgs.length) continue;
  const model = modelOf(String(p.name ?? ''));
  if (!model) continue;
  const main = fileFromUrl(imgs[0]);
  if (!isExact(model, main)) {
    bad.push(`${p.name}\n     -> ${main.slice(0, 90)}`);
  }
}

console.log(`Tổng sản phẩm: ${products.length}`);
console.log(`Ảnh chính không chứa tên model: ${bad.length}`);
bad.slice(0, 60).forEach((b) => console.log(`  - ${b}`));

await disconnectDB();
