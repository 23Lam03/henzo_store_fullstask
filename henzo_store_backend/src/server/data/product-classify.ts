
const CATEGORY_RULES: Array<{ category: string; keywords: string[] }> = [
  {
    category: 'Điện thoại',
    keywords: [
      'iphone', 'galaxy', 'pixel', 'oneplus', 'oppo', 'vivo', 'xiaomi',
      'redmi', 'nokia', 'realme', 'poco', 'honor', 'tecno', 'zenfone',
      'nothing phone', 'motorola', 'ipad', 'rog phone',
    ],
  },
  {
    category: 'Tai nghe',
    keywords: [
      'airpods', 'wh-1000xm5', 'headphone', 'headset', 'arctis', 'cloud iii',
      'hs80', 'quantum', 'rog delta', 'buds', 'hd 450bt', 'tws', 'earphone',
    ],
  },
  {
    category: 'Chuột',
    keywords: [
      'mouse', 'deathadder', 'harpe', 'g502', 'xm2we', 'katar', 'basilisk',
      'g pro x superlight', 'mx master',
    ],
  },
  {
    category: 'Bàn phím',
    keywords: [
      'keyboard', 'tkl', 'blackwidow', 'huntsman', 'apex pro', 'vulcan',
      'mx keys', 'k100', 'q1 pro', 'k70', 'varmilo', 'realforce', 'keychron',
    ],
  },
  {
    category: 'Màn hình',
    keywords: [
      'odyssey', 'ultragear', 'proart', 'benq', 'viewsonic', 'agon',
      'm32uc', 'zowie', 'viewfinity', 'raptor', 'xl2546', 'xl2566',
      'ultrawide', 'aw3225', 'pa32ucg', 'm32q', 'monitor', 'omen 27',
      '27qs', '32fc', '27e2n', '321upx', 'm32u', 'm34', 'mag 32', 'r32',
      '280hz', 'qd oled', 'alienware aw', 'legion r32',
    ],
  },
  {
    category: 'PC Gaming',
    keywords: [
      'rtx', 'ryzen', 'core i9', 'core i7', 'core i5', 'trident z5',
      'rm850x', 'gaming pc', 'workstation', 'pc gaming', 'graphics card',
      'gpu', 'ddr5', 'ddr4', 'pc streaming', 'pc esports', 'pc mini itx',
      'pc vr ready', 'pc budget', 'pc silent', 'pc work',
    ],
  },
  {
    category: 'Laptop',
    keywords: [
      'macbook', 'thinkpad', 'ideapad', 'vivobook', 'zenbook', 'aspire',
      'swift go', 'predator', 'omen 16', 'spectre', 'xps', 'surface laptop',
      'matebook', 'gram 17', 'tuf gaming', 'rog strix', 'rog zephyrus',
      'raider', 'stealth', 'blade 16', 'aorus', 'loq', 'book4',
      'inspiron', 'alienware x16', 'laptop', 'notebook', 'chromebook',
      'titan 18', 'galaxy book4', 'galaxy book',
    ],
  },
  {
    category: 'Phụ kiện',
    keywords: [
      'ssd', 'hdd', 'hard drive', 'cable', 'adapter', 'charger', 'bag',
      'case', 'stand', 'hub', 'dock', 'power bank', 'memory', 'ram',
      'crucial', 'seagate', '2tb', '1tb', '500gb',
    ],
  },
];

const CATEGORY_MODEL_CODES: Array<{ category: string; codes: string[] }> = [
  {
    category: 'Màn hình',
    codes: [
      'aw3225', 'r32fc', '27e2n', '321upx', 'm32uc', 'm32u', 'm32q',
      'pa32ucg', 'xl2546', 'xl2566', '27qs', 'odyssey g8', 'odyssey g9',
      'ag274qzm', 'ultragear', 'viewfinity', 'agon', 'zowie',
    ],
  },
  {
    category: 'Laptop',
    codes: [
      'macbook', 'thinkpad', 'vivobook', 'zenbook', 'matebook', 'ideapad',
      'surface laptop', 'g614jir', 'gu605mi', 'fa507ui', '14vig', 'a1vig',
      'rz09', 'swift go', 'predator', 'spectre', 'inspiron', 'tuf gaming',
      'rog strix', 'rog zephyrus', 'raider', 'stealth', 'blade 16',
      'alienware x16', 'titan 18', 'gram 17', 'galaxy book',
    ],
  },
  {
    category: 'PC Gaming',
    codes: [
      'rtx', 'ryzen', '14900k', '12900k', '7800x3d', '7950x', '7700x',
      'rm850x', 'trident z5', 'ddr5', 'ddr4', 'gaming pc', 'workstation',
    ],
  },
  {
    category: 'Chuột',
    codes: [
      'xm2we', 'g502', 'katar', 'basilisk', 'deathadder', 'harpe',
      'superlight',
    ],
  },
  {
    category: 'Bàn phím',
    codes: [
      'g915', 'k100', 'q1 pro', 'k70', 'varmilo', 'realforce', 'tkl',
      'mx keys', 'blackwidow', 'huntsman', 'apex pro', 'vulcan',
    ],
  },
  {
    category: 'Tai nghe',
    codes: [
      'wh-1000xm5', 'arctis', 'cloud iii', 'hs80', 'quantum', 'rog delta',
      'hd 450bt', 'airpods', 'buds',
    ],
  },
  {
    category: 'Điện thoại',
    codes: [
      'iphone', 'galaxy s', 'galaxy a', 'galaxy z', 'galaxy m', 'pixel',
      'oneplus', 'oppo', 'vivo', 'xiaomi', 'redmi', 'poco', 'nokia',
      'realme', 'honor', 'tecno', 'zenfone', 'ipad', 'rog phone',
    ],
  },
];

