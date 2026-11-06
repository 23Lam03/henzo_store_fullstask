/**
 * Sửa ảnh SAI LOẠI cho model còn thiếu / sai.
 *
 * Chiến lược tìm ảnh (theo thứ tự):
 *   1. Commons search với từ khoá hãng + từ khoá model.
 *   2. Commons search với từ khoá hãng + từ khoá loại sản phẩm.
 *   3. Media-list của trang Wikipedia của model/dòng sản phẩm.
 *
 * Bộ lọc ảnh (phải đạt TẤT CẢ):
 *   - là bitmap (jpeg/png/webp)
 *   - KHÔNG phải ảnh teardown / linh kiện rời / logo / sự kiện / có người
 *   - tên file hoặc MÔ TẢ phải chứa từ khoá LOẠI sản phẩm
 *   - tên file hoặc MÔ TẢ phải chứa tên HÃNG (trừ khi không có ảnh nào khác)
 *
 * Chạy: npx tsx scripts/fix-wrong-type.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { modelName } from './lib/model-name';

const UA = 'henzo-store/1.0 (model image resolver; dev@henzo.local)';

/** Từ khoá bắt buộc theo LOẠI sản phẩm (tiếng Việt -> tiếng Anh). */
const TYPE_KEYWORDS: Record<string, string[]> = {
  'Điện thoại': ['phone', 'iphone', 'galaxy', 'pixel', 'oneplus', 'oppo', 'vivo', 'xiaomi', 'redmi', 'poco', 'honor', 'realme', 'nokia', 'tecno', 'huawei', 'sony'],
  Tablet: ['ipad', 'tablet', 'matepad'],
  Laptop: ['laptop', 'notebook', 'macbook', 'vivobook', 'zenbook', 'ideapad', 'thinkpad', 'yoga', 'spectre', 'xps', 'inspiron', 'omen', 'victus', 'predator', 'nitro', 'swift', 'aura', 'rog', 'tuf', 'alienware', 'legion', 'loq', 'katana', 'stealth', 'raider', 'titan', 'gram', 'matebook', 'aorus'],
  'Màn hình': ['monitor', 'display', 'screen', 'agon', 'odyssey', 'ultragear', 'viewfinity', 'proart', 'alienware aw', 'benq', 'viewsonic', 'philips', 'aoc', 'raptor', 'm27', 'm32', 'm34'],
  'PC Gaming': ['gaming pc', 'gaming computer', 'tower', 'desktop', 'workstation', 'ssd', 'solid-state', 'solid state', 'drive', 'nvme', 'm.2', 'graphics card', 'geforce', 'rtx', 'ryzen', 'core i', 'threadripper', 'ram', 'memory', 'dimm', 'sodimm', 'power supply', 'cooler', 'fan', 'tuf'],
  Chuột: ['mouse', 'mice', 'raton', 'ratón', 'maus', 'viper', 'deathadder', 'basilisk', 'g502', 'superlight', 'kronos', 'kain', 'sensei', 'abyss', 'rival', 'm75', 'katar'],
  'Bàn phím': ['keyboard', 'keychron', 'blackwidow', 'huntsman', 'apex', 'k70', 'k100', 'k65', 'hhkb', 'realforce', 'clavier', 'teclado', 'k3'],
  'Tai nghe': ['headset', 'headphone', 'cascos', 'casque', 'earphone', 'airpod', 'quietcomfort', 'arctis', 'quantum', 'cloud', 'void', 'delta', 'hs60', 'hs80', 'voidpro'],
  'Phụ kiện': ['charger', 'power bank', 'power adapter', 'hub', 'stream deck', 'wave', 'hd60', 'webcam', 'c920', 'brio', 'streamcam', 'cable', 'adapter', 'microphone', 'seiren', 'icue'],
};

/** Ảnh KHÔNG dùng được (teardown, linh kiện rời, sự kiện, có người, logo...). */
const REJECT =
  /\b(disassembl|disassembled|teardown|exploded|schematic|circuit board|mainboard|main board|motherboard|logic board|pcb|chipset|module|stick|ram |sodimm|dimm\b|coolant|fan\b|cooler|heatsink|pump|rad|connector|cable close|ports?|button|scroll wheel|underneath|bottom|top view|rear view|back view|side view|inside|interior|logo|icon|diagram|chart|booth|game ?show|gamescom|comiket|esport|tournament|championship|person|people|man |woman |player |streamer|interview|autograph|crowd|audience|stage|panel|signing|museum|store |office|desk |setup|box|package|unboxing|review|comparison|teardown)/i;

