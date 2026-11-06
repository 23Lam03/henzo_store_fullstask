import { connectDB, disconnectDB } from '../../src/server/db';
import { ProductModel } from '../../src/server/models/Product';
import { OrderModel } from '../../src/server/models/Order';

(async () => {
  await connectDB();
  const [products, orders] = await Promise.all([
    ProductModel.find({}).select('name slug price images sku brand categoryName storeId').lean(),
    OrderModel.find({}).lean(),
  ]);

  const alive = new Set(products.map((p) => String(p._id)));

  // Bỏ các hậu tố số ở cuối tên (kiểu cũ "AirPods Pro 2 12", "Dell XPS 15 26")
  const stripIdx = (n: string) => n.replace(/\s+\d{1,3}$/, '').trim();

  const byName = new Map(products.map((p) => [String(p.name), p]));
  const byPrefix = new Map<string, any[]>();
  for (const p of products) {
    const k = stripIdx(String(p.name)).toLowerCase();
    byPrefix.set(k, [...(byPrefix.get(k) ?? []), p]);
  }

  let total = 0, dead = 0, resolved = 0, unresolved = 0;
  const misses = new Map<string, number>();
  const resolvedMulti = new Map<string, number>();

  for (const o of orders) {
    for (const it of (o.items ?? [])) {
      total++;
      const pid = String(it.productId ?? '');
      if (alive.has(pid)) continue;
      dead++;
      const name = String(it.productName ?? '');
      // 1) khớp chính xác theo tên
      let cand = byName.get(name);
      // 2) khớp theo tên đã bỏ hậu tố số
      if (!cand) {
        const cands = byPrefix.get(stripIdx(name).toLowerCase()) ?? [];
        if (cands.length === 1) cand = cands[0];
        else if (cands.length > 1) {
          resolvedMulti.set(stripIdx(name), (resolvedMulti.get(stripIdx(name)) ?? 0) + 1);
          cand = cands[0];
        }
      }
      if (cand) resolved++;
      else {
        unresolved++;
        misses.set(name, (misses.get(name) ?? 0) + 1);
      }
    }
  }
  console.log(`Tổng item: ${total} | item chết (productId không tồn tại): ${dead}`);
  console.log(`  giải quyết được: ${resolved} | không giải quyết được: ${unresolved}`);
  console.log(`  tên khớp nhiều sản phẩm: ${resolvedMulti.size}`);
  console.log(`  không khớp (${misses.size} tên):`);
  console.log('   ', [...misses.entries()].slice(0, 25).map(([k, v]) => `${k}(${v})`).join(', '));

  await disconnectDB();
})();
