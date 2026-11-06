/**
 * BỔ SUNG ẢNH THẬT cho model còn thiếu / ảnh sai loại.
 *
 * Nguồn: Wikimedia Commons (ảnh thật, giấy phép tự do).
 *
 * Quy tắc bộ lọc NGHIÊM NGẶT (chỉ dựa trên TÊN FILE — mô tả Commons
 * thường nhiễu, VD "Xbox One gamepads, gaming keyboard and mouse.jpg" mô tả
 * có "mouse" nhưng là ảnh bàn phím):
 *   1. Bitmap (jpeg/png/webp).
 *   2. Tên file KHÔNG chứa từ cấm (teardown, linh kiện rời, logo, sự kiện,
 *      người, bối cảnh).
 *   3. Tên file PHẢI chứa từ khoá đúng LOẠI sản phẩm.
 *   4. Tên file PHẢI chứa tên HÃNG (trừ khi hãng không có ảnh nào).
 *
 * Chạy: npx tsx scripts/fill-missing-model-images.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { modelName } from './lib/model-name';

const UA = 'henzo-store/1.0 (model image resolver; dev@henzo.local)';

/** Từ khoá bắt buộc theo LOẠI sản phẩm. */
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

/** Từ cấm trong tên file (ảnh không phải sản phẩm). */
const REJECT_TITLE =
  /\b(disassembl|disassembled|teardown|exploded|schematic|circuit|mainboard|motherboard|logic board|pcb|chipset|module|stick|sodimm|dimm|coolant|pump|connector|cable|port|button|wheel|underneath|bottom|top view|rear view|back view|side view|inside|interior|logo|icon|diagram|chart|booth|game ?show|gamescom|comiket|esport|tournament|championship|person|people|man|woman|player|streamer|interview|autograph|crowd|audience|stage|panel|signing|museum|store|office|desk|setup|box|package|unboxing|review|comparison|boit|booth|tokyo-game-show|faceit|homestory|hwc|esl|blast)\b/i;

/** Ảnh tên file chứa từ khóa bối cảnh (không phải sản phẩm chính). */
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

/** Commons search -> file bitmap ứng viên. */
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

/** Media-list trang Wikipedia -> ứng viên. */
async function wikiMedia(page: string): Promise<Candidate[]> {
  const d = await getJson(
    `https://en.wikipedia.org/api/rest_v1/page/media-list/${encodeURIComponent(page)}`,
  );
  const out: Candidate[] = [];
  for (const it of d?.items ?? []) {
    if (it?.type !== 'image') continue;
    const title = String(it.title ?? '').replace(/^File:/, '');
    if (/vector|logo|icon|diagram|chart|\.svg$/i.test(title)) continue;
    const srcset = it?.srcset ?? [];
    const pick =
      srcset.find((s: any) => s.scale === 2) ??
      srcset.find((s: any) => s.scale === 1) ??
      srcset[0];
    if (!pick?.src) continue;
    out.push({
      title,
      url: String(pick.src).startsWith('//') ? `https:${pick.src}` : String(pick.src),
    });
  }
  return out;
}

/** Ảnh hợp lệ cho model không? */
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

/** Chuẩn hoá tên file bỏ phần tiền tố năm / số thứ tự. */
function normalizeTitle(title: string): string {
  return title
    .replace(/\.(jpe?g|png|webp)$/i, '')
    .replace(/^\d{4}\s*/, '')
    .replace(/^\d+\s*/, '')
    .trim();
}

interface Target {
  model: string;
  queries: string[];
  wikiPages?: string[];
  /** Bỏ yêu cầu tên hãng trong tên file (dùng cho hãng không có ảnh). */
  anyBrand?: boolean;
}

