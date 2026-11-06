import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { modelParentChain, MODEL_PARENT } from './lib/model-parents';

interface ModelImages {
  images: string[];
  source: string;
  title: string;
}

const DEST = resolve(
  process.cwd(),
  '../henzo_store/src/data/modelImages.ts',
);

function main() {
  const src = resolve(process.cwd(), 'scripts/data/model-images.json');
  let raw: Record<string, ModelImages> = {};
  try {
    raw = JSON.parse(readFileSync(src, 'utf-8'));
  } catch {
    console.warn('[gen] Không có model-images.json -> file rỗng.');
  }

  const entries = Object.entries(raw).filter(
    ([, v]) => Array.isArray(v?.images) && v.images.length > 0,
  );

  const lines: string[] = [];
  for (const [model, v] of entries.sort(([a], [b]) => a.localeCompare(b))) {
    const imgs = v.images.map((u) => `    '${u.replace(/'/g, "\\'")}',`).join('\n');
    lines.push(`  '${model.replace(/'/g, "\\'")}': [\n${imgs}\n  ],`);
  }

  const parentLines = Object.entries(MODEL_PARENT)
    .map(
      ([k, v]) =>
        `  '${k.replace(/'/g, "\\'")}': '${v.replace(/'/g, "\\'")}',`,
    )
    .join('\n');

  const out = `/**
 * ẢNH THẬT theo model sản phẩm — sinh tự động từ Wikimedia Commons.
 *
 * ⚠️  File SINH TỰ ĐỘNG — không sửa tay.
 *   cd ../henzo_store_backend && npx tsx scripts/generate-frontend-model-images.ts
 *
 * Key = TÊN MODEL chuẩn hoá, value = nhiều URL ảnh thật.
 * Dùng để thay ảnh stock trong \`products.ts\` / \`sellerData.ts\`, bảo đảm
 * ảnh luôn ĐÚNG với tên sản phẩm (iPhone 16 ≠ iPhone 15).
 */
export const MODEL_IMAGES: Record<string, string[]> = {
${lines.join('\n')}
};

/**
 * Chuẩn hoá tên sản phẩm về tên model.
 *
 * Phải GIỐNG HỆT \`henzo_store_backend/scripts/lib/model-name.ts\` để backend
 * và frontend cùng nhận diện một model.
 */
export function modelKey(name: string): string {
  let out = name
    .replace(/\\s+\\d+(?:\\.\\d+)?\\s*(?:GB|TB|MB)\\b/gi, ' ')
    .replace(/\\s+\\d+(?:\\.\\d+)?\\s*(?:Hz|W|mm)\\b/gi, ' ')
    // KICH THUOC MAN HINH (inch) PHAI GIU - no phan biet model:
    //   "MacBook Pro 16in M4 Pro"  vs  "MacBook Pro 14in M4 Pro"
    .replace(/\\s*(\\d{1,2}(?:\\.\\d+)?)\\s*(?:"|inch)(?![a-z])/gi, ' $1in');

  const colorRe =
    /\\s+(?:[A-Z][a-z]+\\s+){0,2}?(?:Black|White|Gray|Grey|Silver|Titanium Gray|Natural Titanium|Deep Blue|Eclipse Gray|Tonal Silver|Moonlight White|Platinum Silver|Graphite Gray|Lunar Gray|Storm Gray|Arctic White|Titanium Black|Silver Shadow|Cobalt Violet|Forest Green|Obsidian|Porcelain|Hazel|MX Stone|Pale Gray|Carbon Black|Graphite|Chromium|Sandstone|Mango|Snow|Blue|Sand)\\s*$/i;
  out = out.replace(colorRe, ' ');

  // Mã kỹ thuật phụ ở cuối: G614JIR, GU605MI, PHN16-72.
  // Giữ "WH-1000XM5" (phần chữ đầu <= 2 ký tự) vì đó là tên model thật.
  out = out.replace(
    /\\s+([A-Z]{1,8}-?\\d{2,}[A-Z0-9./-]*)$/,
    (full, core: string) => (core.split('-')[0].length <= 2 ? full : ''),
  );

  out = out.replace(/\\s+/g, ' ').trim();

  // Bố token inch trùng lặp: "MacBook Pro 14in M4 Pro 14in" ->
  // "MacBook Pro 14in M4 Pro" (giống hệt backend).
  const seenInch = new Set<string>();
  return out
    .split(' ')
    .filter((t) => {
      const m = t.match(/^(\\d{1,2}(?:\\.\\d+)?)in$/);
      if (!m) return true;
      if (seenInch.has(m[1])) return false;
      seenInch.add(m[1]);
      return true;
    })
    .join(' ');
}

/**
 * Model cha để fallback ảnh.
 *
 * "Samsung Galaxy S26 Ultra" -> "Samsung Galaxy S25 Ultra" -> ...
 * Ảnh model cha vẫn đúng dòng sản phẩm, đúng hãng — chỉ khác biến thể.
 */
export const MODEL_PARENT: Record<string, string> = {
${parentLines}
};

/**
 * Trả về danh sách ảnh thật cho 1 tên sản phẩm.
 *
 * Ưu tiên: ảnh của đúng model -> ảnh của model cha -> null.
 */
export function imagesForProduct(name: string): string[] | null {
  const key = modelKey(name);
  const own = MODEL_IMAGES[key];
  if (own?.length) return own;

  let cur = key;
  const seen = new Set<string>([cur]);
  for (let i = 0; i < 5; i++) {
    const parent = MODEL_PARENT[cur];
    if (!parent || seen.has(parent)) break;
    seen.add(parent);
    const hit = MODEL_IMAGES[parent];
    if (hit?.length) return hit;
    cur = parent;
  }
  return null;
}
`;

  writeFileSync(DEST, out, 'utf-8');
  console.log(
    `[gen] Đã sinh ${DEST} (${entries.length} model có ảnh, ` +
      `${Object.keys(MODEL_PARENT).length} quan hệ model cha).`,
  );

  let broken = 0;
  for (const [m] of entries) {
    for (const p of modelParentChain(m)) {
      if (!raw[p]?.images?.length) {
        broken++;
        break;
      }
    }
  }
  if (broken) {
    console.warn(
      `[gen] ⚠️ ${broken} model có cha chưa có ảnh (sẽ fallback ảnh danh mục).`,
    );
  }
}

main();
