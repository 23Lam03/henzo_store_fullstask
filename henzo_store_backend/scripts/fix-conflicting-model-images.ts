/**
 * TÌM ẢNH RIÊNG cho các model đang DÙNG CHUNG ảnh với model khác.
 *
 * Vấn đề: vài model có pool ảnh quá ít (1-3 ảnh) hoặc pool rỗng -> 2 model
 * khác nhau bị gán cùng 1 ảnh chính -> người dùng thấy "ảnh trùng lặp" trên
 * danh sách sản phẩm.
 *
 * Script này:
 *   1. Quét DB, phát hiện ảnh chính bị NHIỀU model dùng chung.
 *   2. Tìm ảnh mới trên Wikimedia Commons cho từng model còn thiếu
 *      (lọc nghiêm theo tên file: đúng loại sản phẩm + đúng hãng).
 *   3. Ghi kết quả vào `scripts/data/model-images.json` (KHÔNG ghi DB).
 *
 * Chạy: npx tsx scripts/fix-conflicting-model-images.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { connectDB, disconnectDB } from '../src/server/db';
import { ProductModel } from '../src/server/models/Product';
import { modelName } from './lib/model-name';

const UA = 'henzo-store/1.0 (model image resolver; dev@henzo.local)';
const DEST = resolve(process.cwd(), 'scripts/data/model-images.json');

/** Từ khoá bắt buộc theo LOẠI sản phẩm (giống fill-missing-model-images). */
const TYPE_KEYWORDS: Record<string, string[]> = {
  'Điện thoại': ['iphone', 'galaxy', 'pixel', 'oneplus', 'oppo', 'vivo', 'xiaomi', 'redmi', 'poco', 'honor', 'realme', 'nokia', 'tecno', 'huawei', 'sony'],
  Tablet: ['ipad', 'tablet', 'matepad'],
  Laptop: ['laptop', 'notebook', 'macbook', 'vivobook', 'zenbook', 'ideapad', 'thinkpad', 'yoga', 'spectre', 'xps', 'inspiron', 'omen', 'victus', 'predator', 'nitro', 'swift', 'aura', 'rog', 'tuf', 'alienware', 'legion', 'loq', 'katana', 'stealth', 'raider', 'titan', 'gram', 'matebook', 'aorus'],
  'Màn hình': ['monitor', 'display', 'screen', 'agon', 'odyssey', 'ultragear', 'viewfinity', 'proart', 'benq', 'viewsonic', 'philips', 'aoc', 'raptor', 'm27', 'm32', 'm34'],
  'PC Gaming': ['gaming pc', 'gaming computer', 'tower', 'desktop', 'workstation', 'ssd', 'solid-state', 'solid state', 'drive', 'nvme', 'm.2', 'graphics card', 'geforce', 'rtx', 'ryzen', 'core i', 'ram', 'memory', 'dimm', 'sodimm', 'power supply', 'cooler', 'fan', 'tuf', 'g200', 'ak620', 'firecuda', 'rm850', 'rm750', 'mp700', 'trident z5', 'ripjaws', 'fury beast'],
  Chuột: ['mouse', 'mice', 'raton', 'ratón', 'maus', 'viper', 'deathadder', 'basilisk', 'g502', 'superlight', 'kronos', 'kain', 'sensei', 'abyss', 'rival', 'm75', 'katar', 'xm2'],
  'Bàn phím': ['keyboard', 'keychron', 'blackwidow', 'huntsman', 'apex', 'k70', 'k100', 'k65', 'hhkb', 'realforce', 'clavier', 'teclado', 'k3'],
  'Tai nghe': ['headset', 'headphone', 'cascos', 'casque', 'earphone', 'airpod', 'quietcomfort', 'arctis', 'quantum', 'cloud', 'void', 'delta', 'hs60', 'hs80'],
  'Phụ kiện': ['charger', 'power bank', 'power adapter', 'hub', 'stream deck', 'wave', 'hd60', 'webcam', 'c920', 'brio', 'streamcam', 'cable', 'adapter', 'microphone', 'seiren', 'icue link'],
};

