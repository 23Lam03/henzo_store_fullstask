/**
 * Sửa toàn diện ảnh & logo:
 *   1. Logo thương hiệu thật (SVG Simple Icons / Wikimedia) — thay ảnh Unsplash
 *      ngẫu nhiên & dicebear identicon.
 *   2. Tên sản phẩm bỏ hậu tố số rác ("Samsung Galaxy S24 Ultra 112").
 *   3. Ảnh đúng theo model (Wikipedia/Wikimedia) — thay ảnh dùng chung.
 *   4. Phân tán ảnh: không để 1 ảnh dùng cho hàng trăm sản phẩm.
 *
 * Chạy: npx tsx scripts/fix-all-media.ts
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { connectDB, disconnectDB } from '../src/server/db';
import { ProductModel } from '../src/server/models/Product';
import { BrandModel } from '../src/server/models/Brand';
import { brandLogo, brandColor } from '../src/server/data/brand-logos';
import {
  CATEGORY_IMAGES,
  FALLBACK_IMAGES,
} from '../src/server/data/product-images';

interface ModelImage {
  url: string;
  source: string;
  title: string;
}

/** Bỏ dung lượng -> tên model gốc. */
function modelKey(name: string): string {
  return name
    .replace(/\s+\d+(?:\.\d+)?\s*(?:GB|TB|MB)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Bỏ hậu tố số rác ở cuối tên. */
function cleanName(name: string): string {
  return name.replace(/\s+\d{1,3}$/, '').trim();
}

/** Băm chuỗi -> số nguyên ổn định (reproducible). */
function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
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

async function main() {
  await connectDB();

  // ─── 1. Logo + màu thương hiệu ─────────────────────────────────────────
  const brands = (await BrandModel.find({}).lean()) as any[];
  let brandFixed = 0;
  let brandMissing: string[] = [];

  for (const b of brands) {
    const logo = brandLogo(b.name);
    if (!logo) {
      brandMissing.push(b.name);
      continue;
    }
    await BrandModel.updateOne(
      { _id: b._id },
      { $set: { logo, color: brandColor(b.name) } },
    );
    brandFixed++;
  }
  console.log(`[media] Logo thương hiệu: ${brandFixed}/${brands.length}`);
  if (brandMissing.length) {
    console.log('[media] Chưa có logo thật:', brandMissing.join(' | '));
  }

  // ─── 2. Ảnh & tên sản phẩm ────────────────────────────────────────────
  const modelImages: Record<string, ModelImage> = (() => {
    try {
      return JSON.parse(
        readFileSync(resolve(process.cwd(), 'scripts/data/model-images.json'), 'utf-8'),
      );
    } catch {
      return {};
    }
  })();

  const products = (await ProductModel.find({})
    .select('name slug images categoryName')
    .lean()) as any[];

  // Nhóm sản phẩm theo model gốc (để gán ảnh thật cho cả nhóm).
  const byModel = new Map<string, any[]>();
  for (const p of products) {
    const key = modelKey(cleanName(p.name));
    byModel.set(key, [...(byModel.get(key) ?? []), p]);
  }

  // Ảnh thật theo model: tra theo slug của từng sản phẩm trong nhóm.
  const modelRealImage = new Map<string, string>();
  for (const [, rows] of byModel) {
    for (const r of rows) {
      const hit = modelImages[r.slug];
      if (hit?.url) {
        modelRealImage.set(modelKey(cleanName(r.name)), hit.url);
        break;
      }
    }
  }

  // Thống kê ảnh hiện tại để biết ảnh nào đang bị dùng quá nhiều.
  const usage = new Map<string, number>();
  for (const p of products) {
    const main = (p.images ?? [])[0];
    if (main) usage.set(main, (usage.get(main) ?? 0) + 1);
  }
  const overused = new Set(
    [...usage.entries()].filter(([, c]) => c > 3).map(([u]) => u),
  );
  console.log(
    `[media] Ảnh đang bị dùng quá 3 lần: ${overused.size}/${usage.size} URL`,
  );

  // Ảnh đã dùng cho model này rồi (tránh 2 sản phẩm cùng model trùng ảnh).
  const usedInModel = new Map<string, Set<string>>();
  const stats = { realImage: 0, categoryImage: 0, name: 0, slug: 0 };
  const usedSlugs = new Set<string>();

  for (const p of products) {
    const oldName = String(p.name ?? '');
    const newName = cleanName(oldName);
    const model = modelKey(newName);

    // --- Ảnh ---
    //
    // Ưu tiên:
    // 1) Ảnh thật theo model (Wikipedia/Wikimedia) — khớp tên tuyệt đối.
    // 2) Ảnh theo danh mục — chọn ảnh ít dùng nhất trong nhóm model để
    //    các bản khác nhau của cùng model không bị trùng ảnh.
    const pool = CATEGORY_IMAGES[p.categoryName] ?? FALLBACK_IMAGES;
    let images: string[];

    const real = modelRealImage.get(model);
    if (real) {
      images = [real];
      stats.realImage++;
    } else {
      // Ảnh danh mục: chọn theo thứ tự "ít dùng nhất" trong nhóm model.
      const used = usedInModel.get(model) ?? new Set<string>();
      const candidates = pool
        .filter((u) => !overused.has(u) || used.has(u))
        .concat(pool.filter((u) => overused.has(u) && !used.has(u)));
      const chosen = candidates[hashCode(p.slug) % candidates.length] ?? pool[0];
      images = [chosen];
      used.add(chosen);
      usedInModel.set(model, used);
      stats.categoryImage++;
    }

    // Ảnh phụ: lấy ảnh khác trong pool danh mục (để gallery có 3 ảnh).
    const extras = pool.filter((u) => !images.includes(u)).slice(0, 2);
    images = [...images, ...extras].slice(0, 3);

    // --- Tên & slug ---
    let slug = p.slug ? String(p.slug) : slugify(newName);
    // Slug cũ chứa hậu tố số rác -> sinh lại từ tên đã làm sạch.
    const cleanSlug = slugify(newName);
    if (cleanSlug && slug.replace(/-\d{1,3}$/, '') !== cleanSlug.replace(/-\d{1,3}$/, '')) {
      slug = cleanSlug;
    }
    if (usedSlugs.has(slug)) {
      slug = `${slug}-${hashCode(p.slug ?? p.name) % 1000}`;
    }
    usedSlugs.add(slug);

    if (newName !== oldName) stats.name++;
    if (slug !== String(p.slug ?? '')) stats.slug++;

    await ProductModel.updateOne(
      { _id: p._id },
      {
        $set: {
          name: newName,
          slug,
          images,
        },
      },
    );
  }

  console.log(
    `[media] Ảnh thật theo model: ${stats.realImage} | ` +
      `ảnh danh mục phân tán: ${stats.categoryImage} | ` +
      `đổi tên: ${stats.name} | đổi slug: ${stats.slug}`,
  );

  await disconnectDB();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
