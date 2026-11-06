/**
 * Dọn sản phẩm CŨ (không còn trong dữ liệu mock hiện tại) rồi nạp lại.
 *
 * Vì sao cần:
 * - Trước đây `sellerData.ts` sinh tên kiểu "iPhone 16 Pro Max 256GB 437"
 *   (tên rác do modulo 20 tên). Các sản phẩm này đã nằm trong DB và vẫn
 *   hiện trên trang chủ -> ảnh sai, tên sai.
 * - `seed.ts --reset` xoá TOÀN BỘ dữ liệu (user, order, thanh toán...) — quá
 *   nặng cho việc chỉ sửa ảnh.
 *
 * Script này chỉ:
 *   1. Xoá các sản phẩm KHÔNG còn trong `frontend-mock.json`.
 *   2. Upsert lại toàn bộ sản phẩm từ mock (tên, slug, ảnh, giá...).
 *
 * Chạy: npx tsx scripts/refresh-products.ts
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { connectDB, disconnectDB } from '../src/server/db';
import { ProductModel } from '../src/server/models/Product';
import { modelName } from './lib/model-name';
import { modelParentChain } from './lib/model-parents';

interface ModelImages {
  images: string[];
  source: string;
  title: string;
}

function loadModelImages(): Record<string, ModelImages> {
  try {
    const raw = JSON.parse(
      readFileSync(resolve(process.cwd(), 'scripts/data/model-images.json'), 'utf-8'),
    ) as Record<string, any>;
    const out: Record<string, ModelImages> = {};
    for (const [k, v] of Object.entries(raw)) {
      if (Array.isArray(v?.images) && v.images.length) {
        out[k] = { images: v.images, source: v.source ?? '', title: v.title ?? k };
      }
    }
    return out;
  } catch {
    return {};
  }
}

async function main() {
  await connectDB();

  const mock = JSON.parse(
    readFileSync(
      resolve(process.cwd(), 'scripts/data/frontend-mock.json'),
      'utf-8',
    ),
  ) as any;

  const MODEL_IMAGES = loadModelImages();

  /** Tìm pool ảnh thật cho 1 tên sản phẩm (kèm fallback model cha). */
  const poolFor = (name: string): string[] | null => {
    const own = MODEL_IMAGES[modelName(name)]?.images;
    if (own?.length) return own;
    for (const parent of modelParentChain(modelName(name))) {
      const p = MODEL_IMAGES[parent]?.images;
      if (p?.length) return p;
    }
    return null;
  };

  // ─── 1. Xoá sản phẩm không còn trong mock ──────────────────────────────────
  const keepSlugs = new Set<string>([
    ...mock.products.map((p: any) => p.slug),
    ...(mock.sellerProducts ?? []).map((p: any) => p.slug),
  ]);
  const stale = await ProductModel.find({ slug: { $nin: [...keepSlugs] } })
    .select('slug name')
    .lean();
  if (stale.length) {
    await ProductModel.deleteMany({ slug: { $nin: [...keepSlugs] } });
    console.log(
      `[refresh] Đã xoá ${stale.length} sản phẩm cũ (tên rác / đã bỏ).`,
    );
    console.log(
      '[refresh]   mẫu: ' +
        stale
          .slice(0, 8)
          .map((p: any) => p.name)
          .join(' | '),
    );
  } else {
    console.log('[refresh] Không có sản phẩm cũ nào cần xoá.');
  }

  // ─── 2. Cập nhật lại ảnh + tên cho toàn bộ sản phẩm còn lại ────────────────
  const all = [...mock.products, ...(mock.sellerProducts ?? [])];
  const variantCounter = new Map<string, number>();
  let updated = 0;
  let withReal = 0;

  for (const p of all) {
    const model = modelName(p.name);
    const pool = poolFor(p.name);

    let images: string[];
    if (pool?.length) {
      withReal++;
      // Xoay vòng ảnh theo thứ tự biến thể của cùng model -> giao diện
      // không bị lặp ảnh chính.
      const n = variantCounter.get(model) ?? 0;
      variantCounter.set(model, n + 1);
      const k = n % pool.length;
      const rotated = [...pool.slice(k), ...pool.slice(0, k)];
      // Giữ thêm ảnh stock gốc cho trang chi tiết (nhiều góc nhìn).
      const extra = (p.images ?? []).filter((u: string) => !rotated.includes(u));
      images = [...rotated, ...extra].slice(0, 8);
    } else {
      images = p.images ?? [];
    }

    const res = await ProductModel.updateOne(
      { slug: p.slug },
      {
        $set: {
          name: p.name,
          description: p.description,
          images,
          price: p.price,
          originalPrice: p.originalPrice,
          discount: p.discount,
          brand: p.brand,
          categoryName: p.categoryName,
          rating: p.rating,
          reviewCount: p.reviewCount,
          stock: p.stock,
          sold: p.sold,
          tags: p.tags,
          specifications: p.specifications,
          isFeatured: p.isFeatured,
          isNew: p.isNew,
          isHot: p.isHot,
          status: 'active',
        },
      },
    );
    if (res.modifiedCount) updated++;
  }

  console.log(
    `[refresh] Đã cập nhật ${updated}/${all.length} sản phẩm ` +
      `(${withReal} có ảnh thật theo model).`,
  );

  // ─── 3. Báo cáo ảnh chính còn trùng nhau ───────────────────────────────────
  const after = (await ProductModel.find({}).select('images').lean()) as any[];
  const counts = new Map<string, number>();
  for (const p of after) {
    const main = (p.images ?? [])[0];
    if (main) counts.set(main, (counts.get(main) ?? 0) + 1);
  }
  const dupes = [...counts.entries()].filter(([, c]) => c > 1);
  console.log(
    `[refresh] Ảnh chính dùng chung: ${dupes.length} URL bị dùng >1 lần ` +
      `(tối đa ${dupes.length ? Math.max(...dupes.map((d) => d[1])) : 0} lần)`,
  );

  await disconnectDB();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
