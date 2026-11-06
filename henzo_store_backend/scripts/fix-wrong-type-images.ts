/**
 * SỬA ẢNH CHÍNH SAI LOẠI SẢN PHẨM.
 *
 * Vấn đề phát hiện khi audit mở rộng:
 *   29 sản phẩm có ảnh chính KHÔNG đúng loại:
 *     - "ASUS ROG Phone 9 Pro"  -> ảnh laptop Vivobook
 *     - "ASUS ZenBook 14 OLED"  -> ảnh case máy tính Amstrad NC100
 *     - "LG Gram 14"           -> ảnh panel mở máy
 *     - "ASUS ROG Delta S"     -> ảnh Zenbook
 *     - "JBL Quantum 910"     -> ảnh JBL Free (tai nghe in-ear, khác dòng)
 *     - "AirPods 4 ANC"        -> ảnh AirPods Max
 *     - "Samsung 990 PRO"      -> ảnh SSD (đúng, nhưng danh mục PC Gaming
 *                                  khiến bộ lọc ảnh loại nhầm)
 *
 * Cách sửa:
 *   1. Ảnh RIÊNG của model (model-images.json / curated-model-files.json)
 *      — luôn ưu tiên cao nhất.
 *   2. Ảnh theo LOẠI sản phẩm (type-image-pools.json) — đúng loại, khác
 *      model. Dùng cho sản phẩm không có ảnh riêng.
 *   3. Giữ nguyên ảnh hiện tại nếu không tìm được ảnh nào đúng hơn.
 *
 * Chạy: npx tsx scripts/fix-wrong-type-images.ts
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { connectDB, disconnectDB } from '../src/server/db';
import { ProductModel } from '../src/server/models/Product';
import { modelType } from './lib/model-type';
import { modelName } from './lib/model-name';

/**
 * Token đặc trưng cho loại sản phẩm — dùng để phát hiện ảnh SAI LOẠI.
 *
 * Mỗi token là một "dấu hiệu" chắc chắn không thuộc loại sản phẩm đó.
 * Ảnh chính chỉ bị coi là sai khi KHÔNG có token của loại mình VÀ có
 * token của loại khác.
 */
const TYPE_MARKERS: Record<string, string[]> = {
  'Điện thoại': ['iphone', 'galaxy', 'pixel', 'phone', 'smartphone', 'redmi', 'oneplus', 'nothing'],
  Tablet: ['ipad', 'galaxy tab', 'tablet'],
  Laptop: ['macbook', 'notebook', 'laptop', 'thinkpad', 'ideapad', 'zenbook', 'vivobook', 'xps', 'notebook'],
  'Màn hình': ['monitor', 'display', 'ultragear', 'odyssey'],
  'PC Gaming': ['tower', 'gaming pc', 'desktop'],
  Chuột: ['mouse', 'chuột', 'g502', 'deathwish'],
  'Bàn phím': ['keyboard', 'keychron', 'k70', 'hhkb', 'ducky'],
  'Tai nghe': ['headset', 'headphone', 'tai nghe', 'wh-1000', 'airpods'],
  'Phụ kiện': ['adapter', 'cable', 'hub', 'dock', 'charger', 'sạc'],
};

/**
 * Token của CÁC LOẠI KHÁC — nếu ảnh chính chỉ toàn token thuộc loại khác
 * mà không có token của loại hiện tại -> ảnh sai loại.
 */
const OTHER_MARKERS = Object.entries(TYPE_MARKERS)
  .filter(([c]) => c !== 'Điện thoại')
  .flatMap(([, t]) => t);

function hits(url: string, tokens: string[]): string[] {
  const u = decodeURIComponent(url).toLowerCase();
  return tokens.filter((t) => u.includes(t));
}

/** Kiểm tra ảnh có đúng loại sản phẩm không. */
function isWrongType(url: string, type: string): boolean {
  const own = hits(url, TYPE_MARKERS[type] ?? []);
  const other = hits(url, OTHER_MARKERS);
  return own.length === 0 && other.length > 0;
}

async function main() {
  await connectDB();
  console.log('[fix-images] Kết nối MongoDB...');

  const modelImages = JSON.parse(
    readFileSync(resolve(process.cwd(), 'scripts/data/model-images.json'), 'utf8'),
  ) as Record<string, { images: string[] }>;

  const typePools = JSON.parse(
    readFileSync(resolve(process.cwd(), 'scripts/data/type-image-pools.json'), 'utf8'),
  ) as Record<string, string[]>;

  const products = await ProductModel.find({})
    .select('name slug images categoryName brand')
    .lean();

  console.log(`[fix-images] ${products.length} sản phẩm`);

  // Ảnh chính đã dùng -> không cho dùng lại cho sản phẩm khác.
  const usedMain = new Map<string, string>();
  for (const p of products) {
    const main = String((p.images ?? [])[0] ?? '');
    if (main) usedMain.set(main, String(p.slug));
  }

  let fixed = 0;
  let unchanged = 0;
  const detail: string[] = [];

  for (const p of products) {
    const images = (p.images ?? []).map(String);
    if (!images.length) continue;
    const main = images[0];

    const type = modelType(modelName(String(p.name)), String(p.categoryName ?? ''));
    if (!isWrongType(main, type)) continue;

    const model = modelName(String(p.name));

    // 1. Ảnh riêng của model
    const own = (modelImages[model]?.images ?? []).filter(
      (u) => u !== main && !isWrongType(u, type),
    );

    // 2. Ảnh theo loại sản phẩm
    const typePool = (typePools[type] ?? []).filter(
      (u) => u !== main && !isWrongType(u, type),
    );

    let replacement = '';
    let from = '';
    for (const u of own) {
      if (!usedMain.has(u)) {
        replacement = u;
        from = 'model';
        break;
      }
    }
    if (!replacement) {
      for (const u of typePool) {
        if (!usedMain.has(u)) {
          replacement = u;
          from = 'type';
          break;
        }
      }
    }

    if (!replacement) {
      // Không có ảnh nào đúng hơn -> giữ nguyên, chỉ ghi nhận.
      unchanged++;
      detail.push(
        `  ⚠ ${p.name} [${type}] — không có ảnh thay thế đúng loại ` +
          `(${decodeURIComponent(main).split('/thumb/')[1]?.slice(0, 45)})`,
      );
      continue;
    }

    // Giữ nguyên ảnh phụ, chỉ thay ảnh chính.
    const extras = images.slice(1).filter((u) => u !== replacement);
    await ProductModel.updateOne(
      { _id: p._id },
      { $set: { images: [replacement, ...extras] } },
    );
    usedMain.delete(main);
    usedMain.set(replacement, String(p.slug));
    fixed++;
    detail.push(
      `  ✓ ${p.name} [${type}] — ảnh chính lấy từ pool "${from}": ` +
        `${decodeURIComponent(replacement).split('/thumb/')[1]?.slice(0, 50)}`,
    );
  }

  console.log(`[fix-images] Đã sửa ${fixed} sản phẩm, giữ nguyên ${unchanged}`);
  for (const d of detail) console.log(d);

  // ─── Kiểm tra lại ────────────────────────────────────────────────────
  const after = await ProductModel.find({})
    .select('name images categoryName')
    .lean();
  let remaining = 0;
  for (const p of after) {
    const main = String((p.images ?? [])[0] ?? '');
    if (!main) continue;
    const type = modelType(modelName(String(p.name)), String(p.categoryName ?? ''));
    if (isWrongType(main, type)) remaining++;
  }
  console.log(`[fix-images] Còn lại ảnh chính sai loại: ${remaining}`);

  await disconnectDB();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
