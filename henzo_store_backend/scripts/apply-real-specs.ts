import { resolve } from 'path';
import { connectDB, disconnectDB } from '../src/server/db';
import { ProductModel } from '../src/server/models/Product';
import { specsForProduct, normalizeProductName } from '../../henzo_store/src/data/modelSpecs';
import { productDescription, productTags } from '../../henzo_store/src/data/productCopy';

const BRAND_BY_CATEGORY: Record<string, string> = {
  'Điện thoại': 'Apple',
  Laptop: 'ASUS',
  'Màn hình': 'Samsung',
  'PC Gaming': 'Intel',
  Chuột: 'Logitech',
  'Bàn phím': 'Keychron',
  'Tai nghe': 'Sony',
  'Phụ kiện': 'Belkin',
};

function inferKind(name: string, categoryName: string): string {
  const n = name.toLowerCase();
  if (categoryName === 'Điện thoại') {
    if (n.includes('ipad') || n.includes('tab s')) return 'tablet';
    return 'phone';
  }
  if (categoryName === 'Laptop') return 'laptop';
  if (categoryName === 'Tai nghe') return 'audio';
  return 'accessory';
}

function baseModel(name: string): string {
  return name
    .replace(/\s+\d+(?:\.\d+)?\s*(?:GB|TB|MB)\b/gi, ' ')
    .replace(/\s*\d{1,2}(?:\.\d+)?\s*(?:"|inch)\b/gi, ' ')
    .replace(
      /\s+(?:[A-Z][a-z]+\s+){0,2}?(?:Black|White|Gray|Grey|Silver|Titanium Gray|Natural Titanium|Deep Blue|Eclipse Gray|Tonal Silver|Moonlight White|Platinum Silver|Graphite Gray|Lunar Gray|Storm Gray|Arctic White|Titanium Black|Silver Shadow|Cobalt Violet|Forest Green|Obsidian|Porcelain|Hazel|MX Stone|Pale Gray|Carbon Black|Graphite|Chromium|Sandstone|Mango|Snow|Blue|Sand)\s*$/i,
      ' ',
    )
    .replace(/\s+/g, ' ')
    .trim();
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function main() {
  await connectDB();
  console.log('[apply-real-specs] Kết nối MongoDB...');

  const products = await ProductModel.find({}).select(
    'name slug description tags specifications categoryName brand storeId',
  );

  let specFixed = 0;
  let descFixed = 0;
  let tagFixed = 0;
  let renameFixed = 0;
  const unresolved = new Set<string>();
  const usedSlugs = new Set<string>();

  const nameCount = new Map<string, number>();

  for (const p of products) {
    const name = normalizeProductName(String(p.name));
    const categoryName = String(p.categoryName || '');
    const brand = String(p.brand || BRAND_BY_CATEGORY[categoryName] || 'Henzotech');
    const base = baseModel(name);

    const { specs, missing } = specsForProduct(name);
    if (!missing && Object.keys(specs).length) {

      const current = p.specifications;
      const currentObj =
        current instanceof Map
          ? Object.fromEntries(current.entries())
          : { ...((current as Record<string, string>) ?? {}) };
      if (JSON.stringify(currentObj) !== JSON.stringify(specs)) {
        p.specifications = new Map(Object.entries(specs));
        specFixed++;
      }
    } else {
      unresolved.add(`${categoryName} | ${name}`);
    }

    const desc = productDescription({
      productName: name,
      base,
      kind: inferKind(name, categoryName),
      category: categoryName,
      brand,
    });
    if (p.description !== desc) {
      p.description = desc;
      descFixed++;
    }
    p.shortDescription = desc.slice(0, 160);

    const tags = productTags({
      productName: name,
      base,
      kind: inferKind(name, categoryName),
      category: categoryName,
      brand,
    });
    if (JSON.stringify(p.tags ?? []) !== JSON.stringify(tags)) {
      p.tags = tags;
      tagFixed++;
    }

    const scope = `${p.storeId}|${name}`;
    const seen = (nameCount.get(scope) ?? 0) + 1;
    nameCount.set(scope, seen);

    let finalName = name;
    let finalSlug = slugify(name);
    if (seen > 1) {

      finalName = `${name} (${seen})`;
      finalSlug = slugify(finalName);
      renameFixed++;
    } else if (finalSlug !== String(p.slug)) {

      renameFixed++;
    }

    if (usedSlugs.has(finalSlug)) {
      let i = 2;
      while (usedSlugs.has(`${finalSlug}-${i}`)) i++;
      finalSlug = `${finalSlug}-${i}`;
      renameFixed++;
    }
    usedSlugs.add(finalSlug);

    p.name = finalName;
    p.slug = finalSlug;
    await p.save();
  }

  console.log(`[apply-real-specs] Sửa thông số: ${specFixed}`);
  console.log(`[apply-real-specs] Sửa mô tả:    ${descFixed}`);
  console.log(`[apply-real-specs] Sửa thẻ:      ${tagFixed}`);
  console.log(`[apply-real-specs] Đổi tên/slug: ${renameFixed}`);

  if (unresolved.size) {
    console.log(`\n[apply-real-specs] ⚠ ${unresolved.size} model CHƯA có trong bảng spec:`);
    for (const u of [...unresolved].slice(0, 40)) console.log('   ', u);
  }

  await disconnectDB();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
