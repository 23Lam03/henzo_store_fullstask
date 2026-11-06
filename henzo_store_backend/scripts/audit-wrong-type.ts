import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { modelName } from './lib/model-name';

const TYPE_KEYWORDS: Record<string, string[]> = {
  'Điện thoại': ['iphone', 'galaxy', 'pixel', 'phone', 'oneplus', 'oppo', 'vivo', 'xiaomi', 'redmi', 'poco', 'honor', 'realme', 'nokia', 'tecno', 'huawei', 'sony'],
  Tablet: ['ipad', 'tablet', 'matepad', 'surface pro'],
  Laptop: ['laptop', 'notebook', 'macbook', 'vivobook', 'zenbook', 'ideapad', 'thinkpad', 'yoga', 'spectre', 'xps', 'inspiron', 'omen', 'victus', 'predator', 'nitro', 'swift', 'aura', 'rog', 'tuf', 'alienware', 'legion', 'loq', 'katana', 'stealth', 'raider', 'titan', 'gram', 'matebook'],
  'Màn hình': ['monitor', 'display', 'screen', 'agon', 'odyssey', 'ultragear', 'viewfinity', 'proart', 'alienware aw', 'benq', 'viewsonic', 'philips', 'aoc'],
  'PC Gaming': ['gaming pc', 'gaming computer', 'tower', 'desktop', 'workstation', 'ssd', 'solid-state', 'drive', 'nvme', 'm.2', 'graphics card', 'geforce', 'rtx', 'ryzen', 'core i', 'threadripper'],
  Chuột: ['mouse', 'mice', 'raton', 'ratón', 'maus', 'viper', 'deathadder', 'basilisk', 'g502', 'superlight', 'kronos', 'kain', 'sensei', 'abyss', 'kronos'],
  'Bàn phím': ['keyboard', 'keychron', 'blackwidow', 'huntsman', 'apex', 'k70', 'k100', 'k65', 'hhkb', 'realforce', 'clavier', 'teclado'],
  'Tai nghe': ['headset', 'headphone', 'cascos', 'casque', 'earphone', 'airpod', 'quietcomfort', 'arctis', 'cloud'],
  'Phụ kiện': ['charger', 'power bank', 'power adapter', 'hub', 'stream deck', 'wave', 'hd60', 'webcam', 'c920', 'brio', 'streamcam', 'cable', 'adapter'],
};

function fileOf(url: string): string {
  const raw = url.split('?')[0].split('/').pop() ?? '';
  return decodeURIComponent(raw).replace(/^\d+px-/, '').toLowerCase();
}

const mock = JSON.parse(
  readFileSync(resolve(process.cwd(), 'scripts/data/frontend-mock.json'), 'utf-8'),
);
const all = JSON.parse(
  readFileSync(resolve(process.cwd(), 'scripts/data/model-images.json'), 'utf-8'),
);

const info = new Map<string, { brand: string; categoryName: string }>();
for (const p of [...(mock.products as any[]), ...((mock.sellerProducts ?? []) as any[])]) {
  const m = modelName(p.name);
  if (!info.has(m)) info.set(m, { brand: p.brand, categoryName: p.categoryName ?? '' });
}

const wrongType: string[] = [];
const noKeyword: string[] = [];

for (const [model, v] of Object.entries<any>(all)) {
  const meta = info.get(model);
  if (!meta) continue;
  const cat = meta.categoryName;
  if (!TYPE_KEYWORDS[cat]) continue;

  const file = fileOf(v.images[0] ?? '');
  if (!file) continue;

  if (TYPE_KEYWORDS[cat].some((k) => file.includes(k))) continue;

  const otherCat = Object.entries(TYPE_KEYWORDS).find(
    ([c, kws]) =>
      c !== cat && kws.some((k) => file.includes(k)),
  );
  if (otherCat) {
    wrongType.push(
      `${model}\t${cat}\t-> ${otherCat[0]}\t${file}`,
    );
  } else {
    noKeyword.push(`${model}\t${cat}\t${file}`);
  }
}

console.log(`=== SAI LOẠI RÕ RÀNG (${wrongType.length}) ===`);
wrongType.forEach((x) => console.log('  ' + x));
console.log(`\n=== KHÔNG CÓ TỪ KHOÁ (${noKeyword.length}) - cần xem tay ===`);
noKeyword.forEach((x) => console.log('  ' + x));
