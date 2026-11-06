/**
 * Áp dụng ảnh THẬT theo model + logo thương hiệu thật vào MongoDB.
 *
 * Vấn đề người dùng báo: "ảnh bị trùng lặp khi hiển thị lên giao diện" —
 * mọi sản phẩm cùng model dùng CHUNG một URL ảnh, nên danh sách lặp hàng
 * chục dòng giống hệt nhau.
 *
 * Cách sửa:
 * 1. Ảnh sản phẩm: dùng `scripts/data/model-images.json` — mỗi model có
 *    NHIỀU ảnh thật (Wikipedia/Wikimedia). Các biến thể của cùng model
 *    **xoay vòng** qua các ảnh đó nên không 2 sản phẩm nào trùng ảnh chính.
 * 2. Logo thương hiệu: bảng `brand-logos.ts` (Simple Icons + Wikimedia),
 *    hãng không có logo tự do thì dùng monogram SVG tự sinh.
 * 3. Màu thương hiệu: lấy từ `BRAND_COLORS`.
 *
 * Chạy: npx tsx scripts/apply-real-images.ts
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
import { modelName, hashCode } from './lib/model-name';
import { modelParentChain } from './lib/model-parents';
import { modelType } from './lib/model-type';
import { isWrongType } from './lib/image-type';

interface ModelImage {
  /** Nhiều ảnh thật của model (khác nhau). */
  images: string[];
  source: string;
  title: string;
}

/**
 * Gom sản phẩm theo model.
 *
 * Dùng chung `modelName()` của `lib/model-name.ts` để chuẩn hoá tên (bỏ
 * dung lượng, màu, mã kỹ thuật phụ) -> "ASUS ROG Harpe Ace Eclipse Gray"
 * và "ASUS ROG Harpe Ace" là CÙNG một thiết bị, phải gom chung để ảnh
 * xoay vòng đúng.
 */
function modelKey(name: string): string {
  return modelName(name);
}