const REJECT_TITLE =
  /\b(disassembl|disassembled|teardown|exploded|schematic|circuit|mainboard|motherboard|logic board|pcb|chipset|module|stick|sodimm|dimm|coolant|pump|connector|cable|port|button|wheel|underneath|bottom|top view|rear view|back view|side view|inside|interior|logo|icon|diagram|chart|booth|game ?show|gamescom|comiket|esport|tournament|championship|person|people|man|woman|player|streamer|interview|autograph|crowd|audience|stage|panel|signing|museum|store|office|desk|setup|box|package|unboxing|review|comparison|boit|booth|tokyo-game-show|faceit|homestory|hwc|esl|blast)\b/i;

const REJECT_CONTEXT =
  /(with|and|&|plus|in the|on the|at the|during|vs|comparison|setup|desk|gamepad|keyboard and mouse|mouse and keyboard)/i;

interface Candidate {
  title: string;
  url: string;
}

async function getJson(url: string): Promise<any> {
  for (let a = 0; a < 3; a++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA } });
      if (r.status === 429) {
        await new Promise((s) => setTimeout(s, 2000 * (a + 1)));
        continue;
      }
      if (!r.ok) return null;
      return await r.json();
    } catch {
      await new Promise((s) => setTimeout(s, 800));
    }
  }
  return null;
}

async function commonsSearch(query: string, limit = 40): Promise<Candidate[]> {
  const d = await getJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
      `&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(query)}` +
      `&gsrlimit=${limit}&prop=imageinfo&iiprop=url|mime&iiurlwidth=900`,
  );
  const out: Candidate[] = [];
  for (const p of Object.values<any>(d?.query?.pages ?? {})) {
    const ii = (p.imageinfo ?? [])[0];
    if (!ii?.mime || !/^image\/(jpeg|png|webp)$/.test(ii.mime)) continue;
    out.push({
      title: String(p.title).replace(/^File:/, ''),
      url: String(ii.thumburl ?? ii.url),
    });
  }
  return out;
}

function isValid(
  c: Candidate,
  categoryName: string,
  brand: string,
  requireBrand: boolean,
): boolean {
  const t = c.title;
  if (REJECT_TITLE.test(t)) return false;
  if (REJECT_CONTEXT.test(t)) return false;

  const low = t.toLowerCase();
  const typeOk = TYPE_KEYWORDS[categoryName] ?? [];
  if (typeOk.length && !typeOk.some((k) => low.includes(k))) return false;

  if (requireBrand) {
    const tokens = brand
      .toLowerCase()
      .split(/[\s&]+/)
      .filter((b) => b.length >= 3 && b !== 'gear' && b !== 'the');
    if (tokens.length && !tokens.some((b) => low.includes(b))) return false;
  }
  return true;
}

/** Trích token đặc trưng của model để tìm ảnh chính xác hơn. */
function modelTokens(model: string): string[] {
  const m = model.replace(/\s*\d{1,2}(?:\.\d+)?in$/i, '');
  return m
    .split(/[\s-]+/)
    .filter(
      (t) =>
        t.length >= 2 &&
        !/^(wireless|rgb|usb|pro|plus|max|mini|black|white|carbon|x|ii|iii)$/i.test(t),
    );
}

