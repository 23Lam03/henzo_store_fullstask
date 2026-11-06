import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const DATA = resolve(process.cwd(), 'scripts/data');

function readJson<T>(f: string, fallback: T): T {
  const p = resolve(DATA, f);
  if (!existsSync(p)) return fallback;
  try {
    return JSON.parse(readFileSync(p, 'utf-8')) as T;
  } catch {
    return fallback;
  }
}

const universe = new Set<string>();

function addAll(v: unknown): void {
  if (Array.isArray(v)) {
    for (const x of v) {
      if (typeof x === 'string') universe.add(x);
      else if (x && typeof x === 'object') {
        const o = x as Record<string, unknown>;
        if (typeof o.title === 'string') universe.add(o.title);
        if (typeof o.file === 'string') universe.add(o.file);
      }
    }
  } else if (v && typeof v === 'object') {
    for (const x of Object.values(v as Record<string, unknown>)) addAll(x);
  }
}

for (const f of [
  'image-pools.json',
  'expanded-pools.json',
  'curated-model-files.json',
  'candidate-categories.json',
  'brand-category-files.json',
  'model-categories.json',
  'category-product-files.json',
  'type-brand-pools.json',
]) {
  addAll(readJson(f, {}));
}

for (const f of ['code-model-probe.json', 'prefix-model-probe.json']) {
  const d = readJson<Record<string, any>>(f, {});
  for (const rec of Object.values(d)) {
    if (rec?.files && typeof rec.files === 'object' && !Array.isArray(rec.files)) {
      for (const key of Object.keys(rec.files)) {
        if (/\.(jpe?g|png|webp)$/i.test(key)) universe.add(key);
      }
    }
  }
}

const files = [...universe].filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
console.log(`[universe] ${files.length} file`);

const REJECT = new RegExp(
  [
    'wcg', 'grand ?final', 'esport', 'tournament', 'championship',
    '\\bbooth\\b', '\\bperson\\b', '\\bpeople\\b', '\\bman\\b', '\\bwoman\\b',
    '\\bboy\\b', '\\bgirl\\b', '\\bgamer\\b', 'holding', 'broken', 'cracked',
    'damaged', 'poster', 'advert', 'disassembl', 'teardown', '\\bpcb\\b',
    'chipset', 'raspberry', 'microbit', 'arduino', 'zipper', 'storage bag',
    'palm ?top', '8088', 'columbia data', '\\blogo\\b', '\\bicon\\b',
    'diagram', '\\bchart\\b', 'packaging', '\\bstage\\b', 'crowd', 'interview',
    'conference', 'signage', '\\bwall\\b', '\\bshelf\\b', 'store ?front',
    'shop ?front', 'unsplash', 'keyboard ?layout', 'flag of', 'coat of arms',
    '\\bmeme\\b', 'exhibition', 'concert', 'album cover', 'toy', 'miniature',
    'model ?railway', 'die ?cast', 'action ?figure', 'lego', 'museum',
    'building', 'street', 'landscape', 'church', 'castle', 'mountain',
    'beach', 'sunset', 'bird', 'insect', 'plant', 'flower', 'animal',
    '\\bdog\\b', '\\bcat\\b', '\\bhorse\\b', '\\bfish\\b', '\\btree\\b',
    'forest', 'sky', 'sun ', 'moon', 'star ', 'cloud chamber', 'rolls-royce',
    'rolls royce', 'porsche', 'ferrari', 'bmw', 'nissan', 'ford ',
    'bentley', 'aston', 'lamborghini', 'toyota', 'honda', 'mercedes',
    'boat', 'ship', 'train', 'plane', 'aircraft', 'church', 'cemetery',
    'graffiti', 'mural', 'statue', 'painting', 'engraving', 'coin', 'stamp',
    'banknote', 'comic', 'book cover', 'portrait',
  ].join('|'),
  'i',
);

const WORN =
  /broken|cracked|damaged|disassembl|\bopened\b|open ?case|internals?|circuit board|\bteardown\b/i;

