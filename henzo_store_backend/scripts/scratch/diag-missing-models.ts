import { connectDB, disconnectDB } from '../../src/server/db';
import { ProductModel } from '../../src/server/models/Product';
import { MODEL_SPECS } from '../../../henzo_store/src/data/modelSpecs';

(async () => {
  await connectDB();
  const ps = await ProductModel.find({}).select('name').lean();
  const have = new Set(ps.map((p) => String(p.name)));
  const keys = Object.keys(MODEL_SPECS);
  const miss = keys.filter((k) => !have.has(k) && ![...have].some((h) => h.startsWith(k)));
  console.log('model trong bảng chuẩn:', keys.length);
  console.log('model chưa có sản phẩm nào:', miss.length);
  console.log(miss.join('\n'));
  await disconnectDB();
})();
