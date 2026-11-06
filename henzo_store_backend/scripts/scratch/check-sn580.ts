import { connectDB, disconnectDB } from '../../src/server/db';
import { ProductModel } from '../../src/server/models/Product';

await connectDB();
const p = await ProductModel.findOne({ name: /SN580/i }).select('name images').lean();
console.log(p?.name);
p?.images?.forEach((u, i) => console.log(i, u));
await disconnectDB();