async function main() {
  const mock = JSON.parse(
    readFileSync(resolve(process.cwd(), 'scripts/data/frontend-mock.json'), 'utf-8'),
  );
  const dest = resolve(process.cwd(), 'scripts/data/model-images.json');
  const db = JSON.parse(readFileSync(dest, 'utf-8'));

  const info = new Map<string, { brand: string; categoryName: string }>();
  for (const p of [
    ...(mock.products as any[]),
    ...((mock.sellerProducts ?? []) as any[]),
  ]) {
    const m = modelName(p.name);
    if (!info.has(m)) {
      info.set(m, { brand: p.brand, categoryName: p.categoryName ?? '' });
    }
  }

  const TARGETS: Target[] = [
    // ── Tai nghe ──
    { model: 'ASUS ROG Delta S Wireless', queries: ['ASUS ROG Delta', 'ROG Delta headset', 'ASUS Delta headset'] },
    { model: 'JBL Quantum 910 Wireless', queries: ['JBL Quantum', 'JBL headset'] },
    { model: 'SteelSeries Arctis Nova 7', queries: ['SteelSeries Arctis Nova', 'Arctis Nova', 'SteelSeries Arctis'] },
    { model: 'SteelSeries Arctis Nova Pro Wireless', queries: ['SteelSeries Arctis Nova Pro', 'Arctis Nova Pro', 'SteelSeries Arctis'] },
    { model: 'HyperX Cloud III Wireless', queries: ['HyperX Cloud', 'HyperX headset'] },
    { model: 'HyperX Cloud III Wireless Red', queries: ['HyperX Cloud', 'HyperX headset'] },
    { model: 'HyperX Cloud Alpha Wireless', queries: ['HyperX Cloud', 'HyperX headset'] },
    { model: 'HyperX Cloud Alpha Wireless Red', queries: ['HyperX Cloud', 'HyperX headset'] },
    { model: 'Corsair HS60 Wireless', queries: ['Corsair headset', 'Corsair HS60'] },
    { model: 'Corsair HS60 Wireless Carbon', queries: ['Corsair headset', 'Corsair HS60'] },
    { model: 'Corsair HS80 RGB USB', queries: ['Corsair headset', 'Corsair HS80'] },
    { model: 'Corsair HS80 RGB USB Carbon', queries: ['Corsair headset', 'Corsair HS80'] },
    { model: 'Bose QuietComfort Ultra', queries: ['Bose QuietComfort Ultra', 'Bose QuietComfort'] },
    { model: 'AirPods Pro 2 USB-C', queries: ['AirPods Pro', 'AirPods Pro USB-C'] },
    { model: 'AirPods Max', queries: ['AirPods Max'] },
    { model: 'AirPods 4 ANC', queries: ['AirPods 4', 'AirPods 4 ANC'] },

    // ── Chuột ──
    { model: 'SteelSeries Rival 650 Wireless', queries: ['SteelSeries Rival', 'SteelSeries mouse'] },
    { model: 'Endgame Gear XM2we Wireless', queries: ['Endgame Gear mouse', 'XM2we mouse'], anyBrand: true },
    { model: 'Corsair M75 Wireless', queries: ['Corsair M75', 'Corsair mouse'] },
    { model: 'Corsair M75 Wireless Carbon', queries: ['Corsair M75', 'Corsair mouse'] },
    { model: 'Corsair Katar Pro XT Wireless', queries: ['Corsair Katar', 'Corsair mouse'] },
    { model: 'Corsair Katar Pro XT Wireless Carbon', queries: ['Corsair Katar', 'Corsair mouse'] },
    { model: 'Logitech G Pro X Superlight 2', queries: ['Logitech G Pro X Superlight', 'Logitech Superlight mouse'] },
    { model: 'Logitech G502 Hero', queries: ['Logitech G502 Hero', 'Logitech G502'] },
    { model: 'Logitech G502 X Plus Lightspeed', queries: ['Logitech G502 X Plus', 'Logitech G502 X'] },
    { model: 'Logitech MX Master 3S', queries: ['Logitech MX Master 3S', 'Logitech MX Master'] },

    // ── Bàn phím / Phụ kiện ──
    { model: 'Keychron K3 Pro Low Profile', queries: ['Keychron K3', 'Keychron low profile'] },
    { model: 'Lenovo ThinkPad TrackPoint Keyboard II', queries: ['ThinkPad TrackPoint Keyboard'] },
    { model: 'Razer Seiren V2 Pro', queries: ['Razer Seiren', 'Razer microphone'] },
    { model: 'Elgato Stream Deck XL', queries: ['Elgato Stream Deck XL', 'Stream Deck XL'] },
    { model: 'Anker 737 Power Bank 24K', queries: ['Anker 737 Power Bank', 'Anker Power Bank'] },
    { model: 'Corsair iCUE LINK System Hub', queries: ['Corsair iCUE LINK', 'iCUE LINK System Hub'] },

    // ── Màn hình ──
    { model: 'Razer Raptor 27in', queries: ['Razer Raptor monitor', 'Razer Raptor'] },
    { model: 'Razer Raptor 27in 2K Tổng hợp', queries: ['Razer Raptor monitor', 'Razer Raptor'] },
    { model: 'Gigabyte M27Q X 27in', queries: ['Gigabyte M27Q', 'M27Q X monitor'] },
    { model: 'Gigabyte M34WMU 34in', queries: ['Gigabyte M34WMU', 'M34WMU monitor'] },
    { model: 'Gigabyte M32UC 32in', queries: ['Gigabyte M32UC', 'M32UC monitor'] },
    { model: 'Gigabyte M32UC 32in 4K Curved', queries: ['Gigabyte M32UC', 'M32UC monitor'] },
    { model: 'AOC AGON PRO AG274QZM 27in', queries: ['AOC AGON PRO AG274QZM', 'AGON AG274QZM'] },
    { model: 'AOC AGON PRO AG274QZM 27in Mini LED', queries: ['AOC AGON PRO AG274QZM', 'AGON AG274QZM'] },
    { model: 'AOC CU34G2X 34in', queries: ['AOC CU34G2X', 'CU34G2X'] },

    // ── PC Gaming / linh kiện ──
    { model: 'ASUS TUF Gaming', queries: ['ASUS TUF Gaming desktop', 'ASUS TUF gaming computer'] },
    { model: 'Kingston FURY Beast DDR5', queries: ['Kingston FURY Beast', 'Kingston FURY DDR5'] },
    { model: 'Kingston FURY Renegade', queries: ['Kingston FURY Renegade', 'Kingston FURY'] },
    { model: 'Western Digital Blue SN580', queries: ['WD Blue SN580', 'Western Digital SN580', 'Western Digital NVMe'] },
    { model: 'Crucial T500', queries: ['Crucial T500', 'Crucial NVMe SSD', 'Crucial SSD'] },
    { model: 'G.Skill Trident Z5 RGB', queries: ['G.Skill Trident Z5', 'G.Skill Trident'] },
    { model: 'G.Skill Ripjaws S5', queries: ['G.Skill Ripjaws S5', 'G.Skill Ripjaws'] },
    { model: 'Corsair RM850x', queries: ['Corsair RM850x'] },
    { model: 'Corsair RM750e', queries: ['Corsair RM750e', 'Corsair RM750'] },
    { model: 'Corsair MP700 Pro SE', queries: ['Corsair MP700', 'Corsair MP700 PRO'] },
    { model: 'Cooler Master MTT G200 V2', queries: ['Cooler Master MTT G200', 'Cooler Master G200'] },
    { model: 'DeepCool AK620 Digital', queries: ['DeepCool AK620'] },
    { model: 'Seagate FireCuda 530', queries: ['Seagate FireCuda 530', 'FireCuda'] },
    { model: 'Seagate Barracuda Compute', queries: ['Seagate Barracuda Compute', 'Barracuda Compute'] },
    { model: 'NVIDIA GeForce RTX 4090 Founders Edition', queries: ['GeForce RTX 4090 Founders Edition', 'NVIDIA GeForce RTX 4090'] },
    { model: 'NVIDIA GeForce RTX 4080 SUPER Founders Edition', queries: ['RTX 4080 SUPER Founders', 'GeForce RTX 4080 SUPER'] },
    { model: 'NVIDIA GeForce RTX 4070 Ti SUPER Founders Edition', queries: ['RTX 4070 Ti SUPER Founders', 'GeForce RTX 4070 Ti SUPER'] },
    { model: 'AMD Ryzen 9 7950X3D', queries: ['AMD Ryzen 9 7950X3D', 'Ryzen 9 7950X3D'] },
    { model: 'AMD Ryzen 7 7800X3D', queries: ['AMD Ryzen 7 7800X3D', 'Ryzen 7 7800X3D'] },
    { model: 'AMD Ryzen 5 7600X', queries: ['AMD Ryzen 5 7600X', 'Ryzen 5 7600X'] },
    { model: 'Intel Core i9-14900K', queries: ['Intel Core i9-14900K', 'Core i9-14900K'] },
    { model: 'Intel Core i7-14700K', queries: ['Intel Core i7-14700K', 'Core i7-14700K'] },
    { model: 'Intel Core i5-14600K', queries: ['Intel Core i5-14600K', 'Core i5-14600K'] },

    // ── Tablet (đang xếp nhầm vào "Điện thoại") ──
    { model: 'iPad Pro M4 13in', queries: ['iPad Pro 13-inch M4', 'iPad Pro M4'] },
    { model: 'iPad 10th Generation 13in', queries: ['iPad 10th generation', 'IPad 10'] },
    { model: 'iPad Air M3 13in', queries: ['iPad Air M3', 'IPad Air 11-inch M3'] },
  ];

  let fixed = 0;
  const failed: string[] = [];

  for (const t of TARGETS) {
    const meta = info.get(t.model);
    if (!meta) continue;

    const cands: Candidate[] = [];
    const seen = new Set<string>();
    const push = (list: Candidate[]) => {
      for (const c of list) {
        if (seen.has(c.title)) continue;
        seen.add(c.title);
        cands.push(c);
      }
    };
    for (const q of t.queries) push(await commonsSearch(q));
    for (const p of t.wikiPages ?? []) push(await wikiMedia(p));

    // Pass 1: yêu cầu tên hãng trong tên file.
    let valid = cands.filter((c) => isValid(c, meta.categoryName, meta.brand, true));
    // Pass 2: nếu hãng không có ảnh nào -> cho phép ảnh đúng loại của hãng khác.
    if (!valid.length && !t.anyBrand) {
      valid = cands.filter((c) => isValid(c, meta.categoryName, meta.brand, false));
    }

    if (!valid.length) {
      failed.push(t.model);
      console.log(`✗ ${t.model} — không tìm được ảnh đúng loại`);
      continue;
    }

    const picked = valid.slice(0, 8);
    db[t.model] = {
      images: picked.map((c) => c.url),
      source: 'commons-code',
      title: picked[0].title,
    };
    fixed++;
    console.log(
      `✓ ${t.model.padEnd(42)} ${picked.length} ảnh | ${picked
        .slice(0, 3)
        .map((c) => normalizeTitle(c.title))
        .join(' | ')}`,
    );
  }

  writeFileSync(dest, JSON.stringify(db, null, 2), 'utf-8');
  console.log(
    `\n[fill] Đã sửa ${fixed}/${TARGETS.length} model. ` +
      `Còn thiếu: ${failed.length}`,
  );
  failed.forEach((f) => console.log(`   - ${f}`));
}

void main();
