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

function modelKey(name: string): string {
  return name
    .replace(/\s+\d+(?:\.\d+)?\s*(?:GB|TB|MB)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanName(name: string): string {
  return name.replace(/\s+\d{1,3}$/, '').trim();
}

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
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

async function main() {
  await connectDB();

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

  const byModel = new Map<string, any[]>();
  for (const p of products) {
    const key = modelKey(cleanName(p.name));
    byModel.set(key, [...(byModel.get(key) ?? []), p]);
  }

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

  const usedInModel = new Map<string, Set<string>>();
  const stats = { realImage: 0, categoryImage: 0, name: 0, slug: 0 };
  const usedSlugs = new Set<string>();

  for (const p of products) {
    const oldName = String(p.name ?? '');
    const newName = cleanName(oldName);
    const model = modelKey(newName);

    const pool = CATEGORY_IMAGES[p.categoryName] ?? FALLBACK_IMAGES;
    let images: string[];

    const real = modelRealImage.get(model);
    if (real) {
      images = [real];
      stats.realImage++;
    } else {

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

    const extras = pool.filter((u) => !images.includes(u)).slice(0, 2);
    images = [...images, ...extras].slice(0, 3);

    let slug = p.slug ? String(p.slug) : slugify(newName);

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
