import { connectDB, disconnectDB } from '../../src/server/db';
import { ProductModel } from '../../src/server/models/Product';
import { BrandModel } from '../../src/server/models/Brand';
import { ReviewModel } from '../../src/server/models/Review';
import { OrderModel } from '../../src/server/models/Order';

(async () => {
  await connectDB();
  const [products, brands, reviews, orders] = await Promise.all([
    ProductModel.find({}).lean(),
    BrandModel.find({}).lean(),
    ReviewModel.find({}).lean(),
    OrderModel.find({}).lean(),
  ]);

  console.log('=== 1. BRANDS trong DB ===');
  console.log(brands.map((b) => b.name).sort().join(', '));

  const brandNames = new Set(brands.map((b) => String(b.name)));
  const prodBrands = new Map<string, number>();
  for (const p of products) {
    const b = String(p.brand ?? '(rỗng)');
    prodBrands.set(b, (prodBrands.get(b) ?? 0) + 1);
  }
  console.log('\n=== 2. BRANDS trên sản phẩm (không có trong brands collection) ===');
  for (const [b, n] of [...prodBrands].sort((a, b) => b[1] - a[1])) {
    if (!brandNames.has(b)) console.log(`  ${b}: ${n} sản phẩm`);
  }

  console.log('\n=== 3. REVIEWS thực tế ===');
  console.log(`  tổng ${reviews.length}, ẩn ${reviews.filter((r) => r.isHidden).length}`);
  const byProduct = new Map<string, number>();
  for (const r of reviews) {
    const k = String(r.productId);
    byProduct.set(k, (byProduct.get(k) ?? 0) + 1);
  }
  console.log(`  sản phẩm có đánh giá: ${byProduct.size}`);
  const withReviews = new Set(byProduct.keys());
  console.log(`  sản phẩm KHÔNG có đánh giá nhưng vẫn hiện reviewCount>0:`);
  let n = 0;
  for (const p of products) {
    if (Number(p.reviewCount ?? 0) > 0 && !withReviews.has(String(p._id))) n++;
  }
  console.log(`    ${n} / ${products.length}`);
  const totalFake = products.reduce((s, p) => s + Number(p.reviewCount ?? 0), 0);
  console.log(`  TỔNG reviewCount hiển thị trên UI: ${totalFake} (thực tế chỉ có ${reviews.length})`);

  console.log('\n=== 4. ORDERS trỏ product đã xoá ===');
  const productIds = new Set(products.map((p) => String(p._id)));
  const missing = new Map<string, number>();
  let totalItems = 0;
  for (const o of orders) {
    for (const it of ((o as any).items ?? [])) {
      totalItems++;
      const pid = String(it.productId ?? '');
      if (pid && !productIds.has(pid)) {
        missing.set(String(it.productName ?? pid), (missing.get(String(it.productName ?? pid)) ?? 0) + 1);
      }
    }
  }
  console.log(`  tổng item trong đơn: ${totalItems}, item trỏ product không tồn tại: ${[...missing.values()].reduce((a, b) => a + b, 0)}`);
  console.log(`  số product-name khác nhau bị trỏ: ${missing.size}`);
  console.log('  10 mẫu:', [...missing.entries()].slice(0, 10).map(([k, v]) => `${k}(${v})`).join(', '));

  console.log('\n=== 5. Trạng thái đơn hàng ===');
  const st: Record<string, number> = {};
  for (const o of orders) st[String(o.status)] = (st[String(o.status)] ?? 0) + 1;
  console.log(' ', JSON.stringify(st));

  console.log('\n=== 6. Ảnh chính của các sản phẩm nghi ngờ sai loại ===');
  const suspects = [
    'ASUS ROG Phone 9 Pro 512GB',
    'iPad Pro M4 256GB 13"',
  ];
  for (const s of suspects) {
    const p = products.find((x) => String(x.name) === s);
    if (p) console.log(`  ${s}\n     cat=${p.categoryName} brand=${p.brand}\n     ${(p.images ?? []).join('\n     ')}`);
  }

  await disconnectDB();
})();
