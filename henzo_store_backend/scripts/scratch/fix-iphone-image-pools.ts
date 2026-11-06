/**
 * LÀM SẠCH POOL ẢNH IPHONE (backend + DB).
 *
 * Vấn đề: pool ảnh iPhone bị "bôi" 130+ URL gộp từ nhiều nguồn, trong đó
 * rất nhiều ảnh SAI hoàn toàn:
 *   - ảnh linh kiện iPhone 4/5/5s/6s (main board, front panel, camera...)
 *   - ảnh iPhone X / XS / SE / 5c / 12 Pro
 *   - ảnh AirPods, iPad, Apple Watch
 *   - ảnh HONOR Magic7 / Magic V3 (đối thủ, không phải iPhone)
 *   - ảnh iPhone 16 Pro Max / iPhone 17 Pro Max (khác đời)
 *
 * Hệ quả: sản phẩm "iPhone 15 Pro Max 256GB" hiển thị ảnh góc cạnh mờ
 * (`Side_of_iPhone_15_Pro_Max_-_3.jpg`) làm ảnh chính, hoặc ảnh của đời
 * khác.
 *
 * Cách sửa: mỗi model iPhone có bộ ảnh riêng, đúng đời, lấy từ ảnh chính
 * thức trên Wikimedia Commons.
 *
 * Chạy: npx tsx scripts/tmp/fix-iphone-image-pools.ts
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
  // ── iPhone 15 Pro Max ──
  m15pm_a: 'c/c2/IPhone_15_Pro_Max_20240225.jpg',
  m15pm_b: '9/99/IPhone_15_Pro_Max.jpg',
  m15pm_c: 'f/f3/IPhone_15_Pro_Max.jpeg',
  m15pm_d: '4/44/IPhone_15_Pro_Max.JPG',
  m15pm_e: '8/8c/IPhone_15_Pro_Max_and_the_box%2C_2023%2C_01.jpg',
  m15pm_f: '4/47/IPhone_15_Pro_Max_and_the_box%2C_2023%2C_02.jpg',
  m15pm_side: 'a/a4/Side_of_iPhone_15_Pro_Max_-_3.jpg',
  m15pm_front: '4/42/Front_of_iPhone_15_Pro_Max.jpg',
  m15pm_cam: '1/1d/IPhone_15_Pro_Max_Camera.jpg',

  // ── iPhone 15 Pro ──
  m15p_a: '3/3e/IPhone_15_Pro_20240225.jpg',
  m15p_b: '4/43/IPhone_15_Pro.jpg',
  m15p_c: '6/61/IPhone_15_Pro.jpeg',
  m15p_d: '1/1b/IPhone_15_Pro_2024.jpg',
  m15p_e: '1/19/Apple_iPhone_15_Pro.jpg',
  m15p_pair: 'c/ca/IPhone_15_Pro_%26_iPhone_15_Pro_Max.jpg',

  // ── iPhone 15 ──
  m15_a: '6/6c/Apple_iPhone_15.jpeg',
  m15_b: '4/48/Apple_iPhone_15.jpg',
  m15_c: '5/5d/Apple_iPhone_15.png',
  m15_pink: '5/5c/Apple_iPhone_15_Pink_%28November_1%2C_2024%29.jpg',

  // ── iPhone 16 Pro Max ──
  m16pm_a: 'a/ad/About_iPhone_16_Pro_Max_Natural_Titanium.jpg',
  m16pm_b: 'b/bd/IPhone_16_Pro_Max_White_256g.jpg',
  m16pm_c: 'e/e2/IPhone_16_Pro_Max_Desert_Titanium_Rear.png',
  m16pm_d: 'e/ed/IPhone_16_Pro_Max_%2854252162478%29.jpg',
  m16pm_e: '4/43/IPhone_16_Pro_Max_%2854252176444%29.jpg',
  m16pm_f: '7/71/IPhone_16_Pro_Max_%2854252162653%29.jpg',
  m16pm_g: '6/60/IPhone_16_Pro_Max_%2854252176424%29.jpg',
  m16pm_case: '6/6f/IPhone_16_Pro_Max_in_a_Glossy_Clear_Case.jpg',

  // ── iPhone 16 Pro ──
  m16p_a: '2/2f/IPhone_16_Pro_-_black.jpg',
  m16p_b: '8/87/IPhone_16_Pro_%2854251031592%29.jpg',
  m16p_c: '8/84/IPhone_16_Pro_%2854251031612%29.jpg',
  m16p_d: '0/03/IPhone_16_Pro_%2854252352825%29.jpg',
  m16p_series: 'f/f8/IPhone_16_Pro_series.jpg',

  // ── iPhone 16 ──
  m16_a: 'e/e8/IPhone_16_%2854251031797%29.jpg',
  m16_b: 'e/e2/IPhone_16_%2854251926561%29.jpg',
  m16_c: '7/7f/IPhone_16_%2854251926606%29.jpg',
  m16_rear: 'a/a0/IPhone_16_Ultramarine_Rear.png',

  // ── iPhone 16e ──
  m16e_a: '6/67/IPhone_16e_black_front_view.jpg',
  m16e_b: '3/3e/IPhone_16e_black_rear_view.jpg',
  m16e_c: 'b/bb/IPhone_16e_-_1.jpg',
  m16e_d: '1/15/IPhone_16e_2025.jpg',
  m16e_e: '6/68/IPhone_16e_back_side.jpg',
  m16e_f: 'e/ef/IPhone_16e_%28Black%29_-_1.jpg',

  // ── iPhone 16 Plus (dùng chung chassis iPhone 16) ──
  m16plus_a: 'e/e8/IPhone_16_%2854251031797%29.jpg',
  m16plus_b: '7/7f/IPhone_16_%2854251926606%29.jpg',
  m16plus_c: 'a/a0/IPhone_16_Ultramarine_Rear.png',

  // ── iPad Pro 13" ──
  ipadpro_a: '7/7c/IPad_Pro_%2813-inch%2C_M5%2C_Space_Black%29_-_Backside.jpg',
  ipadpro_b: '7/75/IPad_Pro_13-inch_backside.jpg',
  ipadpro_c: '5/5a/IPad_Pro_%2811-inch%2C_M5%2C_Silver%29_-_Backside.jpg',
  ipadpro_d: 'e/ed/IPad_Pro_12.9-inch_%283rd_generation%29_back_side_%2820250525_155242%29.jpg',
  ipadpro_e: '8/8e/IPad_Pro_11-inch_%282nd_generation%29_back_side_%2820250525_154809%29.jpg',
  ipadpro_m2: '1/1d/IPad_Pro_M2_%2812.9_inch%29_6th_Generation_2024.jpg',

  // ── iPad Air 11" M3 ──
  ipadair_a: '3/3e/IPad_Air_11-inch_%28M3%29_backside.jpg',
  ipadair_b: '7/74/IPad_Air_11-inch_%28M3%29.jpg',
  ipadair_c: 'e/e6/IPad_Air_11-inch_%28M2%29_back_side_%2820250525_154602%29.jpg',
  ipadair_d: '2/22/IPad_Air_%284th_generation%29_and_Magic_Keyboard_-_1.jpg',

  // ── iPad 10th Gen ──
  ipad10_a: '5/53/IPad_10th_Generation_2024.jpg',
  ipad10_b: '0/0f/IPad_10.png',
  ipad10_c: 'a/a0/IPad_10_Original_No_Crop_Version.png',
} as const;

/** Pool ảnh mới cho từng model. Ảnh ĐẦU là ảnh chính. */
const POOLS: Record<string, string[]> = {
  'iPhone 15 Pro Max': [
    F.m15pm_a,
    F.m15pm_b,
    F.m15pm_c,
    F.m15pm_d,
    F.m15pm_e,
    F.m15pm_f,
    F.m15pm_front,
    F.m15pm_cam,
    F.m15pm_side,
  ],
  'iPhone 15 Pro': [
    F.m15p_a,
    F.m15p_b,
    F.m15p_c,
    F.m15p_d,
    F.m15p_e,
    F.m15p_pair,
  ],
  'iPhone 15': [F.m15_a, F.m15_b, F.m15_c, F.m15_pink],
  'iPhone 16 Pro Max': [
    F.m16pm_a,
    F.m16pm_b,
    F.m16pm_c,
    F.m16pm_d,
    F.m16pm_e,
    F.m16pm_f,
    F.m16pm_g,
    F.m16pm_case,
  ],
  'iPhone 16 Pro': [
    F.m16p_a,
    F.m16p_b,
    F.m16p_c,
    F.m16p_d,
    F.m16p_series,
  ],
  'iPhone 16': [F.m16_a, F.m16_b, F.m16_c, F.m16_rear],
  'iPhone 16e': [F.m16e_a, F.m16e_b, F.m16e_c, F.m16e_d, F.m16e_e, F.m16e_f],
  'iPhone 16 Plus': [F.m16plus_a, F.m16plus_b, F.m16plus_c],
  'iPad Pro M4 13in': [
    F.ipadpro_a,
    F.ipadpro_b,
    F.ipadpro_c,
    F.ipadpro_d,
    F.ipadpro_e,
    F.ipadpro_m2,
  ],
  'iPad Air M3 13in': [F.ipadair_a, F.ipadair_b, F.ipadair_c, F.ipadair_d],
  'iPad 10th Generation 13in': [F.ipad10_a, F.ipad10_b, F.ipad10_c],
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
      title: files[0].split('/').pop()!,
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
