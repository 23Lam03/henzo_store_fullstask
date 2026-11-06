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
import { modelName, hashCode } from './lib/model-name';
import { modelParentChain } from './lib/model-parents';
import { modelType } from './lib/model-type';
import { isWrongType } from './lib/image-type';

interface ModelImage {
    images: string[];
  source: string;
  title: string;
}

function modelKey(name: string): string {
  return modelName(name);
}

async function main() {
  await connectDB();

  let modelImages: Record<string, ModelImage> = {};
  try {
    modelImages = JSON.parse(
      readFileSync(
        resolve(process.cwd(), 'scripts/data/model-images.json'),
        'utf-8',
      ),
    ) as Record<string, ModelImage>;
  } catch {
    console.warn('[apply] Không có model-images.json -> giữ ảnh theo danh mục.');
  }

  let typePools: Record<string, string[]> = {};
  try {
    typePools = JSON.parse(
      readFileSync(
        resolve(process.cwd(), 'scripts/data/type-image-pools.json'),
        'utf-8',
      ),
    ) as Record<string, string[]>;
  } catch {
    console.warn('[apply] Không có type-image-pools.json -> dùng ảnh danh mục.');
  }

  const products = (await ProductModel.find({})
    .select('name slug images categoryName')
    .lean()) as any[];

  const byModel = new Map<string, any[]>();
  for (const p of products) {
    const key = modelKey(String(p.name ?? ''));
    byModel.set(key, [...(byModel.get(key) ?? []), p]);
  }

  let applied = 0;
  let fallbackCount = 0;
  let inheritedCount = 0;
  const missingModels: string[] = [];

    const poolFor = (
    model: string,
    type: string,
  ): { pool: string[] | null; inherited: boolean } => {

    const own = modelImages[model]?.images?.filter(
      (u) => !isWrongType(u, type),
    );
    if (own?.length) return { pool: own, inherited: false };
    for (const parent of modelParentChain(model)) {
      const p = modelImages[parent]?.images?.filter(
        (u) => !isWrongType(u, type),
      );
      if (p?.length) return { pool: p, inherited: true };
    }
    return { pool: null, inherited: false };
  };

  const thumbOwner = new Map<string, string>();
    const reserved = new Map<string, string>();

    const pickThumb = (
    model: string,
    pool: string[] | null,
    type: string,
    catPool: string[],
    idx: number,
    offset: number,
  ): string => {
    const own = pool ?? [];
    const typePool = (typePools[type] ?? [])
      .filter((u) => !own.includes(u) && !isWrongType(u, type));
    const cats = catPool.filter(
      (u) =>
        !own.includes(u) &&
        !typePool.includes(u) &&
        !isWrongType(u, type),
    );

    const tiers = [own, typePool, cats];
    for (const tier of tiers) {
      if (!tier.length) continue;
      for (let k = 0; k < tier.length; k++) {
        const url = tier[(offset + idx + k) % tier.length];
        const owner = reserved.get(url);
        if (!owner || owner === model) return url;
      }
    }

    const all = [...own, ...typePool, ...cats];
    if (!all.length) return '';
    return all[(offset + idx) % all.length];
  };

    const pickExtras = (
    model: string,
    pool: string[] | null,
    type: string,
    catPool: string[],
    main: string,
    idx: number,
    offset: number,
    count = 2,
  ): string[] => {
    const own = pool ?? [];
    const typePool = (typePools[type] ?? []).filter(
      (u) => !isWrongType(u, type),
    );
    const cats = catPool.filter((u) => !isWrongType(u, type));
    const out: string[] = [];

    for (const tier of [own, typePool, cats]) {
      if (out.length >= count) break;
      for (let k = 0; k < tier.length; k++) {
        const url = tier[(offset + idx + k) % tier.length];
        if (url === main) continue;
        if (out.includes(url)) continue;

        const owner = reserved.get(url);
        if (owner && owner !== model) continue;
        out.push(url);
        if (out.length >= count) break;
      }
    }

    if (out.length < count) {
      for (const tier of [own, typePool, cats]) {
        for (const url of tier) {
          if (url === main) continue;
          if (out.includes(url)) continue;
          out.push(url);
          if (out.length >= count) break;
        }
        if (out.length >= count) break;
      }
    }
    out.forEach((u) => reserved.set(u, model));
    return out;
  };

  const orderedModels = [...byModel.keys()].sort((a, b) => {
    const ownA = modelImages[a]?.images?.length ?? 0;
    const ownB = modelImages[b]?.images?.length ?? 0;
    if (ownA !== ownB) return ownB - ownA;
    return a.localeCompare(b);
  });

  for (const model of orderedModels) {
    const rows = byModel.get(model)!;

    const type = modelType(model, String(rows[0]?.categoryName ?? ''));

    const { pool, inherited } = poolFor(model, type);
    if (inherited) inheritedCount += rows.length;
    if (!pool) {
      missingModels.push(model);
      fallbackCount += rows.length;
    }

    rows.sort((a, b) =>
      String(a.slug ?? '').localeCompare(String(b.slug ?? '')),
    );

    for (let idx = 0; idx < rows.length; idx++) {
      const p = rows[idx];
      const catPool = CATEGORY_IMAGES[p.categoryName] ?? FALLBACK_IMAGES;

      const offset = hashCode(model) % Math.max(pool?.length ?? 1, 1);

      const main = pickThumb(model, pool, type, catPool, idx, offset);
      if (main) {
        thumbOwner.set(main, model);
        reserved.set(main, model);
      }

      const extras = pickExtras(
        model,
        pool,
        type,
        catPool,
        main,
        idx,
        offset,
      );
      const images = [main, ...extras];

      await ProductModel.updateOne(
        { _id: p._id },
        { $set: { images } },
      );
      applied++;
    }
  }

  console.log(
    `[apply] Ảnh theo model: ${applied}/${products.length} sản phẩm ` +
      `(${byModel.size} model, ${inheritedCount} sp dùng ảnh model cha, ` +
      `${fallbackCount} sp dùng ảnh danh mục)`,
  );
  if (missingModels.length) {
    console.log(
      `[apply] Model dùng ảnh danh mục (${fallbackCount} sp): ` +
        missingModels.slice(0, 12).join(' | ') +
        (missingModels.length > 12 ? ' | ...' : ''),
    );
  }

  const after = (await ProductModel.find({})
    .select('images')
    .lean()) as any[];
  const mainCount = new Map<string, number>();
  for (const p of after) {
    const main = (p.images ?? [])[0];
    if (main) mainCount.set(main, (mainCount.get(main) ?? 0) + 1);
  }
  const dupes = [...mainCount.entries()].filter(([, c]) => c > 1);
  console.log(
    `[apply] Ảnh chính dùng chung: ${dupes.length} URL bị dùng >1 lần ` +
      `(tối đa ${dupes.length ? Math.max(...dupes.map((d) => d[1])) : 0} lần)`,
  );

  const brands = (await BrandModel.find({}).lean()) as any[];
  let brandUpdated = 0;
  for (const b of brands) {
    const logo = brandLogo(b.name);
    const color = brandColor(b.name);
    if (!logo && !color) continue;
    await BrandModel.updateOne(
      { _id: b._id },
      { $set: { logo, color } },
    );
    brandUpdated++;
  }
  console.log(`[apply] Logo thương hiệu: ${brandUpdated}/${brands.length}`);

  await disconnectDB();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
