/**
 * LÀM SẠCH POOL ẢNH MACBOOK (backend + DB).
 *
 * Vấn đề: các pool ảnh MacBook trong `model-images.json` bị trộn ảnh SAI:
 *   - `MacbookPro.png` -> KHÔNG phải ảnh sản phẩm, đó là PNG logo MacBook
 *     Pro dạng xám trong suốt (960x126) -> hiển thị như mảng trắng.
 *   - `Apple_iPhone_13_Pro_on_MacBook_Pro_*.jpg` -> ảnh iPhone đặt trên
 *     MacBook, không phải ảnh sản phẩm.
 *   - `Apple_MacBook_Pro,_model_A1278-*.jpg` (2009), `MacBookPros_13-15-17_
 *     stacked_08-2009`, `Nokia_Booklet_3G_with_Apple_15"_MacBook_Pro` ->
 *     thiết bị/thế hệ hoàn toàn khác.
 *
 * Cách sửa: mỗi model MacBook Pro có bộ ảnh riêng đúng kích thước
 * (14" hoặc 16"), lấy từ ảnh chính thức trên Wikimedia Commons.
 *
 * Chạy: npx tsx scripts/tmp/fix-macbook-image-pools.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { connectDB, disconnectDB } from '../../src/server/db';
import { ProductModel } from '../../src/server/models/Product';
import { modelName } from '../../lib/model-name';

const B = 'https://thumb.wikimedia.org/wikipedia/commons/thumb';
const Q =
  '?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail';

/** File gốc trên Commons. */
const F = {
  // ── MacBook Air ──
  air13: '3/39/MacBook_Air_%2813-inch%2C_M4%2C_Silver%29.jpg',
  air15: 'c/c0/MacBook_Air_%2815-inch%2C_M4%2C_Silver%29.jpg',

  // ── 14-inch ──
  m5_14: 'd/d7/MacBook_Pro_%2814-inch%2C_M5%2C_Space_Black%29.jpg',
  s14: '2/22/A_2021_14-inch_Silver_MacBook_Pro.jpg',
  s14c: '5/52/A_2021_14-inch_Silver_MacBook_Pro_%28cropped%29.jpg',
  b14: 'f/fb/Apple_Macbook_Pro_14%22_2021_-_Back_cover.png',
  k14: 'b/b4/Apple_Macbook_Pro_14%22_2021_-_Keyboard.png',
  pl14: 'd/d7/Apple_Macbook_Pro_14%22_2021_-_Ports_on_the_left_side.png',
  pr14: '0/03/Apple_Macbook_Pro_14%22_2021_-_Ports_on_the_right_side.png',

  // ── 14-inch M3 ──
  m3_14: 'a/a6/M3_Macbook_Pro_14_inch_Space_Grey_model.jpg',
  m3_14c: '5/58/M3_Macbook_Pro_14_inch_Space_Grey_model_%28cropped%29.jpg',

  // ── 16-inch ──
  m4p16: '4/43/MacBook_Pro_%2816-inch%2C_M4_Pro%2C_Silver%29.jpg',
  m2max16: '2/21/Apple_MacBook_Pro_16%22_M2_Max.jpg',
  m2max16b: '8/80/Apple_MacBook_Pro_16%22_M2_Max_2.jpg',
  m2max16c: 'b/b8/Apple_MacBook_Pro_16%22_M2_Max_3.jpg',
  m2max16d: 'd/de/Apple_MacBook_Pro_16%22_M2_Max_4.jpg',
  m2max16e: 'a/a8/Apple_MacBook_Pro_16%22_M2_Max_5.jpg',
  m1p16: '9/91/MacBook_Pro_16_%28M1_Pro%2C_2021%29_-_Wikipedia.jpg',
  m1p16b: '1/10/MacBook_Pro_16_%28M1_Pro%2C_2021%29_-_Wikipedia_%282%29.jpg',

  // ── 16-inch M3 Max (ảnh chính thức 16" dùng chung) ──
  m3_16: '4/40/Apple_MacBook_Pro_%28M3%29.jpg',
} as const;

