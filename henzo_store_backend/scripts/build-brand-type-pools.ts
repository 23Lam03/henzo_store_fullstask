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
  'type-category-files.json',
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
const allFiles = [...universe].filter((f) => /\.(jpe?g|png|webp)$/i.test(f));

const NOISE = new RegExp(
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
    'beach', 'sunset', '\\bbird\\b', 'insect', 'plant', 'flower', 'animal',
    '\\bdog\\b', '\\bcat\\b', '\\bhorse\\b', '\\bfish\\b', '\\btree\\b',
    'forest', '\\bsky\\b', 'cloud chamber', 'rolls-royce', 'rolls royce',
    'porsche', 'ferrari', '\\bbmw\\b', 'nissan', 'ford ', 'bentley',
    'aston', 'lamborghini', 'toyota', 'honda', 'mercedes', '\\bboat\\b',
    '\\bship\\b', '\\btrain\\b', 'aircraft', 'cemetery', 'graffiti', 'mural',
    'statue', 'painting', 'engraving', '\\bcoin\\b', 'stamp', 'banknote',
    'comic', 'book cover', 'portrait', 'headquarters', '\\bmall\\b',
    'expo', '\\bfair\\b', 'computer ?expo', 'it ?show', 'computex',
    'taipei', 'tokyo ?game', 'gamescom', 'ces ?20', 'ifa ?20', 'mwc',
    'showcase', 'show ?floor', 'display ?case', '\\bstand\\b',
    'live ?stream', 'livestream', 'streaming', '\\bsetup\\b',
    'keyboard ?layout', 'layout', 'wiring', 'circuit', 'internals?',
    'unboxing', 'review', '\\bfront\\b', '\\bback\\b', '\\brear\\b',
    '\\bbottom\\b', 'underside', 'wall ?mount', '\\bpanel\\b', '\\bport\\b',
    '\\bconnector\\b', '\\bbutton\\b', '\\bstand\\b', 'underside',
    '\\bwith\\b.*\\band\\b', 'accessor', '\\bcable\\b', '\\bbox\\b',
    '\\bpackage\\b', '\\bmanual\\b', '\\bwarranty\\b', '\\bserial\\b',
    '\\bsticker\\b', '\\blabel\\b', '\\bbarcode\\b', '\\bprice\\b',
    '\\bmodel\\b.*\\bnotebook\\b', 'screenshot', 'app ?icon',
  ].join('|'),
  'i',
);

const TYPE_RULES: Array<{ type: string; must: RegExp; also?: RegExp }> = [
  { type: 'HEADSET', must: /headset|headphone|earphone|earbuds|head ?band/i },
  { type: 'MONITOR', must: /\bmonitor\b|lcd ?monitor|flat ?panel/i },
  { type: 'MOUSE', must: /\bmouse\b/i, also: /computer|gaming|wireless|optical/i },
  { type: 'KEYBOARD', must: /\bkeyboard\b|\bkey ?board\b|\btkl\b|tenkeyless/i },
  { type: 'MIC', must: /microphone|\bmic\b|\bmicro ?phone\b/i },
  { type: 'WEBCAM', must: /web ?cam/i },
  {
    type: 'STORAGE',
    must: /\bssd\b|nvme|\bm\. ?2\b|solid ?state|hard ?disk|\bhdd\b/i,
  },
  {
    type: 'RAM',
    must: /\bram\b|dimm|sdram|memory module|ddr[345]|\bfury\b|\btrident\b|ripjaws/i,
  },
  { type: 'COOLER', must: /cooler|cooling|heatsink|radiator|\bwater ?cool/i },
  { type: 'PSU', must: /power ?supply|\bpsu\b/i },
  {
    type: 'GPU',
    must: /\brtx\b|\bgtx\b|geforce|graphics ?card|\bgpu\b|radeon|\bquadro\b/i,
  },
  {
    type: 'CPU',
    must: /\bryzen\b|\bcore i[3579]\b|processor|\bcpu\b|threadripper|\bepyc\b/i,
  },
  {
    type: 'PC_CASE',
    must: /\bcase\b|tower|chassis|mini ?itx|midi ?tower/i,
  },
  { type: 'LAPTOP', must: /laptop|notebook|macbook|thinkpad|ideapad|zenbook/i },
  { type: 'TABLET', must: /\btablet\b|ipad|galaxy ?tab/i },
  {
    type: 'PHONE',
    must: /iphone|galaxy s\d|galaxy a\d|galaxy z|pixel|huawei|xiaomi|redmi|one ?plus|oppo|vivo|honor|mobile phone|smartphone|nokia|realme|poco|motorola/i,
  },
  { type: 'ACCESSORY', must: /\bhub\b|adapter|charger|dock|\bcable\b|mouse ?pad/i },
];

