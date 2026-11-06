/**
 * ĐỒNG BỘ THƯƠNG HIỆU & BỘ ĐẾM SẢN PHẨM.
 *
 * Vấn đề phát hiện khi audit mở rộng:
 *  1. 44 sản phẩm có `brand` KHÔNG tồn tại trong collection `brands`
 *     (Keychron, Sony, Intel, AMD, NVIDIA, Bose, Elgato, G.Skill,
 *      Western Digital, Crucial, Seagate, Cooler Master, DeepCool,
 *      Belkin, Anker) -> lọc theo thương hiệu trên UI không ra kết quả.
 *  2. 1 sản phẩm ghi `Asus` (không đúng casing) còn 45 sản phẩm ghi `ASUS`
 *     -> tách thành 2 thương hiệu, filter `brand=ASUS` bỏ sót 1 sản phẩm.
 *  3. `productCount` của categories/brands/stores lệch với số sản phẩm
 *     thật -> badge "N sản phẩm" hiển thị sai.
 *
 * Script này:
 *   1. Chuẩn hoá casing thương hiệu (Asus -> ASUS, intel -> Intel...).
 *   2. Tạo brand còn thiếu kèm logo/màu thật từ `brand-logos.ts`.
 *   3. Đồng bộ `productCount` cho categories / brands / stores.
 *
 * Chạy: npx tsx scripts/sync-brands-and-counts.ts
 */
import { connectDB, disconnectDB } from '../src/server/db';
import { ProductModel } from '../src/server/models/Product';
import { BrandModel } from '../src/server/models/Brand';
import { CategoryModel } from '../src/server/models/Category';
import { StoreModel } from '../src/server/models/Store';
import { brandLogo, brandColor } from '../src/server/data/brand-logos';

/** Chuẩn hoá casing thương hiệu — tránh trùng "Asus"/"ASUS". */
const BRAND_CANON: Record<string, string> = {
  asus: 'ASUS',
  intel: 'Intel',
  amd: 'AMD',
  nvidia: 'NVIDIA',
  hp: 'HP',
  lg: 'LG',
  jbl: 'JBL',
  aoc: 'AOC',
  dell: 'Dell',
  msi: 'MSI',
  ibm: 'IBM',
  'g.skill': 'G.Skill',
  'kingston technology': 'Kingston',
  'western digital': 'Western Digital',
  'endgame gear': 'Endgame Gear',
  'microsoft': 'Microsoft',
  'gigabyte': 'Gigabyte',
  'viewsonic': 'ViewSonic',
  'logitech': 'Logitech',
  'razer': 'Razer',
  'corsair': 'Corsair',
  'steelseries': 'SteelSeries',
  'hyperx': 'HyperX',
  'keychron': 'Keychron',
  'coolermaster': 'Cooler Master',
  'roccat': 'ROCCAT',
  'sony': 'Sony',
  'bose': 'Bose',
  'elgato': 'Elgato',
  'belkin': 'Belkin',
  'anker': 'Anker',
  'deepcool': 'DeepCool',
  'crucial': 'Crucial',
  'seagate': 'Seagate',
  'apple': 'Apple',
  'samsung': 'Samsung',
  'xiaomi': 'Xiaomi',
  'oppo': 'OPPO',
  'vivo': 'Vivo',
  'google': 'Google',
  'realme': 'Realme',
  'nokia': 'Nokia',
  'oneplus': 'OnePlus',
  'honor': 'Honor',
  'tecno': 'Tecno',
  'huawei': 'Huawei',
  'lenovo': 'Lenovo',
  'acer': 'Acer',
  'benq': 'BenQ',
  'philips': 'Philips',
};

