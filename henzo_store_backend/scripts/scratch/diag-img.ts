import { connectDB, disconnectDB } from '../../src/server/db';
import { ProductModel } from '../../src/server/models/Product';
import { CategoryModel } from '../../src/server/models/Category';

const TYPE_TOKENS: Record<string, string[]> = {
  'Điện thoại': ['iphone', 'galaxy', 'pixel', 'phone', 'smartphone', 'redmi', 'oneplus', 'nothing', 'ipad', 'tab s'],
  Tablet: ['ipad', 'galaxy tab', 'tab s', 'tablet'],
  Laptop: ['macbook', 'notebook', 'laptop', 'thinkpad', 'ideapad', 'zenbook', 'vivobook', 'xps', 'aspire', 'pavilion'],
  'Màn hình': ['monitor', 'display', 'ultragear', 'odyssey'],
  'PC Gaming': ['tower', 'gaming pc', 'desktop', 'case'],
  Chuột: ['mouse', 'g pro', 'g502', 'deathwish', 'mousepad'],
  'Bàn phím': ['keyboard', 'keychron', 'k70', 'hhkb', 'ducky'],
  'Tai nghe': ['headset', 'headphone', 'tai nghe', 'wh-1000', 'ar headset', 'astera'],
  'Phụ kiện': ['adapter', 'cable', 'hub', 'dock', 'charger', 'sạc', 'ssd', 'ram', 'memory'],
};

function hits(url: string, toks: string[]) {
  const u = decodeURIComponent(url).toLowerCase();
  return toks.filter((t) => u.includes(t));
}

(async () => {
  await connectDB();
  const [products, cats] = await Promise.all([
    ProductModel.find({}).lean(),
    CategoryModel.find({}).lean(),
  ]);

  console.log('=== CATEGORIES ===');
  for (const c of cats) console.log(`  ${c.name} (${c.slug}) parent=${c.parentId ?? '-'} count=${c.productCount}`);

  console.log('\n=== Ảnh chính SAI LOẠI (theo token) ===');
  let n = 0;
  for (const p of products) {
    const main = String((p.images ?? [])[0] ?? '');
    if (!main) continue;
    const cat = String(p.categoryName ?? '');
    const own = hits(main, TYPE_TOKENS[cat] ?? []);
    const other = Object.entries(TYPE_TOKENS)
      .filter(([c]) => c !== cat)
      .flatMap(([, t]) => t);
    const oh = hits(main, other);
    if (own.length === 0 && oh.length > 0) {
      n++;
      console.log(`  [${cat}] ${p.name}`);
      console.log(`      -> ${decodeURIComponent(main).split('/thumb/')[1]?.slice(0, 90)}`);
      console.log(`      token khác loại: ${[...new Set(oh)].join(', ')}`);
    }
  }
  console.log(`  TỔNG: ${n}`);

  await disconnectDB();
})();
