/**
 * Đồng bộ ảnh THẬT (đã resolve từ Wikimedia) vào dữ liệu mock của frontend.
 *
 * Vì sao cần:
 * - `henzo_store/src/data/products.ts` và `sellerData.ts` là FALLBACK khi
 *   backend chưa sẵn sàng. Nếu chúng giữ ảnh stock Unsplash thì người dùng
 *   lại thấy ảnh sai.
 * - Sau khi đồng bộ, cả frontend lẫn backend đều trỏ tới CÙNG bộ ảnh thật
 *   -> không còn sự khác biệt giữa 2 nguồn.
 *
 * Chạy: npx tsx scripts/sync-frontend-images.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { modelName } from './lib/model-name';
import { modelParentChain } from './lib/model-parents';

interface ModelImages {
  images: string[];
  source: string;
  title: string;
}

/** Đường dẫn thư mục data của frontend. */
const FRONTEND_DATA = resolve(process.cwd(), '../henzo_store/src/data');

function loadModelImages(): Record<string, ModelImages> {
  const p = resolve(process.cwd(), 'scripts/data/model-images.json');
  try {
    const raw = JSON.parse(readFileSync(p, 'utf-8')) as Record<string, any>;
    const out: Record<string, ModelImages> = {};
    for (const [k, v] of Object.entries(raw)) {
      if (Array.isArray(v?.images) && v.images.length) {
        out[k] = {
          images: v.images,
          source: String(v.source ?? ''),
          title: String(v.title ?? k),
        };
      }
    }
    return out;
  } catch {
    return {};
  }
}

/**
 * Ghi ảnh thật vào mảng `images` của một khối sản phẩm trong file TS.
 *
 * File frontend là TypeScript sinh tay, nên ta thay thế theo vị trí dòng
 * để giữ nguyên format (dấu nháy đơn, thụt lề).
 */
function replaceImagesBlock(
  source: string,
  startIdx: number,
  newImages: string[],
): string {
  const open = source.indexOf('images: [', startIdx);
  if (open < 0) return source;
  const close = source.indexOf('],', open);
  if (close < 0) return source;

  // Giữ thụt lề của dòng `images: [`.
  const lineStart = source.lastIndexOf('\n', open) + 1;
  const indent = source.slice(lineStart, open);

  const body = newImages.map((u) => `${indent}  '${u}',`).join('\n');
  const block = `images: [\n${body}\n${indent}]`;

  return source.slice(0, open) + block + source.slice(close + 2);
}

async function main() {
  const MODEL_IMAGES = loadModelImages();
  const modelKeys = Object.keys(MODEL_IMAGES);
  console.log(`[sync] Có ảnh thật cho ${modelKeys.length} model.`);
  if (!modelKeys.length) {
    console.warn('[sync] Chạy `npx tsx scripts/resolve-model-images.ts` trước.');
    return;
  }

  /** Tìm pool ảnh cho 1 tên sản phẩm (kèm fallback model cha). */
  const poolFor = (name: string): string[] | null => {
    const own = MODEL_IMAGES[modelName(name)]?.images;
    if (own?.length) return own;
    for (const parent of modelParentChain(modelName(name))) {
      const p = MODEL_IMAGES[parent]?.images;
      if (p?.length) return p;
    }
    return null;
  };

  // ─── 1. products.ts ────────────────────────────────────────────────────────
  const productsPath = resolve(FRONTEND_DATA, 'products.ts');
  let productsSrc = readFileSync(productsPath, 'utf-8');
  const before = productsSrc;

  // Mỗi sản phẩm bắt đầu bằng `name: '...'`.
  const nameRe = /name:\s*'([^']+)'/g;
  let m: RegExpExecArray | null;
  const patches: Array<{ start: number; images: string[] }> = [];
  while ((m = nameRe.exec(productsSrc))) {
    const pool = poolFor(m[1]);
    if (!pool?.length) continue;
    patches.push({ start: m.index, images: pool.slice(0, 5) });
  }

  // Áp từ CUỐI về ĐẦU để không làm lệch chỉ số.
  for (const p of patches.reverse()) {
    productsSrc = replaceImagesBlock(productsSrc, p.start, p.images);
  }
  if (productsSrc !== before) {
    writeFileSync(productsPath, productsSrc, 'utf-8');
    console.log(`[sync] products.ts: cập nhật ${patches.length} sản phẩm.`);
  } else {
    console.log('[sync] products.ts: không có thay đổi.');
  }

  console.log('[sync] Hoàn tất.');
}

main().catch((e) => {
  console.error('[sync] Lỗi:', e);
  process.exit(1);
});
