/**
 * TÌM ẢNH ĐÚNG MODEL cho các model còn thiếu / đang dùng ảnh pool dùng chung.
 *
 * QUY TẮC CHẶT (chỉ nhận ảnh khi tên file chứa MÃ MODEL):
 *   1. Tên file phải chứa ít nhất 1 token ĐẶC TRƯNG của model
 *      (token có chữ số: "hs60", "xl2566k", "xr273qk", "1000xm5"...).
 *      Nếu model không có token có số -> dùng token SERIES
 *      ("quietcomfort", "raptor", "m34wmu", "gram"...).
 *   2. Tên file phải chứa tên HÃNG.
 *   3. Tên file phải chứa từ khoá đúng LOẠI sản phẩm.
 *   4. Loại ảnh có từ cấm (sự kiện, người, teardown, logo, đồ vật khác...).
 *
 * Nguồn: Wikimedia Commons (search + intitle + category), Wikipedia pageimages.
 *
 * Chạy: npx tsx scripts/resolve-missing-models.ts [--apply]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { getJson } from './lib/commons-files';

/* ───────────────────────── Loại sản phẩm ───────────────────────── */

const TYPE_KEYWORDS: Record<string, string[]> = {
  'Điện thoại': ['iphone', 'galaxy', 'pixel', 'oneplus', 'oppo', 'vivo', 'xiaomi', 'redmi', 'poco', 'honor', 'realme', 'nokia', 'tecno', 'huawei', 'motorola'],
  Tablet: ['ipad', 'tablet', 'matepad', 'galaxy tab', 'surface pro'],
  Laptop: ['laptop', 'notebook', 'macbook', 'vivobook', 'zenbook', 'ideapad', 'thinkpad', 'yoga', 'spectre', 'xps', 'inspiron', 'omen', 'victus', 'predator', 'nitro', 'swift', 'aura', 'rog', 'tuf', 'alienware', 'legion', 'loq', 'katana', 'stealth', 'raider', 'titan', 'gram', 'matebook', 'aorus', 'book4', 'book 4', 'envy'],
  'Màn hình': ['monitor', 'display', 'screen', 'agon', 'odyssey', 'ultragear', 'viewfinity', 'proart', 'benq', 'viewsonic', 'philips', 'aoc', 'raptor', 'm27', 'm32', 'm34', 'gaming monitor'],
  'PC Gaming': ['gaming pc', 'gaming computer', 'tower', 'desktop', 'workstation', 'ssd', 'solid-state', 'solid state', 'drive', 'nvme', 'm.2', 'graphics card', 'geforce', 'rtx', 'radeon', 'ryzen', 'core i', 'ram', 'memory', 'dimm', 'sodimm', 'power supply', 'cooler', 'xeneon', 'firecuda', 'fury beast', 'trident z5', 'ripjaws', 'rm850', 'rm750', 'mp700', 'p3 plus'],
  Chuột: ['mouse', 'mice', 'raton', 'ratón', 'maus', 'viper', 'deathadder', 'basilisk', 'g502', 'superlight', 'kronos', 'kain', 'sensei', 'abyss', 'rival', 'm75', 'katar', 'xm2', 'aim lab', 'harpe'],
  'Bàn phím': ['keyboard', 'keychron', 'blackwidow', 'huntsman', 'apex', 'k70', 'k100', 'k65', 'hhkb', 'realforce', 'clavier', 'teclado', 'k3', 'opx'],
  'Tai nghe': ['headset', 'headphone', 'earphone', 'cascos', 'casque', 'airpod', 'quietcomfort', 'arctis', 'quantum', 'cloud', 'void', 'delta', 'hs60', 'hs80', 'wireless headset'],
  'Phụ kiện': ['charger', 'power bank', 'power adapter', 'hub', 'stream deck', 'wave', 'hd60', 'webcam', 'c920', 'brio', 'streamcam', 'cable', 'adapter', 'microphone', 'seiren', 'icue link', 'keys'],
};

/** Từ cấm: ảnh không phải sản phẩm. */
const REJECT =
  /\b(disassembl|teardown|exploded|schematic|circuit|mainboard|motherboard|logic ?board|pcb|chipset|logo|icon|diagram|chart|booth|gamescom|comiket|esl|blast|person|people|man|woman|player|streamer|interview|autograph|crowd|audience|stage|signing|museum|store|office|desk|setup|box|package|unboxing|review|comparison|boit|tokyo-game-show|faceit|homestory|hwc|poster|banner|advert|swatch|book|cover|map|screenshot|interface|menu|wallpaper|blueprint|patent|drawing|return of|consair|church|fortress|aircraft|plane|airliner|boeing|mustang|regiment|massacre|saint|monster|dumpster|trash|bin\b|keyboard and mouse|mouse and keyboard|holding|hand|woman|man\b)\b/i;