/** Ảnh sản phẩm phải có phần mô tả (desc) đủ dài -> tránh file vô danh. */
interface Candidate {
  title: string;
  desc: string;
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

/** Commons search -> danh sách file ứng viên (kèm desc + url). */
async function commonsSearch(query: string, limit = 30): Promise<Candidate[]> {
  const d = await getJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
      `&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(query)}` +
      `&gsrlimit=${limit}&prop=imageinfo&iiprop=url|mime|extmetadata&iiurlwidth=900`,
  );
  const out: Candidate[] = [];
  for (const p of Object.values<any>(d?.query?.pages ?? {})) {
    const ii = (p.imageinfo ?? [])[0];
    if (!ii?.mime || !/^image\/(jpeg|png|webp)$/.test(ii.mime)) continue;
    out.push({
      title: String(p.title).replace(/^File:/, ''),
      desc: String(ii.extmetadata?.ImageDescription?.value ?? '')
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .trim(),
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
    const title = String(it.title ?? '');
    if (/vector|logo|icon|diagram|chart|\.svg$/i.test(title)) continue;
    const srcset = it?.srcset ?? [];
    const pick =
      srcset.find((s: any) => s.scale === 2) ??
      srcset.find((s: any) => s.scale === 1) ??
      srcset[0];
    if (!pick?.src) continue;
    out.push({
      title: title.replace(/^File:/, ''),
      desc: '',
      url: String(pick.src).startsWith('//') ? `https:${pick.src}` : String(pick.src),
    });
  }
  return out;
}

/** Ảnh này hợp lệ cho loại sản phẩm không? */
function isValidPhoto(c: Candidate, categoryName: string, brand: string): boolean {
  const text = `${c.title} ${c.desc}`;
  if (REJECT.test(text)) return false;
  const low = text.toLowerCase();
  const typeOk = TYPE_KEYWORDS[categoryName] ?? [];
  if (typeOk.length && !typeOk.some((k) => low.includes(k))) return false;
  // Phải có dấu hiệu đúng hãng (bỏ qua nếu ảnh tên file đã chứa tên hãng).
  const brandTokens = brand
    .toLowerCase()
    .split(/[\s&]+/)
    .filter((b) => b.length >= 3 && b !== 'gear' && b !== 'the');
  if (brandTokens.length) {
    const hasBrand = brandTokens.some((b) => low.includes(b));
    if (!hasBrand) return false;
  }
  return true;
}

/** Mô tả model -> truy vấn tìm kiếm. */
interface Target {
  model: string;
  queries: string[];
  wikiPages?: string[];
}

async function resolveTarget(
  t: Target,
  categoryName: string,
  brand: string,
): Promise<Candidate[]> {
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

  const valid = cands.filter((c) => isValidPhoto(c, categoryName, brand));
  // Ưu tiên ảnh có mô tả (ảnh chụp sản phẩm có nhãn).
  return valid.sort((a, b) => {
    const ad = a.desc.length > 10 ? 1 : 0;
    const bd = b.desc.length > 10 ? 1 : 0;
    if (ad !== bd) return bd - ad;
    return a.title.localeCompare(b.title);
  });
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
    { model: 'ASUS ROG Delta S Wireless', queries: ['ASUS ROG Delta S', 'ROG Delta headset', 'ASUS Delta headset'] },
    { model: 'JBL Quantum 910 Wireless', queries: ['JBL Quantum 910', 'JBL Quantum', 'JBL headset'] },
    { model: 'SteelSeries Arctis Nova 7', queries: ['SteelSeries Arctis Nova 7', 'Arctis Nova 7', 'SteelSeries Arctis'] },
    { model: 'SteelSeries Arctis Nova Pro Wireless', queries: ['SteelSeries Arctis Nova Pro', 'Arctis Nova Pro', 'SteelSeries Arctis'] },
    { model: 'HyperX Cloud III Wireless', queries: ['HyperX Cloud III', 'HyperX Cloud', 'HyperX headset'] },
    { model: 'HyperX Cloud III Wireless Red', queries: ['HyperX Cloud III', 'HyperX Cloud', 'HyperX headset'] },
    { model: 'HyperX Cloud Alpha Wireless', queries: ['HyperX Cloud Alpha', 'HyperX Cloud', 'HyperX headset'] },
    { model: 'HyperX Cloud Alpha Wireless Red', queries: ['HyperX Cloud Alpha', 'HyperX Cloud', 'HyperX headset'] },
    { model: 'Corsair HS60 Wireless', queries: ['Corsair headset', 'Corsair Void headset', 'Corsair HS60'] },
    { model: 'Corsair HS60 Wireless Carbon', queries: ['Corsair headset', 'Corsair Void headset', 'Corsair HS60'] },
    { model: 'Corsair HS80 RGB USB', queries: ['Corsair headset', 'Corsair Void headset', 'Corsair HS80'] },
    { model: 'Corsair HS80 RGB USB Carbon', queries: ['Corsair headset', 'Corsair Void headset', 'Corsair HS80'] },

    // ── Chuột ──
    { model: 'SteelSeries Rival 650 Wireless', queries: ['SteelSeries Rival 650', 'SteelSeries Rival Wireless', 'SteelSeries Rival mouse'] },
    { model: 'Endgame Gear XM2we Wireless', queries: ['Endgame Gear XM2we', 'Endgame Gear mouse', 'XM2we'] },
    { model: 'Corsair M75 Wireless', queries: ['Corsair M75', 'Corsair mouse wireless', 'Corsair mouse'] },
    { model: 'Corsair M75 Wireless Carbon', queries: ['Corsair M75', 'Corsair mouse wireless', 'Corsair mouse'] },
    { model: 'Corsair Katar Pro XT Wireless', queries: ['Corsair Katar Pro XT', 'Corsair Katar', 'Corsair mouse'] },
    { model: 'Corsair Katar Pro XT Wireless Carbon', queries: ['Corsair Katar Pro XT', 'Corsair Katar', 'Corsair mouse'] },

    // ── Bàn phím / Phụ kiện ──
    { model: 'Keychron K3 Pro Low Profile', queries: ['Keychron K3', 'Keychron K3 Pro', 'Keychron low profile keyboard'] },
    { model: 'Razer Seiren V2 Pro', queries: ['Razer Seiren V2', 'Razer Seiren', 'Razer microphone'] },

    // ── Màn hình ──
    { model: 'Razer Raptor 27in', queries: ['Razer Raptor monitor', 'Razer Raptor', 'Razer gaming monitor'] },
    { model: 'Razer Raptor 27in 2K Tổng hợp', queries: ['Razer Raptor monitor', 'Razer Raptor', 'Razer gaming monitor'] },
    { model: 'Gigabyte M27Q X 27in', queries: ['Gigabyte M27Q X', 'Gigabyte M27Q monitor', 'M27Q X'] },
    { model: 'Gigabyte M34WMU 34in', queries: ['Gigabyte M34WMU', 'Gigabyte M34 monitor', 'M34WMU'] },
    { model: 'Gigabyte M32UC 32in', queries: ['Gigabyte M32UC', 'Gigabyte M32UC monitor', 'M32UC'] },
    { model: 'Gigabyte M32UC 32in 4K Curved', queries: ['Gigabyte M32UC', 'Gigabyte M32UC monitor', 'M32UC'] },

    // ── PC Gaming / linh kiện ──
    { model: 'Kingston FURY Beast DDR5', queries: ['Kingston FURY Beast DDR5', 'Kingston FURY Beast', 'Kingston FURY DDR5'] },
    { model: 'Western Digital Blue SN580', queries: ['WD Blue SN580', 'Western Digital Blue SN580', 'Western Digital NVMe SSD'] },
    { model: 'G.Skill Trident Z5 RGB', queries: ['G.Skill Trident Z5 RGB', 'G.Skill Trident Z5', 'G.Skill Trident'] },
    { model: 'Corsair RM850x', queries: ['Corsair RM850x', 'Corsair RM850x power supply'] },
    { model: 'Corsair RM750e', queries: ['Corsair RM750e', 'Corsair RM750'] },
    { model: 'Corsair MP700 Pro SE', queries: ['Corsair MP700 PRO', 'Corsair MP700', 'Corsair internal SSD'] },
    { model: 'Cooler Master MTT G200 V2', queries: ['Cooler Master MTT G200', 'Cooler Master G200', 'Cooler Master Hyper 212'] },
    { model: 'DeepCool AK620 Digital', queries: ['DeepCool AK620', 'DeepCool AK620 Digital', 'DeepCool CPU cooler'] },
    { model: 'Seagate FireCuda 530', queries: ['Seagate FireCuda 530', 'FireCuda 530', 'Seagate FireCuda'] },
    { model: 'Elgato Stream Deck XL', queries: ['Elgato Stream Deck XL', 'Stream Deck XL', 'Elgato Stream Deck'] },
    { model: 'Corsair iCUE LINK System Hub', queries: ['Corsair iCUE LINK System Hub', 'Corsair iCUE LINK', 'Corsair iCUE LINK hub'] },
  ];

  let fixed = 0;
  for (const t of TARGETS) {
    const meta = info.get(t.model);
    if (!meta) continue;
    const cands = await resolveTarget(t, meta.categoryName, meta.brand);
    if (!cands.length) {
      console.log(`✗ ${t.model} — không tìm được ảnh đúng loại`);
      continue;
    }
    const picked = cands.slice(0, 8);
    db[t.model] = {
      images: picked.map((c) => c.url),
      source: 'commons-code',
      title: picked[0].title,
    };
    fixed++;
    console.log(
      `✓ ${t.model} -> ${picked.length} ảnh | ${picked
        .slice(0, 3)
        .map((c) => c.title)
        .join(' | ')}`,
    );
  }

  writeFileSync(dest, JSON.stringify(db, null, 2), 'utf-8');
  console.log(`\n[fix-type] Đã sửa ${fixed}/${TARGETS.length} model`);
}

void main();
