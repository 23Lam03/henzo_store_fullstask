import { connectDB, disconnectDB } from '../../src/server/db';
import { ProductModel } from '../../src/server/models/Product';
await connectDB();
for (const re of [/Katar Pro XT/i, /HS60/i, /Brio/i, /Streamcam/i]) {
  const p = await ProductModel.findOne({ name: re }).select('name images').lean();
  console.log('===', p?.name);
  p?.images?.forEach((u, i) => console.log('  ', i, u));
}
await disconnectDB();
