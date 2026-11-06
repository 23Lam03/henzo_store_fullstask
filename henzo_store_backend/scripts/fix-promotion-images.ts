import { connectDB, disconnectDB } from '../src/server/db';
import { PromotionModel } from '../src/server/models/Promotion';
import { PromotionType } from '../src/server/constants';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

type Pools = Record<string, string[]>;

const TYPE_TO_CATEGORY: Record<string, string> = {
  [PromotionType.FLASH_SALE]: 'Laptop',
  [PromotionType.DISCOUNT_CAMPAIGN]: 'Điện thoại',
  [PromotionType.VOUCHER]: 'Phụ kiện',
  [PromotionType.COMBO]: 'PC Gaming',
};

const POOL_ALIAS: Record<string, string> = {
  'Điện thoại': 'Điện thoại',
  Tablet: 'Tablet',
  Laptop: 'Laptop',
  'Màn hình': 'Màn hình',
  'PC Gaming': 'PC Gaming',
  Chuột: 'Chuột',
  'Bàn phím': 'Bàn phím',
  'Tai nghe': 'Tai nghe',
  'Phụ kiện': 'Phụ kiện',
};

function hashCode(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = (h * 31 + text.charCodeAt(i)) >>> 0;
  }
  return h;
}

function fileLabel(url: string): string {
  const last = url.split('/').pop() ?? '';
  return last
    .replace(/\.\w{3,4}$/i, '')
    .replace(/^\d+px-/, '')
    .replace(/_/g, ' ')
    .toLowerCase();
}

const JUNK_PATTERN =
  /image with|nested realities|unclear|unknown|untitled|illustration|drawing|logo|banner|icon\b|map\b|chart\b|graph\b|collage|montage|photo of nothing/i;

const KEYWORD_HINTS: Record<string, RegExp> = {
  laptop: /laptop|notebook|macbook|thinkpad|pavilion|ideapad|zenbook|chromebook/i,
  iphone: /iphone|apple phone|mobile phone|smartphone/i,
  samsung: /samsung|galaxy/i,
  tablet: /tablet|ipad/i,
  monitor: /monitor|screen|display/i,
  gaming: /gaming|keyboard|mouse|razer|logitech|corsair/i,
  accessory: /cable|charger|adapter|headphone|earphone|speaker|power bank|hub|dock/i,
  headphone: /headphone|earphone|headset|airpod/i,
  keyboard: /keyboard|keychron/i,
  mouse: /mouse|logitech/i,
  summer: /summer|beach|sun|holiday/i,
  blackfriday: /black friday|discount|shopping|sale/i,
  apple: /apple|iphone|ipad|macbook/i,
  school: /school|backpack|notebook/i,
  ship: /delivery|shipping|box|truck/i,
  combo: /bundle|combo|set of/i,
};

const TITLE_TO_POOL: [string, string][] = [
  ['iphone', 'Điện thoại'],
  ['ipad', 'Tablet'],
  ['tablet', 'Tablet'],
  ['laptop', 'Laptop'],
  ['macbook', 'Laptop'],
  ['notebook', 'Laptop'],
  ['gaming', 'PC Gaming'],
  ['monitor', 'Màn hình'],
  ['màn hình', 'Màn hình'],
  ['chuột', 'Chuột'],
  ['mouse', 'Chuột'],
  ['bàn phím', 'Bàn phím'],
  ['keyboard', 'Bàn phím'],
  ['tai nghe', 'Tai nghe'],
  ['headphone', 'Tai nghe'],
  ['airpod', 'Tai nghe'],
  ['samsung', 'Điện thoại'],
  ['galaxy', 'Điện thoại'],
  ['apple', 'Điện thoại'],
];

function pickImage(
  pool: string[],
  title: string,
  usedUrls: Set<string>,
): string {
  const clean = pool.filter((u) => !JUNK_PATTERN.test(fileLabel(u)));
  const candidates = clean.length ? clean : pool;

  const lower = title.toLowerCase();
  for (const [keyword, pattern] of Object.entries(KEYWORD_HINTS)) {
    if (!lower.includes(keyword)) continue;
    const match = candidates.find(
      (u) => pattern.test(fileLabel(u)) && !usedUrls.has(u),
    );
    if (match) return match;
  }

  const start = hashCode(title) % candidates.length;
  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[(start + i) % candidates.length];
    if (!usedUrls.has(candidate)) return candidate;
  }
  return candidates[start];
}

async function main() {
  await connectDB();
  console.log('[promo-img] Kết nối MongoDB...');

  const poolsPath = path.resolve(
    process.cwd(),
    'scripts/data/type-image-pools.json',
  );
  const pools: Pools = JSON.parse(await readFile(poolsPath, 'utf8'));

  const normPools: Record<string, string[]> = {};
  for (const [k, v] of Object.entries(pools)) {
    const key = POOL_ALIAS[k.trim()] ?? k.trim();
    if (Array.isArray(v) && v.length) normPools[key] = v;
  }
  console.log(
    '[promo-img] Pool sẵn có:',
    Object.entries(normPools)
      .map(([k, v]) => `${k}=${v.length}`)
      .join(', '),
  );

  const promos = await PromotionModel.find({}).lean();
  let updated = 0;
  let skipped = 0;
  const used = new Map<string, number>();
  const usedUrlsByPool = new Map<string, Set<string>>();

  for (const promo of promos) {
    const type = String(promo.type ?? PromotionType.DISCOUNT_CAMPAIGN);
    const title = String(promo.title ?? '');

    let category: string | undefined;
    const lower = title.toLowerCase();
    for (const [keyword, poolName] of TITLE_TO_POOL) {
      if (lower.includes(keyword)) {
        category = poolName;
        break;
      }
    }
    category ??= TYPE_TO_CATEGORY[type] ?? 'Phụ kiện';

    const pool = normPools[category];
    if (!pool || !pool.length) {
      skipped++;
      continue;
    }

    const usedUrls = usedUrlsByPool.get(category) ?? new Set<string>();
    const chosen = pickImage(pool, title, usedUrls);
    usedUrls.add(chosen);

    used.set(type, (used.get(type) ?? 0) + 1);
    usedUrlsByPool.set(category, usedUrls);
    await PromotionModel.updateOne({ _id: promo._id }, { $set: { image: chosen } });
    updated++;
  }

  console.log(`[promo-img] Đã gán ảnh: ${updated} chương trình`);
  if (skipped) console.log(`[promo-img] Bỏ qua (không có pool): ${skipped}`);

  const after = await PromotionModel.find({}).lean();
  const empty = after.filter((p) => !p.image || !String(p.image).trim());
  const notWikimedia = after.filter(
    (p) => p.image && !String(p.image).includes('wikimedia.org'),
  );
  const unique = new Set(after.map((p) => p.image));
  console.log(`[promo-img] Còn thiếu ảnh: ${empty.length}`);
  console.log(`[promo-img] Không phải Wikimedia: ${notWikimedia.length}`);
  console.log(
    `[promo-img] Ảnh duy nhất: ${unique.size}/${after.length} — phân bổ theo loại:`,
    JSON.stringify(Object.fromEntries(used)),
  );

  await disconnectDB();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
