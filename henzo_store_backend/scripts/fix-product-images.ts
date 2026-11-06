/**
 * Gán lại ảnh / danh mục / thương hiệu / tên / slug cho sản phẩm.
 *
 * Vấn đề gốc phát hiện khi audit:
 * 1. 500/601 sản phẩm (nhóm `mockSellerProducts`) có URL ảnh **bịa** —
 *    `photo-1550000000000` → HTTP 404, hiển thị ô trống.
 * 2. `categoryName` / `brand` bị random lúc seed nên **không khớp tên**:
 *    470/601 sai danh mục, 268/601 sai thương hiệu.
 * 3. Tên sản phẩm bị gắn hậu tố số ngẫu nhiên ("AMD Ryzen 9 7950X 42").
 * 4. Ảnh curated có URL chết / sai danh mục (sofa cho điện thoại, đám đông
 *    cho PC gaming, bàn gỗ cho màn hình).
 *
 * Cách sửa:
 * - Suy ra danh mục & thương hiệu **từ tên sản phẩm** (`product-classify.ts`).
 * - Chọn ảnh theo danh mục đã suy ra, lấy từ bảng ảnh đã kiểm chứng bằng
 *   Vision framework (đúng loại thiết bị) và đã kiểm tra HTTP 200.
 * - Bỏ hậu tố số ngẫu nhiên khỏi tên, sinh lại slug.
 *
 * Chạy: npx tsx scripts/fix-product-images.ts
 */
import { connectDB, disconnectDB } from '../src/server/db';
import { ProductModel } from '../src/server/models/Product';
import {
  CATEGORY_IMAGES,
  FALLBACK_IMAGES,
} from '../src/server/data/product-images';
import { inferBrand, inferCategory } from '../src/server/data/product-classify';

/** Unsplash photo id thật có 26-27 ký tự; id giả từ công thức cộng chỉ có 13. */
function isFakeId(url: string): boolean {
  const slug = url.split('?')[0].split('/photo-')[1] ?? '';
  return slug.length < 20;
}

/**
 * Ảnh đã bị Vision framework xác minh là SAI danh mục — không dùng lại.
 *
 * - `photo-1512470604395` : HTTP 404 (ảnh không tồn tại)
 * - `photo-1592750475338` : "document/screenshot"
 * - `photo-1603891128711` : "document/screenshot" 91%
 * - `photo-1591337676887` : "document/screenshot" 85%
 * - `photo-1615971677499` : "furniture/sofa" 70%
 * - `photo-1544427920`    : "people/crowd" 86%
 * - `photo-1587202372775` : "music/speakers" 29%
 * - `photo-1616763355548` : "wood_processed" 85%
 */
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

/** Bỏ hậu tố số ở cuối tên ("AMD Ryzen 9 7950X 42" -> "AMD Ryzen 9 7950X"). */
function stripNumericSuffix(name: string): string {
  return name.replace(/\s\d+$/, '').trim();
}

/** Sinh slug từ tên. */
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

/** Băm chuỗi -> số nguyên ổn định (reproducible, không dùng Math.random). */
function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * Danh mục mà mỗi ảnh trong bảng `CATEGORY_IMAGES` thuộc về.
 *
 * Dùng để biết ảnh cũ của sản phẩm có đúng danh mục không.
 */
const IMAGE_CATEGORY: Record<string, string> = {};
for (const [category, list] of Object.entries(CATEGORY_IMAGES)) {
  for (const url of list) IMAGE_CATEGORY[url] = category;
}

/**
 * Hai danh mục dùng chung ảnh là hợp lý (thiết bị điện tử giống nhau).
 *
 * Ví dụ ảnh laptop dùng cho "Laptop" và "Điện thoại" — vẫn chấp nhận được.
 */
const SHARED_IMAGE_CATS = new Set(['Laptop', 'Điện thoại', 'PC Gaming']);

/** Danh mục của các ảnh đang gán (bỏ qua ảnh không nằm trong bảng). */
function imageCategories(images: string[]): string[] {
  const cats = new Set<string>();
  for (const u of images) {
    const c = IMAGE_CATEGORY[u];
    if (c) cats.add(c);
  }
  return [...cats];
}

/** Chọn 3 ảnh khác nhau từ pool, ưu tiên ảnh chưa bị loại. */
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

  // Tập tên gốc xuất hiện nhiều lần — các sản phẩm này giữ hậu tố số.
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

    // --- Danh mục & thương hiệu suy ra từ TÊN ---
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

    // --- Ảnh: chọn theo danh mục đã suy ra ---
    //
    // Ảnh cũ chỉ được giữ nếu: còn sống (không phải URL giả) VÀ không nằm
    // trong danh sách ảnh đã bị Vision xác minh sai danh mục.
    const pool = CATEGORY_IMAGES[category] ?? FALLBACK_IMAGES;
    const oldImages = (d.images ?? []) as string[];
    const usableImages = oldImages.filter(
      (u) => !isFakeId(u) && !REJECTED_IMAGES.has(u),
    );

    // Ảnh cũ thuộc đúng danh mục của sản phẩm không? Nếu không, phải thay.
    const oldImageCats = imageCategories(oldImages);
    const imageFits =
      usableImages.length > 0 &&
      oldImageCats.every((c) => c === category || SHARED_IMAGE_CATS.has(c));

    const images = imageFits
      ? usableImages
      : pickImages(pool, hashCode(String(d._id)));
    if (!imageFits) stats.images++;

    // --- Slug ---
    //
    // Nhiều sản phẩm có cùng tên gốc (vd "iPhone 16 Pro Max 256GB" lặp
    // 20 lần với hậu tố số). Bỏ hậu tố làm chúng trùng tên — nên với các
    // sản phẩm trùng gốc, giữ lại hậu tố số để phân biệt & giữ đúng ý
    // nghĩa "phiên bản khác nhau của cùng model".
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
