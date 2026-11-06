import { connectDB, disconnectDB } from '../../src/server/db';
import { ProductModel } from '../../src/server/models/Product';
import { OrderModel } from '../../src/server/models/Order';

(async () => {
  await connectDB();
  const [products, orders] = await Promise.all([
    ProductModel.find({}).select('name slug price images sku brand categoryName storeId').lean(),
    OrderModel.find({}).lean(),
  ]);

  const bySlug = new Map(products.map((p) => [String(p.slug), p]));
  const byName = new Map(products.map((p) => [String(p.name), p]));

  let total = 0;
  let bySlugHit = 0;
  let byNameHit = 0;
  let miss = 0;
  const misses = new Map<string, number>();

  for (const o of orders) {
    for (const it of (o.items ?? [])) {
      total++;
      const pid = String(it.productId ?? '');
      if (bySlug.has(pid)) continue;
      // thử khớp theo slug / name đã lưu trong item
      const cand = bySlug.get(String(it.productSlug ?? '')) ?? byName.get(String(it.productName ?? ''));
      if (cand) {
        if (bySlug.has(String(it.productSlug ?? ''))) bySlugHit++;
        else byNameHit++;
      } else {
        miss++;
        misses.set(String(it.productName ?? '?'), (misses.get(String(it.productName ?? '?')) ?? 0) + 1);
      }
    }
  }
  console.log(`Tổng item: ${total}`);
  console.log(`  khớp được theo slug: ${bySlugHit}`);
  console.log(`  khớp được theo name: ${byNameHit}`);
  console.log(`  KHÔNG khớp được: ${miss} (${misses.size} tên khác nhau)`);
  console.log('  15 mẫu không khớp:', [...misses.entries()].slice(0, 15).map(([k, v]) => `${k}(${v})`).join(', '));

  // Kiểm tra item hợp lệ có còn đúng giá không
  let priceMismatch = 0;
  for (const o of orders) {
    for (const it of (o.items ?? [])) {
      const p = bySlug.get(String(it.productId ?? ''));
      if (p && Number(p.price) !== Number(it.unitPrice)) priceMismatch++;
    }
  }
  console.log(`\nItem có productId hợp lệ nhưng giá lệch: ${priceMismatch}`);

  await disconnectDB();
})();