/** Chuẩn hoá tên brand về dạng chuẩn của collection. */
function canonBrand(raw: string): string {
  const t = raw.trim();
  if (!t) return t;
  const lower = t.toLowerCase();
  if (BRAND_CANON[lower]) return BRAND_CANON[lower];
  // Giữ nguyên nếu đã khớp 1 brand đang có trong DB (so sánh không phân biệt hoa thường).
  return t;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function main() {
  await connectDB();
  console.log('[sync] Kết nối MongoDB...');

  const products = await ProductModel.find({}).select(
    'name brand categoryId categoryName storeId',
  ).lean();

  // ─── 1. Chuẩn hoá casing brand ─────────────────────────────────────────
  let renamed = 0;
  for (const p of products) {
    const canon = canonBrand(String(p.brand ?? ''));
    if (canon && canon !== p.brand) {
      await ProductModel.updateOne({ _id: p._id }, { $set: { brand: canon } });
      renamed++;
    }
  }
  console.log(`[sync] Chuẩn hoá casing brand: ${renamed} sản phẩm`);

  // ─── 2. Tạo brand còn thiếu ────────────────────────────────────────────
  const existingBrands = await BrandModel.find({}).lean();
  const existingNames = new Set(existingBrands.map((b) => String(b.name)));
  const usedSlugs = new Set(existingBrands.map((b) => String(b.slug)));

  const productBrands = new Map<string, number>();
  for (const p of await ProductModel.find({}).select('brand').lean()) {
    const b = String(p.brand ?? '');
    if (b) productBrands.set(b, (productBrands.get(b) ?? 0) + 1);
  }

  let created = 0;
  for (const [brand, count] of productBrands) {
    if (existingNames.has(brand)) continue;
    let slug = slugify(brand);
    let i = 2;
    while (usedSlugs.has(slug)) slug = `${slugify(brand)}-${i++}`;
    usedSlugs.add(slug);

    await BrandModel.create({
      name: brand,
      slug,
      logo: brandLogo(brand),
      color: brandColor(brand),
      tagline: `${brand} chính hãng`,
      description: `${brand} — sản phẩm chính hãng, bảo hành uy tín, giá tốt nhất thị trường.`,
      productCount: count,
    });
    console.log(`[sync]   + brand "${brand}" (slug=${slug}, ${count} sản phẩm)`);
    created++;
  }
  console.log(`[sync] Tạo brand mới: ${created}`);

  // ─── 3. Đồng bộ productCount ──────────────────────────────────────────
  const finalProducts = await ProductModel.find({}).select(
    'brand categoryId storeId',
  ).lean();

  const catCount = new Map<string, number>();
  const brandCount = new Map<string, number>();
  const storeCount = new Map<string, number>();
  for (const p of finalProducts) {
    const cid = p.categoryId ? String(p.categoryId) : '';
    const br = String(p.brand ?? '');
    const sid = p.storeId ? String(p.storeId) : '';
    if (cid) catCount.set(cid, (catCount.get(cid) ?? 0) + 1);
    if (br) brandCount.set(br, (brandCount.get(br) ?? 0) + 1);
    if (sid) storeCount.set(sid, (storeCount.get(sid) ?? 0) + 1);
  }

  let catFixed = 0;
  for (const c of await CategoryModel.find({}).lean()) {
    const real = catCount.get(String(c._id)) ?? 0;
    if (Number(c.productCount ?? 0) !== real) {
      await CategoryModel.updateOne({ _id: c._id }, { $set: { productCount: real } });
      console.log(`[sync]   category "${c.name}": ${c.productCount} -> ${real}`);
      catFixed++;
    }
  }

  let brandFixed = 0;
  for (const b of await BrandModel.find({}).lean()) {
    const real = brandCount.get(String(b.name)) ?? 0;
    if (Number(b.productCount ?? 0) !== real) {
      await BrandModel.updateOne({ _id: b._id }, { $set: { productCount: real } });
      brandFixed++;
    }
  }

  let storeFixed = 0;
  for (const s of await StoreModel.find({}).lean()) {
    const real = storeCount.get(String(s._id)) ?? 0;
    if (Number(s.productCount ?? 0) !== real) {
      await StoreModel.updateOne({ _id: s._id }, { $set: { productCount: real } });
      storeFixed++;
    }
  }

  console.log(`[sync] Đồng bộ productCount — category: ${catFixed}, brand: ${brandFixed}, store: ${storeFixed}`);

  // ─── 4. Báo cáo ───────────────────────────────────────────────────────
  const brands = await BrandModel.find({}).lean();
  const brandNames = new Set(brands.map((b) => String(b.name)));
  const orphans = [...productBrands.keys()].filter((b) => !brandNames.has(b));
  console.log(
    `[sync] Brand còn thiếu: ${orphans.length ? orphans.join(', ') : 'không có'}`,
  );

  await disconnectDB();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
