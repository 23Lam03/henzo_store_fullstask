import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { connectDB, disconnectDB } from '../src/server/db';
import { ProductModel } from '../src/server/models/Product';
import { modelName } from './lib/model-name';

const UA = 'henzo-store/1.0 (model image resolver; dev@henzo.local)';
const DEST = resolve(process.cwd(), 'scripts/data/model-images.json');

const TYPE_KEYWORDS: Record<string, string[]> = {
  'Điện thoại': ['iphone', 'galaxy', 'pixel', 'oneplus', 'oppo', 'vivo', 'xiaomi', 'redmi', 'poco', 'honor', 'realme', 'nokia', 'tecno', 'huawei', 'sony', 'mate 60'],
  Tablet: ['ipad', 'tablet', 'matepad', 'galaxy tab', 'tab s', 'xiaomi pad'],
  Laptop: ['laptop', 'notebook', 'macbook', 'vivobook', 'zenbook', 'ideapad', 'thinkpad', 'yoga', 'spectre', 'xps', 'inspiron', 'omen', 'victus', 'predator', 'nitro', 'swift', 'aura', 'rog', 'tuf', 'alienware', 'legion', 'loq', 'katana', 'stealth', 'raider', 'titan', 'gram', 'matebook', 'aorus', 'surface', 'blade'],
  'Màn hình': ['monitor', 'display', 'screen', 'agon', 'odyssey', 'ultragear', 'viewfinity', 'proart', 'benq', 'viewsonic', 'philips', 'aoc', 'raptor', 'm27', 'm32', 'm34', 'xeneon', 'ultrawide'],
  'PC Gaming': ['gaming pc', 'gaming computer', 'tower', 'desktop', 'workstation', 'ssd', 'solid-state', 'solid state', 'drive', 'nvme', 'm.2', 'graphics card', 'geforce', 'rtx', 'ryzen', 'core i', 'ram', 'memory', 'dimm', 'sodimm', 'power supply', 'cooler', 'fan', 'tuf', 'g200', 'ak620', 'firecuda', 'rm850', 'rm750', 'mp700', 'trident z5', 'ripjaws', 'fury beast', 'hdd', 'baracuda'],
  Chuột: ['mouse', 'mice', 'raton', 'ratón', 'maus', 'viper', 'deathadder', 'basilisk', 'g502', 'superlight', 'kronos', 'kain', 'sensei', 'abyss', 'rival', 'm75', 'katar', 'xm2', 'harpe', 'mx master'],
  'Bàn phím': ['keyboard', 'keychron', 'blackwidow', 'huntsman', 'apex', 'k70', 'k100', 'k65', 'hhkb', 'realforce', 'clavier', 'teclado', 'k3', 'mx keys', 'g915', 'trackpoint'],
  'Tai nghe': ['headset', 'headphone', 'cascos', 'casque', 'earphone', 'airpod', 'quietcomfort', 'arctis', 'quantum', 'cloud', 'void', 'delta', 'hs60', 'hs80', 'hyperx'],
  'Phụ kiện': ['charger', 'power bank', 'power adapter', 'hub', 'stream deck', 'wave', 'hd60', 'webcam', 'c920', 'brio', 'streamcam', 'cable', 'adapter', 'microphone', 'seiren', 'icue link', 'battery', 'surface pro'],
};

const REJECT_TITLE =
  /\b(disassembl|disassembled|teardown|exploded|schematic|circuit|mainboard|motherboard|logic board|pcb|chipset|module|stick|sodimm|dimm|coolant|pump|connector|cable|port|button|wheel|underneath|bottom|top view|rear view|back view|side view|inside|interior|logo|icon|diagram|chart|booth|game ?show|gamescom|comiket|esport|tournament|championship|person|people|man|woman|player|streamer|interview|autograph|crowd|audience|stage|panel|signing|museum|store|office|desk|setup|box|package|unboxing|review|comparison|boit|booth|tokyo-game-show|faceit|homestory|hwc|esl|blast|rebornlive)\b/i;

const REJECT_CONTEXT =
  /(with|and|&|plus|in the|on the|at the|during|vs|comparison|setup|desk|gamepad|keyboard and mouse|mouse and keyboard)/i;

interface Candidate {
  title: string;
  url: string;
}

