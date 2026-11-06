import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { connectDB, disconnectDB } from '../src/server/db';
import { ProductModel } from '../src/server/models/Product';
import { modelName } from './lib/model-name';

const DEST = resolve(process.cwd(), 'scripts/data/model-images.json');
const DRY = process.argv.includes('--dry');

const TYPE_KEYWORDS: Record<string, string[]> = {
  'Điện thoại': ['iphone', 'galaxy', 'pixel', 'oneplus', 'oppo', 'vivo', 'xiaomi', 'redmi', 'poco', 'honor', 'realme', 'nokia', 'tecno', 'huawei', 'sony', 'mate 60'],
  Tablet: ['ipad', 'tablet', 'matepad', 'galaxy tab', 'tab s'],
  Laptop: ['laptop', 'notebook', 'macbook', 'vivobook', 'zenbook', 'ideapad', 'thinkpad', 'yoga', 'spectre', 'xps', 'inspiron', 'omen', 'victus', 'predator', 'nitro', 'swift', 'aura', 'rog', 'tuf', 'alienware', 'legion', 'loq', 'katana', 'stealth', 'raider', 'titan', 'gram', 'matebook', 'aorus'],
  'Màn hình': ['monitor', 'display', 'screen', 'agon', 'odyssey', 'ultragear', 'viewfinity', 'proart', 'benq', 'viewsonic', 'philips', 'aoc', 'raptor', 'm27', 'm32', 'm34'],
  'PC Gaming': ['gaming pc', 'gaming computer', 'tower', 'desktop', 'workstation', 'ssd', 'solid-state', 'solid state', 'drive', 'nvme', 'm.2', 'graphics card', 'geforce', 'rtx', 'ryzen', 'core i', 'ram', 'memory', 'dimm', 'sodimm', 'power supply', 'cooler', 'fan', 'tuf', 'g200', 'ak620', 'firecuda', 'rm850', 'rm750', 'mp700', 'trident z5', 'ripjaws', 'fury beast', 'hdd', 'baracuda'],
  Chuột: ['mouse', 'mice', 'raton', 'ratón', 'maus', 'viper', 'deathadder', 'basilisk', 'g502', 'superlight', 'kronos', 'kain', 'sensei', 'abyss', 'rival', 'm75', 'katar', 'xm2'],
  'Bàn phím': ['keyboard', 'keychron', 'blackwidow', 'huntsman', 'apex', 'k70', 'k100', 'k65', 'hhkb', 'realforce', 'clavier', 'teclado', 'k3'],
  'Tai nghe': ['headset', 'headphone', 'cascos', 'casque', 'earphone', 'airpod', 'quietcomfort', 'arctis', 'quantum', 'cloud', 'void', 'delta', 'hs60', 'hs80', 'hyperx'],
  'Phụ kiện': ['charger', 'power bank', 'power adapter', 'hub', 'stream deck', 'wave', 'hd60', 'webcam', 'c920', 'brio', 'streamcam', 'cable', 'adapter', 'microphone', 'seiren', 'icue link', 'battery', 'surface pro'],
};

const REJECT =
  /\b(disassembl|teardown|exploded|schematic|circuit|mainboard|motherboard|logic board|pcb|chipset|module|stick|sodimm|dimm|coolant|pump|connector|cable|port|button|wheel|underneath|bottom|top view|rear view|back view|side view|inside|interior|logo|icon|diagram|chart|booth|game ?show|gamescom|comiket|esport|tournament|championship|person|people|man|woman|player|streamer|interview|autograph|crowd|audience|stage|panel|signing|museum|store|office|desk|setup|box|package|unboxing|review|comparison|boit|tokyo-game-show|faceit|homestory|hwc|esl|blast)\b/i;

function typeOfFile(fname: string): string | null {
  const t = fname.toLowerCase();
  if (/headset|headphone|earphone|airpod|casque/.test(t)) return 'Tai nghe';
  if (/keyboard|clavier|teclado|keycap|keychron|blackwidow|huntsman|apex/.test(t)) return 'Bàn phím';
  if (/mouse|mice|raton|maus/.test(t)) return 'Chuột';
  if (/monitor|display|screen/.test(t)) return 'Màn hình';
  if (/laptop|notebook|macbook|netbook/.test(t)) return 'Laptop';
  if (/ipad|tablet|matepad/.test(t)) return 'Tablet';
  if (/iphone|smartphone|pixel/.test(t)) return 'Điện thoại';

  if (/galaxy/.test(t)) return null;
  return null;
}