const BRANDS = [
  'Apple', 'Samsung', 'Xiaomi', 'Huawei', 'Honor', 'Oppo', 'Vivo', 'OnePlus',
  'Google', 'Realme', 'Poco', 'Nokia', 'Motorola', 'Dell', 'HP', 'Asus', 'Acer',
  'Lenovo', 'Microsoft', 'Logitech', 'Razer', 'Corsair', 'SteelSeries', 'HyperX',
  'Kingston', 'Crucial', 'G.Skill', 'Seagate', 'Western Digital', 'Thermaltake',
  'DeepCool', 'Arctic', 'Noctua', 'Cooler Master', 'be quiet', 'NZXT', 'Lian Li',
  'Antec', 'Aerocool', 'Fractal', 'Phanteks', 'MSI', 'Gigabyte', 'AOC',
  'ViewSonic', 'BenQ', 'Zowie', 'LG', 'Alienware', 'Elgato', 'Keychron',
  'Pulsar', 'Roccat', 'Fantek', 'Trust', 'Edifier', 'JBL', 'Bose', 'Sony',
  'Soundcore', 'Anker', 'Belkin', 'Ducky', 'Glorious', 'Endgame Gear',
  'Redragon', 'Bloody', 'Havit', 'Targus', 'SanDisk', 'Teamgroup', 'Adata',
  'Lexar', 'Sabrent', 'PNY', 'Buffalo', 'Seasonic', 'EVGA', 'Cougar', 'ASRock',
  'Palit', 'Sapphire', 'Zotac', 'Gainward', 'Inno3D', 'AKG', 'Audio-Technica',
  'Sennheiser', 'Fifine', 'Blue', 'Shure', 'Samson', 'Astro', 'Turtle Beach',
  'Creative', 'AKG', 'WD', 'Sennheiser', 'Zowie', 'HP', 'Huawei', 'Samsung',
];

function norm(s: string): string {
  return s.toLowerCase().replace(/[_\-.,()'""]/g, ' ').replace(/\s+/g, ' ').trim();
}

const out: Record<string, Record<string, string[]>> = {};

for (const file of allFiles) {
  if (NOISE.test(file)) continue;
  const n = norm(file);

  let type = '';
  for (const rule of TYPE_RULES) {
    if (!rule.must.test(file)) continue;
    if (rule.also && !rule.also.test(file) && rule.type === 'MOUSE') continue;
    type = rule.type;
    break;
  }
  if (!type) continue;

  let brand = '';
  let bestLen = 0;
  for (const b of BRANDS) {
    const bn = norm(b);
    if (bn.length <= bestLen) continue;
    if (n.includes(bn)) {
      brand = b;
      bestLen = bn.length;
    }
  }
  if (!brand) continue;

  out[type] ??= {};
  (out[type][brand] ??= []).push(file);
}

for (const t of Object.keys(out)) {
  for (const b of Object.keys(out[t])) out[t][b] = [...new Set(out[t][b])];
}

writeFileSync(resolve(DATA, 'brand-type-pools.json'), JSON.stringify(out, null, 2), 'utf-8');
console.log(`[pool] ${allFiles.length} file -> ${Object.keys(out).length} loại`);
for (const [t, brands] of Object.entries(out)) {
  const total = Object.values(brands).reduce((a, v) => a + v.length, 0);
  console.log(
    `  ${t}: ${total} (${Object.keys(brands).length} brand) -> ${Object.entries(brands)
      .sort((a, c) => c[1].length - a[1].length)
      .map(([b, v]) => `${b}:${v.length}`)
      .join(', ')}`,
  );
}