const STOP = new Set([
  'pro', 'plus', 'max', 'ultra', 'mini', 'air', 'gen', 'series', 'inch',
  'gaming', 'wireless', 'rgb', 'black', 'white', 'silver', 'grey', 'gray',
  'edition', 'combo', 'package', 'kit', 'deep', 'esports', 'tong', 'hop',
  'with', 'and', 'the', 'for', 'full', 'size', 'type', 'ready', 'silent',
  'build', 'streaming', 'workstation', 'budget', 'arena', 'starter',
  'carbon', 'model', 'curved', 'flat', 'copilot', 'studio', 'ai',
  'oled', 'led', 'mini', 'qhd', 'uhd', 'hdr', 'ips', 'va', 'tn',
  'gb', 'tb', 'mb', 'gamingx', 'gaming', 'phonking', 'tournament', 'custom',
  'starting', 'starter', 'flagship', 'creator', 'pro', 'plus',
]);

function stripNoise(model: string): string {
  return model
    .replace(/\b\d+\s?(GB|TB|MB)\b/gi, ' ')
    .replace(/\b\d{3,4}\s?(GB|TB)\b/gi, ' ')
    .replace(/\bCopilot\+/gi, ' ')
    .replace(/\bQHD\b/gi, ' ')
    .replace(/\bOLED\b/gi, ' ')
    .replace(/\bMini\s?LED\b/gi, ' ')
    .replace(/\bAI Studio\b/gi, ' ')
    .replace(/\bTổng hợp\b/gi, ' ')
    .replace(/\bDeep\b/gi, ' ')
    .replace(/\bUSB-C\b/gi, ' ')
    .replace(/\bRGB USB\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokens(model: string): string[] {
  return stripNoise(model)
    .replace(/[()]/g, ' ')
    .split(/[^A-Za-z0-9]+/)
    .filter((t) => t.length >= 3 && !STOP.has(t.toLowerCase()))
    .sort((a, b) => b.length - a.length);
}

function codes(model: string): string[] {
  const m = stripNoise(model).match(/[A-Za-z]+\d+[A-Za-z0-9\-]*|\d+[A-Za-z]+[A-Za-z0-9\-]*/g);
  return (m ?? []).filter((t) => t.length >= 4 && !/^\d+(GB|TB|MB)$/i.test(t));
}

function norm(s: string): string {
  return s.toLowerCase().replace(/[_.]/g, ' ').replace(/\s+/g, ' ').trim();
}

function hasToken(hay: string, token: string): boolean {
  const t = norm(token);
  const idx = hay.indexOf(t);
  if (idx < 0) return false;
  const before = hay[idx - 1];
  const after = hay[idx + t.length];
  const isBoundary = (c: string | undefined) =>
    c === undefined || !/[a-z0-9]/.test(c);
  return isBoundary(before) && isBoundary(after);
}

const TYPE_WORDS: Record<string, RegExp> = {
  'Tai nghe': /headset|headphone|earphone|head ?band|earbuds/i,
  'Chuột': /\bmouse\b|gaming mouse/i,
  'Bàn phím': /keyboard|key ?board/i,
  'Màn hình': /\bmonitor\b|\bdisplay\b|\bscreen\b|flat ?panel/i,
  'Laptop': /\blaptop\b|notebook|macbook|thinkpad|ideapad|zenbook/i,
  'Tablet': /\btablet\b|ipad|galaxy ?tab/i,
  'Điện thoại': /iphone|galaxy|pixel|huawei|xiaomi|redmi|one ?plus|oppo|vivo|honor|mobile phone|smartphone/i,
  'Micro': /microphone|\bmic\b/i,
  'Webcam': /web ?cam/i,
  'SSD': /\bssd\b|nvme|m\. ?2|storage/i,
  'RAM': /\bram\b|dimm|sdram|memory|ddr[345]|fury|trident|ripjaws/i,
  'Tản nhiệt': /cooler|cooling|heatsink|radiator|fan/i,
  'Nguồn': /power ?supply|\bpsu\b/i,
  'VGA': /\brtx\b|geforce|graphics ?card|\bgpu\b|radeon/i,
  'Case': /\bcase\b|tower|chassis/i,
  'Ổ cứng': /hard ?disk|\bhdd\b|seagate/i,
  'CPU': /\bryzen\b|\bcore i[3579]\b|processor|\bcpu\b|threadripper/i,
  'Mainboard': /motherboard|\bmainboard\b|\bmobo\b/i,
};

interface ModelInfo {
  model: string;
  brand: string;
  categoryName: string;
}

function loadModels(): ModelInfo[] {
  const mock = readJson<any>('frontend-mock.json', { products: [], sellerProducts: [] });
  const map = new Map<string, ModelInfo>();
  for (const p of [...(mock.products ?? []), ...(mock.sellerProducts ?? [])]) {
    const name = String(p.name ?? '');
    if (!name) continue;
    if (!map.has(name)) {
      map.set(name, {
        model: name,
        brand: String(p.brand ?? ''),
        categoryName: String(p.categoryName ?? ''),
      });
    }
  }
  return [...map.values()];
}

const known = readJson<Record<string, any>>('model-images.json', {});
const models = loadModels();
const allModels = new Set<string>([...Object.keys(known), ...models.map((m) => m.model)]);
const brandOf = new Map<string, string>();
const catOf = new Map<string, string>();
for (const m of models) {
  brandOf.set(m.model, m.brand);
  catOf.set(m.model, m.categoryName);
}

export interface Scored {
  file: string;
  score: number;
  reasons: string[];
}

function scoreFile(
  model: string,
  brand: string,
  categoryName: string,
  file: string,
): { score: number; reasons: string[] } {
  if (REJECT.test(file) || WORN.test(file)) return { score: -1, reasons: [] };
  const hay = norm(file.replace(/\.[a-z]+$/i, ''));
  const reasons: string[] = [];
  let score = 0;

  const cs = codes(model);
  for (const c of cs) {
    if (hasToken(hay, c)) {
      score += 120;
      reasons.push(`code:${c}`);
      break;
    }
  }

  const toks = tokens(model);
  let hitCount = 0;
  for (const t of toks) {
    if (t.length >= 4 && hasToken(hay, t)) {
      hitCount++;
      score += hitCount <= 2 ? 60 : 25;
      reasons.push(`tok:${t}`);
    }
  }

  const b = brand.trim().toLowerCase();
  if (b && b !== 'custom' && hasToken(hay, b)) {
    score += 45;
    reasons.push('brand');
  }

  const tw = TYPE_WORDS[categoryName];
  if (tw && tw.test(file)) {
    score += 25;
    reasons.push('type');
  }

  const series = toks[0];
  if (series && hay.startsWith(norm(series))) {
    score += 40;
    reasons.push('prefix');
  }

  return { score, reasons };
}

const results: Record<string, Scored[]> = {};
for (const model of allModels) {
  const brand = brandOf.get(model) ?? '';
  const categoryName = catOf.get(model) ?? '';
  const list: Scored[] = [];
  for (const file of files) {
    const { score, reasons } = scoreFile(model, brand, categoryName, file);
    if (score > 0) list.push({ file, score, reasons });
  }
  list.sort((a, b) => b.score - a.score || a.file.localeCompare(b.file));
  results[model] = list.slice(0, 60);
}

writeFileSync(resolve(DATA, 'scored-candidates.json'), JSON.stringify(results, null, 2), 'utf-8');

const strong: string[] = [];
const mid: string[] = [];
for (const m of allModels) {
  const top = results[m][0];
  if (!top) continue;
  if (top.score >= 120) strong.push(m);
  else if (top.score >= 85) mid.push(m);
}
console.log(`[strong >=120] ${strong.length}`);
console.log(`[mid 85-119]   ${mid.length}`);
console.log(`[weak]         ${allModels.size - strong.length - mid.length}`);