function fileName(url: string): string {
  const clean = decodeURIComponent(url.split('?')[0]);
  const parts = clean.split('/');
  return parts[parts.length - 1] ?? '';
}

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function signatureTokens(model: string): string[] {
  const cleaned = model
    .replace(/\s*\d{1,2}(?:\.\d+)?in$/i, '')
    .replace(/\s*\d{1,2}(?:\.\d+)?\s*(?:"|inch)$/i, '')
    .trim();

  const words = cleaned
    .split(/[\s-]+/)
    .map((w) => w.replace(/[^\w]/g, ''))
    .filter((w) => w.length >= 2);

  const stop = new Set([
    'wireless', 'rgb', 'usb', 'plus', 'mini', 'max', 'carbon', 'black',
    'white', 'grey', 'gray', 'silver', 'graphite', 'titanium', 'edition',
    'pro', 'air', 'se', 'studio', 'series', 'generation', 'gen', 'inch',
    'inches', 'w', 'x', 'ii', 'iii', 'iv', 'the',
  ]);

  const toks = words.filter((w) => !stop.has(w.toLowerCase()));
  if (!toks.length) return [];

  const out: string[] = [];
  for (let i = 0; i < toks.length; i++) {
    const w = toks[i];
    if (/\d/.test(w)) {
      const prev = toks[i - 1];
      out.push(prev ? norm(prev + w) : norm(w));
      out.push(norm(w));
    } else {
      out.push(norm(w));
    }
  }

  return [...new Set(out)];
}

function keyTokens(model: string): string[] {
  const toks = signatureTokens(model);
  if (!toks.length) return [];
  const withDigit = toks.filter((t) => /\d/.test(t));
  if (withDigit.length) return withDigit;
  return [toks.slice().sort((a, b) => b.length - a.length)[0]];
}

function resolveType(
  model: string,
  categoryName: string,
): string {
  const m = model.toLowerCase();

  if (/ipad|galaxy tab|tablet|matepad|xiaomi pad/.test(m)) return 'Tablet';

  switch (categoryName) {
    case 'Điện thoại':
      return 'Điện thoại';
    case 'Laptop':
      return 'Laptop';
    case 'Màn hình':
      return 'Màn hình';
    case 'PC Gaming':
      return 'PC Gaming';
    case 'Chuột':
      return 'Chuột';
    case 'Bàn phím':
      return 'Bàn phím';
    case 'Tai nghe':
      return 'Tai nghe';
    case 'Phụ kiện':
      return 'Phụ kiện';
    default:
      return inferType(model);
  }
}

function inferType(model: string): string {
  const m = model.toLowerCase();

  if (/ipad|galaxy tab|tablet|matepad|xiaomi pad/.test(m)) return 'Tablet';

  if (/iphone|pixel|galaxy s|galaxy z|galaxy a\d|galaxy note|oneplus|oppo|vivo|xiaomi|redmi|poco|honor|realme|nokia|tecno|rog phone|mate 60/.test(m)) {
    return 'Điện thoại';
  }

  if (/headset|headphone|earphone|airpod|quietcomfort|arctis|quantum|cloud|void|delta|hs60|hs80|wh-1000|wf-1000|beats|hyperx|bose|jbl|astro|razer seiren/.test(m)) {
    return 'Tai nghe';
  }

  if (/keyboard|keychron|blackwidow|huntsman|apex|k70|k100|k65|hhkb|realforce|clavier|teclado|mx keys|g915|g pro x 60|trackpoint/.test(m)) {
    return 'Bàn phím';
  }

  if (/mouse|mice|viper|deathadder|basilisk|g502|superlight|kronos|kain|sensei|abyss|rival|m75|katar|xm2|harpe|mx master/.test(m)) {
    return 'Chuột';
  }

  if (/monitor|display|odyssey|ultragear|viewfinity|proart|benq|viewsonic|philips|aoc|raptor|m27q|m32uc|m34wmu|xl25|agon|ultrasharp|alienware aw32|alienware aw27|thinkvision|legion r32|mag 32|mpg 27|ultrawide|xeneon/.test(m)) {
    return 'Màn hình';
  }

  if (/laptop|notebook|macbook|vivobook|zenbook|ideapad|thinkpad|yoga|spectre|xps|inspiron|omen|victus|predator|nitro|swift|aura|rog |tuf |alienware x|legion|loq|katana|stealth|raider|titan|gram|matebook|aorus|surface|g16|g614|blade/.test(m)) {
    return 'Laptop';
  }

  if (/ssd|nvme|firecuda|barracuda|990 pro|870 evo|sn850x|sn580|p3 plus|t500|trident|ripjaws|fury|dimm|memory|rm850|rm750|mp700|ak620|g200|rtx|ryzen|core i[3579]|geforce/.test(m)) {
    return 'PC Gaming';
  }

  return 'Phụ kiện';
}

function typeOk(fname: string, type: string): boolean {
  const low = fname.toLowerCase();
  if (REJECT.test(low)) return false;
  const fileType = typeOfFile(fname);
  if (fileType && fileType !== type) return false;

  const flat = norm(fname);
  const kw = TYPE_KEYWORDS[type] ?? [];
  if (kw.length && !kw.some((k) => flat.includes(norm(k)))) return false;
  return true;
}

async function main() {
  await connectDB();
  const products = await ProductModel.find({})
    .select('name categoryName brand')
    .lean();

  const modelType = new Map<string, string>();
  for (const p of products) {
    const m = modelName(String(p.name));
    if (!modelType.has(m)) {
      modelType.set(m, resolveType(m, String(p.categoryName ?? '')));
    }
  }

  const db = JSON.parse(readFileSync(DEST, 'utf-8')) as Record<
    string,
    { images: string[]; source: string; title: string }
  >;

  let cleaned = 0;
  let kept = 0;
  let emptied = 0;

  for (const [model, entry] of Object.entries(db)) {
    const type = modelType.get(model) ?? inferType(model);
    const pool = entry.images ?? [];
    if (!pool.length) continue;

    const byType = pool.filter((u) => typeOk(fileName(u), type));

    const tokens = signatureTokens(model);
    const keys = keyTokens(model);

    const scored = byType
      .map((u) => {
        const f = norm(fileName(u));
        const keyHits = keys.filter((k) => f.includes(k)).length;
        const tokHits = tokens.filter((t) => f.includes(t)).length;

        const nameLen = fileName(u).length;
        return { u, keyHits, tokHits, nameLen };
      })
      .sort(
        (a, b) =>
          b.keyHits - a.keyHits ||
          b.tokHits - a.tokHits ||
          a.nameLen - b.nameLen,
      );

    const strict = scored.filter((x) => x.keyHits === keys.length);
    const loose = scored.filter((x) => x.keyHits > 0);
    const picked = (strict.length ? strict : loose.length ? loose : scored)
      .slice(0, 8)
      .map((x) => x.u);

    const next = picked;

    if (next.length === pool.length) {
      kept++;
      continue;
    }
    if (!next.length) {
      emptied++;
      console.log(`⚠ ${model.padEnd(44)} [${type}] không còn ảnh nào đúng loại`);
      if (!DRY) {

        db[model] = {
          images: [],
          source: entry.source ?? 'commons',
          title: entry.title ?? '',
        };
      }
      continue;
    }
    cleaned++;
    console.log(
      `✓ ${model.padEnd(44)} [${type}] ${pool.length} -> ${next.length} ảnh`,
    );
    if (!DRY) {
      db[model] = {
        images: next,
        source: entry.source ?? 'commons',
        title: entry.title ?? '',
      };
    }
  }

  if (!DRY) {
    writeFileSync(DEST, JSON.stringify(db, null, 2), 'utf-8');
  }
  console.log(
    `\n[curate] Đã lọc ${cleaned} model, giữ nguyên ${kept}, rỗng ${emptied}.` +
      (DRY ? ' (DRY RUN — chưa ghi file)' : ''),
  );
  await disconnectDB();
}

function score(fname: string, tokens: string[]): number {
  const f = norm(fname);
  return tokens.filter((t) => f.includes(t)).length;
}

void main();