/** Từ báo hiệu ảnh bối cảnh. */
const CONTEXT =
  /(with|and|&|plus|in the|on the|at the|during|vs\b|comparison|gamepad|keyboard and mouse|mouse and keyboard|holding|people|person|hand|hands|box|store|shop|window|table|wall)\b/i;

/* ───────────────────────── Tiện ích ───────────────────────── */

function norm(s: string): string {
  return s
    .replace(/^File:/, '')
    .replace(/\.(jpe?g|png|webp|tiff)$/i, '')
    .replace(/[_\-.,()'"/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/** Token dừng (không mang thông tin model). */
const STOP = new Set([
  'pro', 'plus', 'max', 'ultra', 'mini', 'air', 'se', 'gen', 'series', 'in',
  'inch', 'gb', 'tb', 'gaming', 'wireless', 'rgb', 'black', 'white', 'silver',
  'grey', 'gray', 'titanium', 'magnetic', 'tkl', 'full', 'size', 'with', 'and',
  'the', 'for', 'edition', 'combo', 'package', 'kit', 'arena', 'creator',
  'powerking', 'phantom', 'midnight', 'whisper', 'metaverse', 'starter',
  'tournament', 'gamingx', 'obs', 'studio', 'setup', 'streaming', 'silent',
  'budget', 'build', 'ready', 'workspace', 'esports', 'new', 'optical', 'mx',
  'keys', 'hdd', 'ssd', 'nvme', 'ram', 'dimm', 'gaming', 'pc', 'v2', 'v3',
]);

/**
 * Token ĐẶC TRƯNG của model:
 *   - token có chứa chữ số (mã model) -> mạnh nhất
 *   - token series dài >= 4 ký tự, không phải brand -> trung bình
 */
function distinctive(model: string, brand: string): { hard: string[]; soft: string[] } {
  const brandToks = brand.toLowerCase().split(/[\s&]+/).filter((b) => b.length >= 3);
  const words = model
    .replace(/[()]/g, ' ')
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean);
  const hard: string[] = [];
  const soft: string[] = [];
  for (const w of words) {
    const lw = w.toLowerCase();
    if (STOP.has(lw)) continue;
    if (brandToks.includes(lw)) continue;
    if (w.length < 3) continue;
    if (/\d/.test(w)) {
      hard.push(lw);
      continue;
    }
    // Token chữ đơn lẻ -> yếu
    if (w.length >= 4) soft.push(lw);
  }
  return { hard, soft };
}

/* ───────────────────────── Nguồn ảnh ───────────────────────── */

interface Cand {
  title: string;
  url: string;
  n: string;
}

async function cSearch(q: string, limit = 30, via = 'search'): Promise<Cand[]> {
  const d = await getJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
      `&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(q)}` +
      `&gsrlimit=${limit}&prop=imageinfo&iiprop=url|mime&iiurlwidth=1000`,
  );
  const out: Cand[] = [];
  for (const p of Object.values<any>(d?.query?.pages ?? {})) {
    const ii = (p.imageinfo ?? [])[0];
    if (!ii?.mime || !/^image\/(jpeg|png|webp)$/.test(String(ii.mime))) continue;
    const title = String(p.title ?? '').replace(/^File:/, '');
    out.push({ title, url: String(ii.thumburl ?? ii.url), n: norm(title) });
  }
  return out;
}

async function cCategory(cat: string): Promise<Cand[]> {
  const d = await getJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
      `&generator=categorymembers&gcmtitle=${encodeURIComponent(`Category:${cat}`)}` +
      `&gcmnamespace=6&gcmlimit=200&prop=imageinfo&iiprop=url|mime&iiurlwidth=1000`,
  );
  const out: Cand[] = [];
  for (const p of Object.values<any>(d?.query?.pages ?? {})) {
    const ii = (p.imageinfo ?? [])[0];
    if (!ii?.mime || !/^image\/(jpeg|png|webp)$/.test(String(ii.mime))) continue;
    const title = String(p.title ?? '').replace(/^File:/, '');
    out.push({ title, url: String(ii.thumburl ?? ii.url), n: norm(title) });
  }
  return out;
}

async function wikiMedia(page: string): Promise<Cand[]> {
  const d = await getJson(
    `https://en.wikipedia.org/api/rest_v1/page/media-list/${encodeURIComponent(page)}`,
  );
  const out: Cand[] = [];
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
    const url = String(pick.src).startsWith('//') ? `https:${pick.src}` : String(pick.src);
    out.push({ title, url, n: norm(title) });
  }
  return out;
}

