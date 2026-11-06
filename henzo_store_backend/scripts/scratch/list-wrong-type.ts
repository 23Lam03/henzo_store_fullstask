import { connectDB, disconnectDB } from '../../src/server/db';
import { ProductModel } from '../../src/server/models/Product';
import { modelType } from '../../lib/model-type';
import { isWrongType } from '../../lib/image-type';

await connectDB();
const products = await ProductModel.find({}).select('name images categoryName').lean();
for (const p of products) {
  const imgs = (p.images ?? []).map(String);
  if (!imgs.length) continue;
  const type = modelType(String(p.name ?? ''), String(p.categoryName ?? ''));
  if (isWrongType(imgs[0], type)) {
    console.log(`${p.name} [${type}] -> ${imgs[0].split('/').pop()}`);
  }
}
await disconnectDB();