/** Pool ảnh mới cho từng model. Ảnh ĐẦU là ảnh chính. */
const POOLS: Record<string, string[]> = {
  'MacBook Pro 14in M4 Pro': [
    F.m5_14,
    F.s14,
    F.s14c,
    F.b14,
    F.k14,
    F.pl14,
    F.pr14,
  ],
  'MacBook Pro 14in M3 Pro': [F.m3_14, F.m3_14c, F.s14, F.s14c, F.m5_14],
  'MacBook Pro 16in M4 Pro': [
    F.m4p16,
    F.m2max16,
    F.m2max16b,
    F.m2max16c,
    F.m2max16d,
    F.m2max16e,
    F.m1p16,
    F.m1p16b,
  ],
  'MacBook Pro 16in M3 Max': [
    F.m3_16,
    F.m4p16,
    F.m2max16,
    F.m2max16b,
    F.m2max16c,
    F.m1p16,
    F.m1p16b,
  ],
  // MacBook Air: chỉ có ảnh chính thức 13"/15" M4 Silver trên Commons.
  'MacBook Air 13in M4': [F.air13, F.m5_14, F.s14],
  'MacBook Air 15in M4': [F.air15, F.m4p16, F.m2max16],
};

function buildPool(files: string[]): string[] {
  const pool: string[] = [];
  for (const size of [960, 1280]) {
    for (const f of files) {
      const name = f.split('/').pop()!;
      pool.push(`${B}/${f}/${size}px-${name}${Q}`);
    }
  }
  return pool;
}

async function main() {
  // ─── 1. Cập nhật scripts/data/model-images.json ──────────────────────────
  const dbPath = resolve(process.cwd(), 'scripts/data/model-images.json');
  const db = JSON.parse(readFileSync(dbPath, 'utf-8')) as Record<
    string,
    { images: string[]; source: string; title: string }
  >;

  for (const [model, files] of Object.entries(POOLS)) {
    if (!db[model]) {
      console.warn(`[fix] Không có model "${model}" trong model-images.json`);
      continue;
    }
    db[model] = {
      images: buildPool(files),
      source: 'commons-curated',
      title: files[0].split('/').pop()!.replace(/%22/g, '"'),
    };
    console.log(
      `[fix] model-images.json: ${model} -> ${db[model].images.length} ảnh`,
    );
  }
  writeFileSync(dbPath, JSON.stringify(db, null, 2) + '\n');

  // ─── 2. Áp ảnh mới vào DB ───────────────────────────────────────────────
  await connectDB();

  const products = (await ProductModel.find({})
    .select('name slug images')
    .lean()) as any[];

  const byModel = new Map<string, any[]>();
  for (const p of products) {
    const key = modelName(String(p.name ?? ''));
    byModel.set(key, [...(byModel.get(key) ?? []), p]);
  }

  let total = 0;
  for (const [model, files] of Object.entries(POOLS)) {
    const rows = byModel.get(model);
    if (!rows?.length) continue;

    const pool = buildPool(files);
    const main = pool[0];
    const extras = pool.filter((u) => u !== main);

    rows.sort((a, b) =>
      String(a.slug ?? '').localeCompare(String(b.slug ?? '')),
    );

    for (let i = 0; i < rows.length; i++) {
      const p = rows[i];
      const s = i % extras.length;
      const picked = [
        extras[s],
        extras[(s + 1) % extras.length],
        extras[(s + 2) % extras.length],
      ];
      await ProductModel.updateOne(
        { _id: p._id },
        { $set: { images: [main, ...picked] } },
      );
      total++;
    }
    console.log(`[fix] ${model}: ${rows.length} sản phẩm`);
  }

  console.log(`[fix] Tổng cập nhật ${total} sản phẩm.`);
  await disconnectDB();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
