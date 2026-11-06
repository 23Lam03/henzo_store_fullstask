import { connectDB, disconnectDB } from '../../src/server/db';
import { ProductModel } from '../../src/server/models/Product';
import { OrderModel } from '../../src/server/models/Order';
import { specModelKey } from '../../../henzo_store/src/data/modelSpecs';

(async () => {
  await connectDB();
  const [products, orders] = await Promise.all([
    ProductModel.find({}).select('name slug price images sku brand categoryName').lean(),
    OrderModel.find({}).lean(),
  ]);

  // Index theo model key
  const byModel = new Map<string, any[]>();
  for (const p of products) {
    const k = specModelKey(String(p.name));
    byModel.set(k, [...(byModel.get(k) ?? []), p]);
  }
  console.log('Số model key khác nhau:', byModel.size, 'trên', products.length, 'sản phẩm');

  let total = 0, hitModel = 0, miss = 0;
  const misses = new Map<string, number>();
  const ambiguous = new Map<string, number>();

  for (const o of orders) {
    for (const it of (o.items ?? [])) {
      total++;
      const pid = String(it.productId ?? '');
      if (products.some((p) => String(p._id) === pid)) continue;
      const k = specModelKey(String(it.productName ?? ''));
      const cands = byModel.get(k);
      if (cands?.length) {
        hitModel++;
        if (cands.length > 1) ambiguous.set(k, (ambiguous.get(k) ?? 0) + 1);
      } else {
        miss++;
        misses.set(String(it.productName ?? '?'), (misses.get(String(it.productName ?? '?')) ?? 0) + 1);
      }
    }
  }
  console.log(`Tổng item: ${total} | khớp theo model key: ${hitModel} | không khớp: ${miss}`);
  console.log(`Model key bị mơ hồ (>1 sản phẩm): ${ambiguous.size}`);
  console.log('  10 mẫu:', [...ambiguous.entries()].slice(0, 10).map(([k, v]) => `${k}(${v})`).join(', '));
  console.log(`Không khớp: ${misses.size} tên khác nhau`);
  console.log('  20 mẫu:', [...misses.entries()].slice(0, 20).map(([k, v]) => `${k}(${v})`).join(', '));

  await disconnectDB();
})();
