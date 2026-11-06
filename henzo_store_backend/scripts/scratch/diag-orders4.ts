import { connectDB, disconnectDB } from '../../src/server/db';
import { ProductModel } from '../../src/server/models/Product';
import { OrderModel } from '../../src/server/models/Order';
import { specModelKey } from '../../../henzo_store/src/data/modelSpecs';

(async () => {
  await connectDB();
  const [products, orders] = await Promise.all([
    ProductModel.find({}).select('name slug price images sku brand categoryName storeId').lean(),
    OrderModel.find({}).lean(),
  ]);

  const alive = new Set(products.map((p) => String(p._id)));
  const byModel = new Map<string, any[]>();
  for (const p of products) {
    const k = specModelKey(String(p.name));
    byModel.set(k, [...(byModel.get(k) ?? []), p]);
  }

  let total = 0, dead = 0, resolved = 0, unresolved = 0;
  const misses = new Map<string, number>();
  const byPrice = { exact: 0, near: 0, none: 0 };

  for (const o of orders) {
    for (const it of (o.items ?? [])) {
      total++;
      const pid = String(it.productId ?? '');
      if (alive.has(pid)) continue;
      dead++;
      const k = specModelKey(String(it.productName ?? ''));
      const cands = byModel.get(k);
      if (!cands?.length) {
        unresolved++;
        misses.set(String(it.productName ?? '?'), (misses.get(String(it.productName ?? '?')) ?? 0) + 1);
        continue;
      }

      const target = Number(it.unitPrice ?? 0);
      let best = cands[0]; let bestDiff = Infinity; let exact = false;
      for (const c of cands) {
        const d = Math.abs(Number(c.price) - target);
        if (d === 0) { best = c; exact = true; break; }
        if (d < bestDiff) { bestDiff = d; best = c; }
      }
      if (exact) byPrice.exact++;
      else if (bestDiff / Math.max(target, 1) < 0.35) byPrice.near++;
      else byPrice.none++;
      resolved++;
    }
  }
  console.log(`Tổng item: ${total} | chết: ${dead}`);
  console.log(`  giải quyết: ${resolved} (giá chính xác ${byPrice.exact}, giá gần ${byPrice.near}, không khớp giá ${byPrice.none})`);
  console.log(`  không giải quyết: ${unresolved} (${misses.size} tên)`);
  console.log('   ', [...misses.entries()].slice(0, 25).map(([k, v]) => `${k}(${v})`).join(', '));

  await disconnectDB();
})();