async function main() {
  await connectDB();
  const products = await ProductModel.find({})
    .select('name categoryName brand images')
    .lean();

  const thumbModels = new Map<string, Set<string>>();
  const modelInfo = new Map<string, { brand: string; categoryName: string }>();
  for (const p of products) {
    const m = modelName(String(p.name));
    const first = (p.images ?? [])[0];
    if (!first) continue;
    const s = thumbModels.get(first) ?? new Set<string>();
    s.add(m);
    thumbModels.set(first, s);
    if (!modelInfo.has(m)) {
      modelInfo.set(m, {
        brand: String(p.brand ?? ''),
        categoryName: String(p.categoryName ?? ''),
      });
    }
  }

  // Model nào đang bị chia sẻ ảnh chính với model khác.
  const conflicting = new Set<string>();
  for (const [, models] of thumbModels) {
    if (models.size > 1) for (const m of models) conflicting.add(m);
  }
  console.log(
    `[fix] ${conflicting.size} model đang dùng chung ảnh chính với model khác.`,
  );

  const db = JSON.parse(readFileSync(DEST, 'utf-8')) as Record<
    string,
    { images: string[]; source: string; title: string }
  >;

  let fixed = 0;
  // URL đã cấp cho 1 model trong lượt này -> model khác KHÔNG được dùng lại.
  const reserved = new Set<string>();
  for (const model of conflicting) {
    const info = modelInfo.get(model);
    if (!info) continue;

    // Ảnh đang dùng -> loại khỏi ứng viên mới (tránh lấy lại ảnh cũ).
    const used = new Set<string>();
    for (const [url, models] of thumbModels) {
      if (models.has(model)) used.add(url);
    }
    // Ảnh đã cấp cho model khác trong lượt sửa này.
    for (const url of reserved) used.add(url);

    const queries = [
      model,
      ...modelTokens(model).map((t) => `${t} ${info.brand}`.trim()),
      // Query rộng: "<brand> <loại sản phẩm>" — tìm được ảnh gần đúng dòng.
      `${info.brand} ${info.categoryName === 'Bàn phím' ? 'keyboard' : info.categoryName === 'Tai nghe' ? 'headset' : info.categoryName === 'Màn hình' ? 'monitor' : info.categoryName === 'Chuột' ? 'mouse' : 'product'}`,
      // Query theo mã model rút gọn: "K100", "M34WMU", "HS80".
      ...modelTokens(model)
        .filter((t) => /\d/i.test(t))
        .map((t) => `${info.brand} ${t}`),
    ].filter(Boolean);

    const cands: Candidate[] = [];
    for (const q of [...new Set(queries)]) {
      cands.push(...(await commonsSearch(q)));
      if (cands.length > 60) break;
    }

    let valid = cands.filter((c) =>
      isValid(c, info.categoryName, info.brand, true),
    );
    if (!valid.length) {
      valid = cands.filter((c) =>
        isValid(c, info.categoryName, info.brand, false),
      );
    }

    // Ưu tiên ảnh có tên file chứa token đặc trưng của model.
    const tokens = modelTokens(model).map((t) => t.toLowerCase());
    const scored = valid
      .map((c) => {
        const low = c.title.toLowerCase();
        const hits = tokens.filter((t) => low.includes(t)).length;
        return { c, hits };
      })
      .filter((x) => x.hits > 0)
      .sort((a, b) => b.hits - a.hits);

    const fresh = scored.map((x) => x.c).filter((c) => !used.has(c.url));
    // Dự phòng: nếu không có ảnh nào chứa token model, dùng ảnh hợp lệ
    // theo loại + hãng (vẫn đúng dòng sản phẩm hơn là dùng chung ảnh).
    const fallback = valid.filter((c) => !used.has(c.url) && !fresh.includes(c));

    if (!fresh.length && !fallback.length) {
      console.log(`✗ ${model.padEnd(42)} không tìm được ảnh mới`);
      continue;
    }

    const picked = (fresh.length ? fresh : fallback).slice(0, 6);
    picked.forEach((c) => reserved.add(c.url));
    db[model] = {
      images: picked.map((c) => c.url),
      source: 'commons-conflict-fix',
      title: picked[0].title,
    };
    fixed++;
    console.log(
      `✓ ${model.padEnd(42)} ${picked.length} ảnh | ${picked
        .slice(0, 2)
        .map((c) => c.title)
        .join(' | ')}`,
    );
  }

  writeFileSync(DEST, JSON.stringify(db, null, 2), 'utf-8');
  console.log(`\n[fix] Đã bổ sung ảnh cho ${fixed}/${conflicting.size} model.`);
  await disconnectDB();
}

void main();