const BRAND_RULES: Array<[string, string]> = [
  ['alienware', 'Dell'],
  ['surface', 'Microsoft'],
  ['steelseries', 'SteelSeries'],
  ['endgame gear', 'Endgame Gear'],
  ['g.skill', 'G.Skill'],
  ['trident z5', 'G.Skill'],
  ['western digital', 'Western Digital'],
  ['samsung', 'Samsung'],
  ['galaxy', 'Samsung'],
  ['apple', 'Apple'],
  ['iphone', 'Apple'],
  ['ipad', 'Apple'],
  ['macbook', 'Apple'],
  ['airpods', 'Apple'],
  ['asus', 'ASUS'],
  ['rog ', 'ASUS'],
  ['zenbook', 'ASUS'],
  ['vivobook', 'ASUS'],
  ['tuf gaming', 'ASUS'],
  ['dell', 'Dell'],
  ['xps', 'Dell'],
  ['lenovo', 'Lenovo'],
  ['thinkpad', 'Lenovo'],
  ['ideapad', 'Lenovo'],
  ['legion', 'Lenovo'],
  ['loq', 'Lenovo'],
  ['msi', 'MSI'],
  ['razer', 'Razer'],
  ['logitech', 'Logitech'],
  ['sony', 'Sony'],
  ['xiaomi', 'Xiaomi'],
  ['redmi', 'Xiaomi'],
  ['poco', 'Xiaomi'],
  ['acer', 'Acer'],
  ['predator', 'Acer'],
  ['swift go', 'Acer'],
  ['hp ', 'HP'],
  ['omen', 'HP'],
  ['spectre', 'HP'],
  ['gigabyte', 'Gigabyte'],
  ['aorus', 'Gigabyte'],
  ['microsoft', 'Microsoft'],
  ['huawei', 'Huawei'],
  ['matebook', 'Huawei'],
  ['lg ', 'LG'],
  ['gram', 'LG'],
  ['ultragear', 'LG'],
  ['benq', 'BenQ'],
  ['zowie', 'BenQ'],
  ['viewsonic', 'ViewSonic'],
  ['aoc', 'AOC'],
  ['agon', 'AOC'],
  ['philips', 'Philips'],
  ['jbl', 'JBL'],
  ['hyperx', 'HyperX'],
  ['corsair', 'Corsair'],
  ['roccat', 'ROCCAT'],
  ['keychron', 'Keychron'],
  ['nokia', 'Nokia'],
  ['google', 'Google'],
  ['pixel', 'Google'],
  ['realme', 'Realme'],
  ['oneplus', 'OnePlus'],
  ['vivo', 'Vivo'],
  ['honor', 'Honor'],
  ['tecno', 'Tecno'],
  ['oppo', 'OPPO'],
  ['nvidia', 'NVIDIA'],
  ['amd', 'AMD'],
  ['ryzen', 'AMD'],
  ['intel', 'Intel'],
  ['core i', 'Intel'],
  ['custom', 'Custom'],
];

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function hasWord(normalized: string, keyword: string): boolean {
  const k = norm(keyword);
  if (!k) return false;
  return new RegExp(`(^| )${k}( |$)`).test(normalized);
}

export function inferCategory(name: string): string | null {
  const n = norm(name);
  if (!n) return null;

  let best: { category: string; score: number } | null = null;

  for (const rule of CATEGORY_MODEL_CODES) {
    for (const code of rule.codes) {
      if (n.includes(code)) {
        const score = 100 + code.length;
        if (!best || score > best.score) {
          best = { category: rule.category, score };
        }
      }
    }
  }

  for (const rule of CATEGORY_RULES) {
    let score = 0;
    for (const kw of rule.keywords) {
      if (hasWord(n, kw)) score += kw.trim().length;
    }
    if (score > 0 && (!best || score > best.score)) {
      best = { category: rule.category, score };
    }
  }

  return best?.category ?? null;
}

export function inferBrand(name: string): string | null {
  const n = norm(name);
  if (!n) return null;

  let best: { brand: string; len: number } | null = null;
  for (const [kw, brand] of BRAND_RULES) {
    if (!hasWord(n, kw)) continue;
    const len = norm(kw).length;
    if (!best || len > best.len) best = { brand, len };
  }

  return best?.brand ?? null;
}