/* ───────────────────────── Chấm điểm ───────────────────────── */

interface Verdict {
  ok: boolean;
  score: number;
  reason: string;
}

function judge(c: Cand, model: string, brand: string, categoryName: string): Verdict {
  if (REJECT.test(c.title)) return { ok: false, score: -1, reason: 'reject-word' };
  if (CONTEXT.test(c.title)) return { ok: false, score: -1, reason: 'context' };

  const brandToks = brand.toLowerCase().split(/[\s&]+/).filter((b) => b.length >= 3);
  const hasBrand = brandToks.some((b) => c.n.includes(b));

  const { hard, soft } = distinctive(model, brand);
  const hitHard = hard.filter((t) => c.n.includes(t));
  const hitSoft = soft.filter((t) => c.n.includes(t));

  const typeOk = TYPE_KEYWORDS[categoryName] ?? [];
  const hasType = !typeOk.length || typeOk.some((k) => c.n.includes(k.toLowerCase()));

  let score = 0;
  if (hitHard.length) {
    score += 40 + hitHard[0].length * 3;
  } else if (hitSoft.length) {
    score += 14 + hitSoft[0].length * 2;
  } else {
    return { ok: false, score: -1, reason: 'no-model-token' };
  }
  if (!hasBrand) score -= 12;
  if (!hasType) score -= 15;
  if (score < 12) return { ok: false, score, reason: 'weak' };
  return { ok: true, score, reason: 'ok' };
}

/** Sinh truy vấn. */
function queries(model: string, brand: string): string[] {
  const out: string[] = [];
  const base = model.replace(/\s+\d+(?:\.\d+)?in\b/gi, '').trim();
  out.push(base);
  const { hard, soft } = distinctive(model, brand);
  if (hard.length) {
    out.push(`${brand} ${hard[0]}`.trim());
    out.push(hard[0]);
  }
  if (soft.length) out.push(`${brand} ${soft[0]}`.trim());
  out.push(brand);
  return [...new Set(out.filter(Boolean))];
}

async function main() {
  const apply = process.argv.includes('--apply');
  const audit = JSON.parse(
    readFileSync(resolve(process.cwd(), 'scripts/data/model-audit.json'), 'utf-8'),
  ) as { model: string; brand: string; categoryName: string; exact: boolean }[];

  const missing = audit.filter((a) => !a.exact);
  console.log(`[resolve] Mục tiêu: ${missing.length} model.`);

  const db = JSON.parse(
    readFileSync(resolve(process.cwd(), 'scripts/data/model-images.json'), 'utf-8'),
  ) as Record<string, { images: string[]; source: string; title: string }>;

  const ok: string[] = [];
  const fail: string[] = [];
  const report: Record<string, string[]> = {};

  for (const m of missing) {
    const qs = queries(m.model, m.brand);
    const cands: Cand[] = [];
    const seen = new Set<string>();
    const push = (l: Cand[]) => {
      for (const c of l) {
        if (seen.has(c.title)) continue;
        seen.add(c.title);
        cands.push(c);
      }
    };
    for (const q of qs) {
      push(await cSearch(q, 30, `s:${q}`));
      push(await cSearch(`intitle:${q}`, 20, `i:${q}`));
    }
    push(await cCategory(m.brand));
    push(await wikiMedia(m.model));

    const scored = cands
      .map((c) => ({ c, v: judge(c, m.model, m.brand, m.categoryName) }))
      .filter((x) => x.v.ok)
      .sort((a, b) => b.v.score - a.v.score);

    if (!scored.length) {
      fail.push(m.model);
      console.log(`✗ ${m.model.padEnd(44)} ${qs.join(' / ')}`);
      continue;
    }
    const top = scored[0].v.score;
    const picked = scored.filter((x) => x.v.score >= top - 8).slice(0, 5).map((x) => x.c);
    report[m.model] = picked.map((c) => c.title);
    ok.push(m.model);
    console.log(`✓ ${m.model.padEnd(44)} ${picked[0].title.slice(0, 66)}`);
    if (apply) {
      db[m.model] = {
        images: picked.map((c) => c.url),
        source: 'commons-code',
        title: picked[0].title,
      };
    }
  }

  if (apply) {
    writeFileSync(
      resolve(process.cwd(), 'scripts/data/model-images.json'),
      JSON.stringify(db, null, 2),
      'utf-8',
    );
  }
  writeFileSync(
    resolve(process.cwd(), 'scripts/data/resolve-missing-report.json'),
    JSON.stringify(report, null, 2),
    'utf-8',
  );
  console.log(`\n[resolve] Tìm được: ${ok.length} | Thất bại: ${fail.length}`);
  if (fail.length) console.log(fail.join('\n'));
}

void main();
