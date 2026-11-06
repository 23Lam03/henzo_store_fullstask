/**
 * PHỤC HỒI ẢNH CHÍNH CŨ cho sản phẩm mà lượt gán fallback vừa rồi gán sai.
 *
 * Dùng `scripts/data/products-backup.json` (snapshot trước khi sửa ảnh) để
 * lấy lại ảnh chính cũ, nhưng GIỮ lại các ảnh mới đúng model đã gán.
 */
import { connectDB, disconnectDB } from '../../src/server/db';
import { ProductModel } from '../../src/server/models/Product';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { modelName } from '../../lib/model-name';
import { fileMatchesName, fileNameFromUrl } from '../../lib/image-match';

const backup = JSON.parse(
  readFileSync(resolve(process.cwd(), 'scripts/data/products-backup.json'), 'utf-8'),
) as any[];

const byId = new Map(backup.map((p) => [String(p._id), p]));

await connectDB();
const products = await ProductModel.find({}).select('name images').lean();

let restored = 0;
for (const p of products) {
  const old = byId.get(String(p._id));
  if (!old?.images?.length) continue;
  const imgs = (p.images ?? []).map(String);
  if (!imgs.length) continue;

  const model = modelName(String(p.name ?? ''));
  // Nếu ảnh chính hiện tại ĐÃ khớp model -> không cần phục hồi.
  if (fileMatchesName(model, imgs[0])) continue;

  // Tìm ảnh cũ đã khớp model.
  const goodOld = (old.images as string[]).find((u) => fileMatchesName(model, u));
  if (!goodOld) continue;

  const rest = imgs.filter(
    (u) => fileNameFromUrl(u) !== fileNameFromUrl(goodOld),
  );
  await ProductModel.updateOne(
    { _id: p._id },
    { $set: { images: [goodOld, ...rest].slice(0, 8) } },
  );
  restored++;
}

console.log(`Đã phục hồi ảnh chính cho ${restored} sản phẩm`);

await disconnectDB();
