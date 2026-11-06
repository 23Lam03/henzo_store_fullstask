/**
 * BỔ SUNG ẢNH RIÊNG CHO MODEL CÒN THIẾU (>= MIN_IMAGES).
 *
 * Nguồn ảnh (đã kiểm chứng tồn tại trên Commons):
 *   1. Commons search theo tên model (ưu tiên cao nhất).
 *   2. Pool theo (loại, hãng) — scripts/data/type-brand-pools.json.
 *   3. Pool theo loại — scripts/data/type-image-pools.json.
 *
 * Mỗi URL chỉ được dùng cho MỘT model để không trùng ảnh giữa các model.
 */
import { connectDB, disconnectDB } from '../../src/server/db';
import { ProductModel } from '../../src/server/models/Product';
import { modelName } from '../../lib/model-name';
import { modelType } from '../../lib/model-type';
import { fileNameFromUrl } from '../../lib/image-match';
import { findCandidates } from '../../lib/commons-model-search';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const MIN_IMAGES = 3;

const typeBrandPools = JSON.parse(
  readFileSync(resolve(process.cwd(), 'scripts/data/type-brand-pools.json'), 'utf-8'),
) as Record<string, Record<string, string[]>>;
const typePools = JSON.parse(
  readFileSync(resolve(process.cwd(), 'scripts/data/type-image-pools.json'), 'utf-8'),
) as Record<string, string[]>;

await connectDB();
const products = await ProductModel.find({}).select('name images brand categoryName').lean();

const byModel = new Map<string, any[]>();
const meta = new Map<string, { brand: string; type: string }>();
for (const p of products) {
  const m = modelName(String(p.name ?? ''));
  if (!m) continue;
  const arr = byModel.get(m) ?? [];
  arr.push(p);
  byModel.set(m, arr);
  if (!meta.has(m)) {
    meta.set(m, {
      brand: String(p.brand ?? ''),
      type: modelType(String(p.name ?? ''), String(p.categoryName ?? '')),
    });
  }
}

/** URL nào đã dùng rồi. */
const used = new Set<string>();
for (const list of byModel.values()) {
  for (const p of list) for (const u of (p.images ?? []).map(String)) used.add(u);
}

/** Chuẩn hoá tên file pool -> key so khớp. */
const key = (s: string): string =>
  decodeURIComponent(s)
    .replace(/^\d+px-/, '')
    .replace(/\.(jpe?g|png|webp)$/i, '')
    .replace(/[_\s]+/g, ' ')
    .trim()
    .toLowerCase();

/** Pool (loại, hãng) -> danh sách URL đầy đủ (URL từ type-image-pools là URL đầy đủ). */
const poolUrls: Record<string, string[]> = {};
for (const [type, brands] of Object.entries(typeBrandPools)) {
  for (const [brand, files] of Object.entries(brands)) {
    const k = `${type}|${brand}`;
    poolUrls[k] ??= [];
    // type-brand-pools chỉ có TÊN file -> tra URL từ type-image-pools / model-images.
    for (const f of files) poolUrls[k].push(f);
  }
}

// Bổ sung URL đầy đủ từ type-image-pools theo loại.
const byTypeUrls: Record<string, string[]> = {};
for (const [type, urls] of Object.entries(typePools)) {
  byTypeUrls[type] = urls;
}

/** Danh sách URL pool theo model (ưu tiên đúng hãng, sau đó theo loại). */
function poolFor(brand: string, type: string): string[] {
  const out: string[] = [];
  const direct = poolUrls[`${type}|${brand.toLowerCase()}`];
  if (direct) out.push(...direct);
  const byType = byTypeUrls[type];
  if (byType) out.push(...byType);
  return out;
}

let fixed = 0;
let stillMissing = 0;

for (const [model, list] of byModel) {
  const have = new Set<string>();
  for (const p of list) for (const u of (p.images ?? []).map(String)) have.add(u);

  if (have.size >= MIN_IMAGES) continue;

  const m = meta.get(model)!;
  const candidates: string[] = [];

  // 1. Commons search theo model.
  const found = await findCandidates(model, 10);
  for (const c of found) {
    if (c.score >= 8 && c.coverage >= 0.5) candidates.push(c.url);
  }

  // 2. Pool theo hãng + loại.
  for (const u of poolFor(m.brand, m.type)) {
    // pool chứa tên file -> dùng luôn nếu là URL, bỏ nếu là tên file.
    if (/^https?:\/\//.test(u)) candidates.push(u);
  }

  const picked = new Set(have);
  for (const u of candidates) {
    if (picked.size >= MIN_IMAGES) break;
    if (used.has(u) || picked.has(u)) continue;
    picked.add(u);
    used.add(u);
  }

  if (picked.size < MIN_IMAGES) {
    stillMissing++;
    console.log(`  ✗ ${model}: ${picked.size}/${MIN_IMAGES} ảnh`);
    continue;
  }

  const arr = [...picked];
  for (const p of list) {
    await ProductModel.updateOne(
      { _id: p._id },
      { $set: { images: arr.slice(0, 8) } },
    );
  }
  fixed++;
  console.log(`  ✅ ${model}: ${arr.length} ảnh riêng`);
}

console.log(`\nĐã bổ sung cho ${fixed} model | còn thiếu ${stillMissing}`);

await disconnectDB();
