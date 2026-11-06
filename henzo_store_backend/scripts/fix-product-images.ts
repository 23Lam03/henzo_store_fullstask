import { connectDB, disconnectDB } from '../src/server/db';
import { ProductModel } from '../src/server/models/Product';
import {
  CATEGORY_IMAGES,
  FALLBACK_IMAGES,
} from '../src/server/data/product-images';
import { inferBrand, inferCategory } from '../src/server/data/product-classify';

function isFakeId(url: string): boolean {
  const slug = url.split('?')[0].split('/photo-')[1] ?? '';
  return slug.length < 20;
}

const REJECTED_IMAGES = new Set([
  'https://images.unsplash.com/photo-1512470604395-f0b3f83454e0?w=600',
  'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600',
  'https://images.unsplash.com/photo-1603891128711-11b4b03bb138?w=600',
  'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=600',
  'https://images.unsplash.com/photo-1615971677499-5467cbab01c0?w=600',
  'https://images.unsplash.com/photo-1544427920-c49ccfb85579?w=600',
  'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600',
  'https://images.unsplash.com/photo-1616763355548-1b606f439f86?w=600',
]);

function stripNumericSuffix(name: string): string {
  return name.replace(/\s\d+$/, '').trim();
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90);
}

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

const IMAGE_CATEGORY: Record<string, string> = {};
for (const [category, list] of Object.entries(CATEGORY_IMAGES)) {
  for (const url of list) IMAGE_CATEGORY[url] = category;
}

const SHARED_IMAGE_CATS = new Set(['Laptop', 'Điện thoại', 'PC Gaming']);

function imageCategories(images: string[]): string[] {
  const cats = new Set<string>();
  for (const u of images) {
    const c = IMAGE_CATEGORY[u];
    if (c) cats.add(c);
  }
  return [...cats];
}

function pickImages(pool: string[], seed: number, count = 3): string[] {
  const usable = pool.filter((u) => !REJECTED_IMAGES.has(u));
  const source = usable.length ? usable : FALLBACK_IMAGES;
  const out: string[] = [];
  let i = seed % source.length;
  let guard = 0;
  while (out.length < count && guard < source.length * 2) {
    const url = source[i % source.length];
    if (!out.includes(url)) out.push(url);
    i++;
    guard++;
  }
  return out;
}

async function main() {
  await connectDB();
  const docs = await ProductModel.find({}).lean();
  console.log(`[fix] Tổng ${docs.length} sản phẩm`);

  const stats = {
    images: 0,
    category: 0,
    brand: 0,
    name: 0,
    slug: 0,
    unresolvedCategory: 0,
  };
  const usedSlugs = new Set<string>();
  const unresolved = new Set<string>();

  const nameCounts = new Map<string, number>();
  for (const d of docs as any[]) {
    const base = stripNumericSuffix(String(d.name ?? '')).toLowerCase();
    nameCounts.set(base, (nameCounts.get(base) ?? 0) + 1);
  }
  const duplicateNames = new Set(
    [...nameCounts.entries()].filter(([, c]) => c > 1).map(([k]) => k),
  );

  for (const d of docs as any[]) {
    const oldName = String(d.name ?? '');
    const newName = stripNumericSuffix(oldName);
    const baseName = newName.toLowerCase();

    const inferredCat = inferCategory(newName);
    const oldCat = String(d.categoryName ?? '');
    const category = inferredCat ?? oldCat;
    if (inferredCat && inferredCat !== oldCat) stats.category++;
    if (!inferredCat) {
      stats.unresolvedCategory++;
      unresolved.add(`${newName} (${oldCat})`);
    }

    const inferredBrand = inferBrand(newName);
    const oldBrand = String(d.brand ?? '');
    const brand = inferredBrand ?? oldBrand;
    if (inferredBrand && inferredBrand !== oldBrand) stats.brand++;

    const pool = CATEGORY_IMAGES[category] ?? FALLBACK_IMAGES;
    const oldImages = (d.images ?? []) as string[];
    const usableImages = oldImages.filter(
      (u) => !isFakeId(u) && !REJECTED_IMAGES.has(u),
    );

    const oldImageCats = imageCategories(oldImages);
    const imageFits =
      usableImages.length > 0 &&
      oldImageCats.every((c) => c === category || SHARED_IMAGE_CATS.has(c));

    const images = imageFits
      ? usableImages
      : pickImages(pool, hashCode(String(d._id)));
    if (!imageFits) stats.images++;

    const isDuplicateName = duplicateNames.has(baseName);
    const finalName = isDuplicateName ? oldName : newName;
    if (finalName !== oldName) stats.name++;

    let slug = slugify(finalName) || slugify(oldName) || `product-${hashCode(String(d._id))}`;
    if (usedSlugs.has(slug)) {
      slug = `${slug}-${hashCode(String(d._id)) % 1000}`;
    }
    usedSlugs.add(slug);
    if (slug !== String(d.slug ?? '')) stats.slug++;

    await ProductModel.updateOne(
      { _id: d._id },
      {
        $set: {
          name: finalName,
          slug,
          categoryName: category,
          brand,
          images: images.length ? images : pickImages(pool, hashCode(String(d._id))),
        },
      },
    );
  }

  console.log(
    `[fix] Ảnh: ${stats.images} | Danh mục: ${stats.category} | ` +
      `Thương hiệu: ${stats.brand} | Tên: ${stats.name} | Slug: ${stats.slug}`,
  );
  console.log(`[fix] Không suy ra được danh mục: ${stats.unresolvedCategory}`);
  if (unresolved.size) {
    console.log('[fix] Ví dụ:', [...unresolved].slice(0, 10).join(' | '));
  }
  await disconnectDB();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
