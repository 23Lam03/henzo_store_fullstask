import { connectDB, disconnectDB } from '../../src/server/db';
import { ProductModel } from '../../src/server/models/Product';

(async () => {
  await connectDB();
  const ps = await ProductModel.find({}).lean();
  const p = ps.find((x) => String(x.name).includes('MacBook Pro 14" M4 Pro'));
  console.log('TÊN:', p?.name);
  console.log('\nMÔ TẢ:\n', p?.description);
  console.log('\nTAGS:', (p?.tags ?? []).join(', '));
  console.log('\nSPECS:');
  for (const [k, v] of Object.entries((p?.specifications ?? {}) as Record<string, string>)) {
    console.log('  ', k, '=', v);
  }
  await disconnectDB();
})();