async function main() {
  await connectDB();

  // ─── 1. Ảnh sản phẩm theo model ────────────────────────────────────────
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

  // Pool ảnh theo LOẠI sản phẩm (40 ảnh/loại) — dùng khi model không có
  // ảnh riêng. Nhờ vậy mỗi model thiếu ảnh nhận một ảnh KHÁC NHAU thay vì
  // trùng với nhau.
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

  // Gom sản phẩm theo model để xoay vòng ảnh trong nhóm.
  const byModel = new Map<string, any[]>();
  for (const p of products) {
    const key = modelKey(String(p.name ?? ''));
    byModel.set(key, [...(byModel.get(key) ?? []), p]);
  }

  let applied = 0;
  let fallbackCount = 0;
  let inheritedCount = 0;
  const missingModels: string[] = [];

  /**
   * Tìm pool ảnh thật cho 1 model.
   *
   * Thứ tự ưu tiên:
   *   1. Ảnh của đúng model.
   *   2. Ảnh của model CHA (ví dụ "Samsung Galaxy S26 Ultra" -> "S25 Ultra"
   *      -> "S24 Ultra"). Ảnh vẫn đúng dòng sản phẩm, đúng hãng.
   *   3. Ảnh theo danh mục (fallback cuối cùng).
   */
  const poolFor = (
    model: string,
    type: string,
  ): { pool: string[] | null; inherited: boolean } => {
    // Chỉ giữ ảnh ĐÚNG LOẠI sản phẩm — pool của một model có thể lẫn ảnh
    // loại khác (vd pool "Vivo X200" chứa ảnh laptop Vivobook -> điện thoại
    // bị gán ảnh laptop).
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

  // ─── 3. Không để 2 model khác nhau dùng CHUNG ảnh chính ────────────────
  //
  // Vấn đề: nhiều model kế thừa cùng một pool ảnh (VD "iPhone 16 Plus"
  // mượn pool của "iPhone 16") -> ảnh chính trùng giữa 2 dòng sản phẩm
  // khác nhau, người dùng thấy "ảnh bị trùng lặp".
  //
  // Cách sửa: mỗi URL ảnh chính được "đặt trước" cho đúng 1 model. Model
  // nào đã dùng hết pool riêng thì mới nhận ảnh dư từ model khác.
  const thumbOwner = new Map<string, string>(); // url -> model đã dùng
  /** url -> model đã "đặt trước" (áp dụng cho cả ảnh chính lẫn ảnh phụ). */
  const reserved = new Map<string, string>();

  /**
   * Chọn ảnh chính chưa bị model khác chiếm.
   *
   * Thứ tự ưu tiên (quan trọng về mặt nghiệp vụ):
   *   1. Ảnh RIÊNG của model (đúng model nhất).
   *   2. Ảnh theo LOẠI sản phẩm (đúng loại: bàn phím Corsair vẫn là ảnh
   *      bàn phím, không phải ảnh chuột).
   *   3. Ảnh theo danh mục (fallback cuối cùng).
   *   4. Ảnh của model khác (cuối cùng — có thể sai loại).
   *
   * Bước 2 tồn tại để tránh trường hợp tai nghe Corsair bị gán ảnh
   * chuột Corsair chỉ vì model cha hết ảnh.
   */
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
    // Cuối cùng: dùng lại ảnh của model khác.
    const all = [...own, ...typePool, ...cats];
    if (!all.length) return '';
    return all[(offset + idx) % all.length];
  };

  /**
   * Ảnh phụ — cũng phải KHÁC ảnh chính VÀ khác ảnh phụ đã chọn, đồng thời
   * không trùng với ảnh của model khác.
   *
   * Dùng `reserved` (url -> model) thay vì chỉ `thumbOwner` để ảnh phụ cũng
   * được "đặt trước" — tránh việc 2 model khác nhau cùng có 1 ảnh phụ.
   */
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
        // Ảnh đã thuộc model khác -> ưu tiên ảnh khác.
        const owner = reserved.get(url);
        if (owner && owner !== model) continue;
        out.push(url);
        if (out.length >= count) break;
      }
    }

    // Nếu vẫn thiếu (pool nhỏ) -> lấy ảnh đã dùng, chấp nhận trùng ảnh phụ.
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

  // Ưu tiên xử lý model CÓ ảnh riêng trước, để chúng "giữ" ảnh của mình
  // trước khi model kế thừa (model cha) tới xin.
  const orderedModels = [...byModel.keys()].sort((a, b) => {
    const ownA = modelImages[a]?.images?.length ?? 0;
    const ownB = modelImages[b]?.images?.length ?? 0;
    if (ownA !== ownB) return ownB - ownA;
    return a.localeCompare(b);
  });

  for (const model of orderedModels) {
    const rows = byModel.get(model)!;

    // Loại sản phẩm của model -> quyết định pool ảnh fallback.
    const type = modelType(model, String(rows[0]?.categoryName ?? ''));

    const { pool, inherited } = poolFor(model, type);
    if (inherited) inheritedCount += rows.length;
    if (!pool) {
      missingModels.push(model);
      fallbackCount += rows.length;
    }

    // Sắp xếp theo slug để thứ tự xoay vòng ổn định giữa các lần chạy.
    rows.sort((a, b) =>
      String(a.slug ?? '').localeCompare(String(b.slug ?? '')),
    );

    for (let idx = 0; idx < rows.length; idx++) {
      const p = rows[idx];
      const catPool = CATEGORY_IMAGES[p.categoryName] ?? FALLBACK_IMAGES;

      // OFFSET theo model: nhiều model dùng chung pool (kế thừa từ model cha)
      // -> nếu cùng bắt đầu từ index 0, chúng sẽ chọn TRÙNG ảnh đầu tiên.
      // Offset băm theo tên model giúp mỗi model chiếm một vị trí khác nhau.
      const offset = hashCode(model) % Math.max(pool?.length ?? 1, 1);

      const main = pickThumb(model, pool, type, catPool, idx, offset);
      if (main) {
        thumbOwner.set(main, model);
        reserved.set(main, model);
      }

      // Ảnh phụ: mỗi biến thể cũng nên có ảnh KHÁC NHAU (ảnh 2, 3) để
      // không bị lặp trong danh sách.
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

  // Kiểm tra ảnh chính còn trùng nhau không.
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

  // ─── 2. Logo + màu thương hiệu ─────────────────────────────────────────
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
