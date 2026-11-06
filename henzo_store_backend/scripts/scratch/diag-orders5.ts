import { connectDB, disconnectDB } from '../../src/server/db';
import { ProductModel } from '../../src/server/models/Product';
import { OrderModel } from '../../src/server/models/Order';

const STOP = new Set(['gb', 'tb', 'mb', 'ssd', 'inch', 'in']);

/** Chuẩn hoá tên -> token chữ/số bỏ ký tự đặc biệt, bỏ số thứ tự cuối. */
function tokens(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/["']/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .filter((t) => !STOP.has(t));
}

(async () => {
  await connectDB();
  const [products, orders] = await Promise.all([
    ProductModel.find({}).select('name slug price images sku brand categoryName storeId').lean(),
    OrderModel.find({}).lean(),
  ]);

  const alive = new Set(products.map((p) => String(p._id)));

  // Index sản phẩm theo token
  const prodTokens = products.map((p) => ({ p, t: new Set(tokens(String(p.name))) }));
  const brandTokens = new Map<string, any[]>();
  for (const p of products) {
    const b = String(p.brand ?? '').toLowerCase();
    brandTokens.set(b, [...(brandTokens.get(b) ?? []), p]);
  }

  let total = 0, dead = 0, resolved = 0, unresolved = 0;
  const misses = new Map<string, number>();
  const lowConf = new Map<string, number>();

  for (const o of orders) {
    for (const it of (o.items ?? [])) {
      total++;
      if (alive.has(String(it.productId ?? ''))) continue;
      dead++;
      const name = String(it.productName ?? '');

      // Bỏ số thứ tự ở cuối: "AirPods Pro 2 12" -> "AirPods Pro 2"
      const cleaned = name.replace(/\s+\d{1,3}$/, '').trim();
      const ct = new Set(tokens(cleaned));
      if (!ct.size) { unresolved++; misses.set(name, (misses.get(name) ?? 0) + 1); continue; }

      // 1) điểm = |giao| / |token sản phẩm|
      let best: any = null; let bestScore = 0; let bestJaccard = 0;
      for (const { p, t } of prodTokens) {
        let inter = 0;
        for (const x of ct) if (t.has(x)) inter++;
        if (!inter) continue;
        const score = inter / ct.size;             // bao phủ token đích
        const jac = inter / (ct.size + t.size - inter);
        if (score > bestScore || (score === bestScore && jac > bestJaccard)) {
          bestScore = score; bestJaccard = jac; best = p;
        }
      }

      if (best && bestScore >= 0.6) {
        resolved++;
        if (bestScore < 1) lowConf.set(`${name} -> ${best.name} (${bestScore.toFixed(2)})`, (lowConf.get(`${name} -> ${best.name} (${bestScore.toFixed(2)})`) ?? 0) + 1);
      } else {
        unresolved++;
        misses.set(name, (misses.get(name) ?? 0) + 1);
      }
    }
  }
  console.log(`Tổng item: ${total} | chết: ${dead}`);
  console.log(`  giải quyết: ${resolved} | không: ${unresolved}`);
  console.log(`  khớp không hoàn hảo: ${lowConf.size}`);
  console.log('   ', [...lowConf.entries()].slice(0, 15).map(([k, v]) => `${k} x${v}`).join('\n    '));
  console.log(`  không khớp (${misses.size}):`);
  console.log('   ', [...misses.entries()].slice(0, 25).map(([k, v]) => `${k}(${v})`).join(', '));

  await disconnectDB();
})();
