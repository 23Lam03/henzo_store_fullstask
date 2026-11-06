import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

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

const REJECT =
  /\b(disassembl|teardown|exploded|schematic|circuit|mainboard|motherboard|logic board|pcb|chipset|module|stick|sodimm|dimm|coolant|pump|connector|cable|port|button|wheel|underneath|bottom|top view|rear view|back view|side view|inside|interior|logo|icon|diagram|chart|booth|game ?show|gamescom|comiket|esport|tournament|championship|person|people|man|woman|player|streamer|interview|autograph|crowd|audience|stage|panel|signing|museum|store|office|desk|setup|box|package|unboxing|review|comparison|boit|tokyo-game-show|faceit|homestory|hwc|esl|blast|key\.jpg|keyboard|headset|headphone|mouse|monitor|laptop|smartphone)\b/i;

function inferType(model: string): string {
  const m = model.toLowerCase();
  if (/iphone|galaxy|pixel|oneplus|oppo|vivo|xiaomi|redmi|poco|honor|realme|nokia|tecno|iphone/.test(m)) {
    return /ipad|tab /.test(m) ? 'Tablet' : 'Điện thoại';
  }
  if (/ipad|tablet/.test(m)) return 'Tablet';
  if (/laptop|notebook|macbook|vivobook|zenbook|ideapad|thinkpad|yoga|spectre|xps|inspiron|omen|victus|predator|nitro|swift|aura|rog |tuf |alienware|legion|loq|katana|stealth|raider|titan|gram|matebook|aorus|surface/.test(m)) {
    return 'Laptop';
  }
  if (/monitor|display|odyssey|ultragear|viewfinity|proart|benq|viewsonic|philips|aoc|raptor|m27q|m32uc|m34wmu|xl25|xl25|agon|alienware aw32|ultrasharp/.test(m)) {
    return 'Màn hình';
  }
  if (/mouse|mice|viper|deathadder|basilisk|g502|superlight|kronos|kain|sensei|abyss|rival|m75|katar|xm2|harpe/.test(m)) {
    return 'Chuột';
  }
  if (/keyboard|keychron|blackwidow|huntsman|apex|k70|k100|k65|hhkb|realforce|clavier|teclado|k3 |mx keys|g915|g pro x 60|trackpoint/.test(m)) {
    return 'Bàn phím';
  }
  if (/headset|headphone|airpod|quietcomfort|arctis|quantum|cloud|void|delta|hs60|hs80|sony wh|sony wf|beats|hyperx|jbl|bose|razer seiren|astro/.test(m)) {
    return 'Tai nghe';
  }
  if (/ssd|nvme|firecuda|barracuda|990 pro|870 evo|sn850x|sn580|p3 plus|t500|trident|ripjaws|fury|dimm|memory|rm850|rm750|mp700|ak620|g200|rtx|ryzen|core i[3579]/.test(m)) {
    return 'PC Gaming';
  }
  if (/charger|power bank|adapter|hub|stream deck|wave|hd60|webcam|c920|brio|streamcam|cable|microphone|icue link|20w|45w|65w/.test(m)) {
    return 'Phụ kiện';
  }
  return 'Phụ kiện';
}

function typeOfFile(filename: string): string | null {
  const t = filename.toLowerCase();
  if (/headset|headphone|earphone|airpod|headset|headsets|casque/.test(t)) return 'Tai nghe';
  if (/keyboard|clavier|teclado|keycap|keychron|blackwidow|huntsman|apex/.test(t)) return 'Bàn phím';
  if (/mouse|mice|raton|maus|mousing/.test(t)) return 'Chuột';
  if (/monitor|display|screen/.test(t)) return 'Màn hình';
  if (/laptop|notebook|macbook|netbook/.test(t)) return 'Laptop';
  if (/iphone|galaxy|smartphone|phone|pixel/.test(t)) return 'Điện thoại';
  if (/tablet|ipad/.test(t)) return 'Tablet';
  return null;
}

function fileName(url: string): string {
  const clean = decodeURIComponent(url.split('?')[0]);
  const parts = clean.split('/');
  return parts[parts.length - 1] ?? '';
}

async function main() {
  const db = JSON.parse(
    readFileSync(
      resolve(process.cwd(), 'scripts/data/model-images.json'),
      'utf-8',
    ),
  ) as Record<string, { images: string[]; source: string; title: string }>;

  const report: {
    model: string;
    type: string;
    total: number;
    wrongType: string[];
    rejected: string[];
    ok: number;
  }[] = [];

  let badModels = 0;
  for (const [model, entry] of Object.entries(db)) {
    const type = inferType(model);
    const kw = TYPE_KEYWORDS[type] ?? [];
    const wrongType: string[] = [];
    const rejected: string[] = [];
    let ok = 0;

    for (const url of entry.images ?? []) {
      const fname = fileName(url);
      const lower = fname.toLowerCase();

      if (REJECT.test(lower)) {
        rejected.push(fname);
        continue;
      }
      const fileType = typeOfFile(fname);
      if (fileType && fileType !== type) {
        wrongType.push(`${fname} (${fileType})`);
        continue;
      }
      if (kw.length && !kw.some((k) => lower.includes(k))) {
        rejected.push(fname);
        continue;
      }
      ok++;
    }

    if (wrongType.length || rejected.length || ok === 0) {
      badModels++;
      report.push({
        model,
        type,
        total: (entry.images ?? []).length,
        wrongType,
        rejected,
        ok,
      });
    }
  }

  report.sort((a, b) => a.ok - b.ok);
  console.log(`Tổng model có pool: ${Object.keys(db).length}`);
  console.log(`Model cần sửa pool: ${badModels}\n`);
  for (const r of report.slice(0, 40)) {
    console.log(`${r.model.padEnd(44)} [${r.type}] ok=${r.ok}/${r.total}`);
    r.wrongType.slice(0, 3).forEach((x) => console.log(`    SAI LOẠI: ${x}`));
    r.rejected.slice(0, 3).forEach((x) => console.log(`    loại bỏ:   ${x}`));
  }
  if (report.length > 40) console.log(`... +${report.length - 40} model nữa`);

  writeFileSync(
    resolve(process.cwd(), 'scripts/data/model-pool-audit.json'),
    JSON.stringify(report, null, 2),
  );
}

void main();