function inferType(model: string, categoryName: string): string {
  const m = model.toLowerCase();
  if (/ipad|galaxy tab|tablet|matepad|xiaomi pad/.test(m)) return 'Tablet';
  const map: Record<string, string> = {
    'Điện thoại': 'Điện thoại',
    Laptop: 'Laptop',
    'Màn hình': 'Màn hình',
    'PC Gaming': 'PC Gaming',
    Chuột: 'Chuột',
    'Bàn phím': 'Bàn phím',
    'Tai nghe': 'Tai nghe',
    'Phụ kiện': 'Phụ kiện',
  };
  return map[categoryName] ?? 'Phụ kiện';
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

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function fileName(url: string): string {
  const clean = decodeURIComponent(url.split('?')[0]);
  const parts = clean.split('/');
  return parts[parts.length - 1] ?? '';
}

function typeOfFile(fname: string): string | null {
  const t = fname.toLowerCase();
  if (/headset|headphone|earphone|airpod|casque/.test(t)) return 'Tai nghe';
  if (/keyboard|clavier|teclado|keycap|keychron|blackwidow|huntsman|apex/.test(t)) return 'Bàn phím';
  if (/mouse|mice|raton|maus/.test(t)) return 'Chuột';
  if (/monitor|display|screen/.test(t)) return 'Màn hình';
  if (/laptop|notebook|macbook|netbook/.test(t)) return 'Laptop';
  if (/ipad|tablet|matepad/.test(t)) return 'Tablet';
  if (/iphone|smartphone|pixel/.test(t)) return 'Điện thoại';
  return null;
}

function isValid(c: Candidate, type: string, brand: string): boolean {
  const t = c.title;
  if (REJECT_TITLE.test(t)) return false;
  if (REJECT_CONTEXT.test(t)) return false;

  const flat = norm(t);
  const fileType = typeOfFile(t);
  if (fileType && fileType !== type) return false;

  const kw = TYPE_KEYWORDS[type] ?? [];
  if (kw.length && !kw.some((k) => flat.includes(norm(k)))) return false;

  const brandTokens = brand
    .toLowerCase()
    .split(/[\s&]+/)
    .filter((b) => b.length >= 3 && !['gear', 'the', 'and'].includes(b));
  if (brandTokens.length && !brandTokens.some((b) => flat.includes(norm(b)))) {
    return false;
  }
  return true;
}

function keyTokens(model: string): string[] {
  const cleaned = model
    .replace(/\s*\d{1,2}(?:\.\d+)?in$/i, '')
    .replace(/\s*\d{1,2}(?:\.\d+)?\s*(?:"|inch)$/i, '')
    .trim();
  const words = cleaned
    .split(/[\s-]+/)
    .map((w) => w.replace(/[^\w]/g, ''))
    .filter((w) => w.length >= 2);
  const withDigit = words.filter((w) => /\d/.test(w));
  return withDigit.length ? withDigit : words.slice(0, 1);
}

async function main() {
  await connectDB();
  const products = await ProductModel.find({})
    .select('name categoryName brand')
    .lean();

  const info = new Map<string, { type: string; brand: string }>();
  for (const p of products) {
    const m = modelName(String(p.name));
    if (!info.has(m)) {
      info.set(m, {
        type: inferType(m, String(p.categoryName ?? '')),
        brand: String(p.brand ?? ''),
      });
    }
  }

  const db = JSON.parse(readFileSync(DEST, 'utf-8')) as Record<
    string,
    { images: string[]; source: string; title: string }
  >;

  const bad: string[] = [];
  for (const [model, entry] of Object.entries(db)) {
    const type = info.get(model)?.type ?? inferType(model, '');
    const pool = entry.images ?? [];
    if (!pool.length) {
      bad.push(model);
      continue;
    }
    const ok = pool.some((u) => {
      const fname = fileName(u);
      if (REJECT_TITLE.test(fname)) return false;
      const fileType = typeOfFile(fname);
      if (fileType && fileType !== type) return false;
      const flat = norm(fname);
      const kw = TYPE_KEYWORDS[type] ?? [];
      return !kw.length || kw.some((k) => flat.includes(norm(k)));
    });
    if (!ok) bad.push(model);
  }

  console.log(`[refetch] ${bad.length} model có pool ảnh sai cần tìm lại.`);

  let fixed = 0;
  const reserved = new Set<string>();

  for (const model of bad) {
    const meta = info.get(model);
    if (!meta) continue;

    const tokens = keyTokens(model);
    const queries = [
      model,
      `${meta.brand} ${model}`,
      ...tokens.map((t) => `${meta.brand} ${t}`),
    ].filter(Boolean);

    const cands: Candidate[] = [];
    for (const q of [...new Set(queries)]) {
      cands.push(...(await commonsSearch(q)));
      if (cands.length > 80) break;
    }

    const valid = cands.filter((c) => isValid(c, meta.type, meta.brand));
    const scored = valid
      .map((c) => {
        const flat = norm(c.title);
        return { c, hits: tokens.filter((t) => flat.includes(norm(t))).length };
      })
      .filter((x) => x.hits > 0)
      .sort((a, b) => b.hits - a.hits);

    const picked = scored
      .map((x) => x.c)
      .filter((c) => !reserved.has(c.url))
      .slice(0, 6);

    if (!picked.length) {
      console.log(`✗ ${model.padEnd(44)} không tìm được ảnh đúng loại`);
      continue;
    }

    picked.forEach((c) => reserved.add(c.url));
    db[model] = {
      images: picked.map((c) => c.url),
      source: 'commons-refetch',
      title: picked[0].title,
    };
    fixed++;
    console.log(
      `✓ ${model.padEnd(44)} ${picked.length} ảnh | ${picked
        .slice(0, 2)
        .map((c) => c.title)
        .join(' | ')}`,
    );
  }

  writeFileSync(DEST, JSON.stringify(db, null, 2), 'utf-8');
  console.log(`\n[refetch] Đã tìm lại ảnh cho ${fixed}/${bad.length} model.`);
  await disconnectDB();
}

void main();