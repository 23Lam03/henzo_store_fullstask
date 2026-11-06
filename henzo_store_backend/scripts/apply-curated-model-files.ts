/**
 * ÁP ẢNH THẬT TỐT NHẤT CHO CÁC MODEL CÒN THIẾU / SAI ẢNH.
 *
 * Nguyên tắc (theo thứ tự ưu tiên):
 *   1. Ảnh EXACT — tên file chứa đúng mã/series của model (curated đã verify).
 *   2. Ảnh CÙNG HÃNG + CÙNG LOẠI (product-cat-files + brand-type-pools).
 *      Ưu tiên file có tên chứa tên hãng.
 *   3. Ảnh CHUNG LOẠI (image-pools) — CHỈ dùng khi model là hàng "Custom"
 *      (PC tự build) hoặc không có ảnh cùng hãng.
 *
 * Ràng buộc:
 *   - Ảnh CHÍNH phải là ảnh của đúng hãng (hoặc Custom). Không bao giờ để
 *     ảnh hãng khác làm ảnh chính.
 *   - 0 trùng ảnh chính trên toàn bộ catalog.
 *   - Loại ảnh sự kiện/booth/teardown/người/logo.
 *
 * Chạy: npx tsx scripts/apply-curated-model-files.ts --apply
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { resolveFiles } from './lib/commons-files';
import { modelName } from './lib/model-name';

/** Pool ảnh theo loại sản phẩm. */
const POOL_BY_TYPE: Record<string, string> = {
  'Điện thoại': 'PHONE',
  Tablet: 'TABLET',
  Laptop: 'LAPTOP',
  'Màn hình': 'MONITOR',
  'PC Gaming': 'PC_CASE',
  'Chuột': 'MOUSE',
  'Bàn phím': 'KEYBOARD',
  'Tai nghe': 'HEADSET',
  'Phụ kiện': 'ACCESSORY',
  'Ổ cứng': 'STORAGE',
  RAM: 'RAM',
  CPU: 'CPU',
  'Tản nhiệt': 'COOLER',
  'Nguồn': 'PSU',
  VGA: 'GPU',
  Micro: 'MIC',
  Webcam: 'WEBCAM',
};

/** Token dừng (không mang thông tin model). */
const STOP = new Set([
  'pro', 'plus', 'max', 'ultra', 'mini', 'air', 'se', 'gen', 'series', 'in',
  'inch', 'gb', 'tb', 'gaming', 'wireless', 'rgb', 'black', 'white', 'silver',
  'grey', 'gray', 'titanium', 'magnetic', 'tkl', 'full', 'size', 'with', 'and',
  'the', 'for', 'edition', 'combo', 'package', 'kit', 'arena', 'creator',
  'powerking', 'phantom', 'midnight', 'whisper', 'metaverse', 'starter',
  'tournament', 'gamingx', 'obs', 'studio', 'setup', 'streaming', 'silent',
  'budget', 'build', 'ready', 'workspace', 'esports', 'new', 'optical', 'mx',
  'keys', 'hdd', 'ssd', 'nvme', 'ram', 'dimm', 'pc', 'v2', 'v3', 'carbon',
  'sumi', 'usb', 'qp', 'm2', 'sata', 'power', 'supply', 'tong', 'hop',
  'gaming', 'esports', 'monitor', 'monitor', 'deep', 'anc',
]);

/** Tên file KHÔNG được dùng (ảnh sai hãng / sự kiện / linh kiện rời). */
const BANNED = new RegExp(
  [
    'rolls-royce', 'rolls royce', 'silver cloud', 'cloud alpha', 'cloud iii',
    'cloud ii', '\\bom ?ii\\b', 'good omens', 'bad omens', 'xbox ?360',
    'renegade fury', 'gp950 batteries', '\\bm34[ds-]', '\\bm340\\b',
    '\\bhp3par\\b', 'hp42s', 'hp123', 'hpqg', 'hpm-70', 'hp7970',
    'garage', '\\bhope\\b', 'cs50', 'sword art', 'drone', 'rifle', 'sniper',
    'cannon', 'artillery', 'rebel ?alliance', 'phoenix', 'dragon', 'wizard',
    'knight', '\\bsword\\b', 'armour', 'armor', 'booth', 'gamescom',
    'computex', 'taigi', 'it ?month', 'tokyo ?game', 'showroom',
    'headquarters', 'signage', 'crowd', 'person', 'people', 'man ', 'woman ',
    'logo', '\\bicons?\\b', 'diagram', 'schematic', 'circuit', 'teardown',
    'disassembl', 'opened', 'internals', 'packaging', 'box contents',
    'manual', 'warranty', 'sticker', 'barcode', 'price tag', 'spec tag',
    'unboxing', 'review', 'poster', 'advert', 'wall ?mount', 'stand base',
    '\\bcable\\b', '\\badapter\\b', '\\bport\\b', '\\bbutton\\b', 'rear view',
    'front view', '\\bback\\.jpg', '\\bfront\\.jpg', 'bottom view', 'underside',
    'epstein', 'meme', 'conspiracy',
  ].join('|'),
  'i',
);

/**
 * Tên gọi khác của hãng — dùng để kiểm tra "ảnh có đúng hãng không".
 * Ví dụ hãng "Apple" nhưng file tên "iPhone_16_Pro_Max" -> vẫn đúng hãng.
 */
const BRAND_ALIAS: Record<string, string[]> = {
  Apple: ['apple', 'iphone', 'ipod', 'ipad', 'macbook', 'macintosh', 'airpods', 'imac', 'magic'],
  Samsung: ['samsung', 'galaxy'],
  Google: ['google', 'pixel'],
  Xiaomi: ['xiaomi', 'redmi', 'poco', 'mi ', 'mi-'],
  Asus: ['asus', 'rog', 'tuf', 'zenbook', 'vivobook', 'proart'],
  ASUS: ['asus', 'rog', 'tuf', 'zenbook', 'vivobook', 'proart'],
  Microsoft: ['microsoft', 'surface', 'xbox'],
  Lenovo: ['lenovo', 'thinkpad', 'ideapad', 'legion', 'thinkvision'],
  HP: ['hp ', 'hewlett', 'pavilion', 'omen', 'victus', 'spectre', 'elitebook', 'probook', 'envy', 'compaq'],
  Dell: ['dell', 'inspiron', 'xps', 'latitude', 'alienware', 'vostro', 'precision'],
  Acer: ['acer', 'predator', 'nitro', 'aspire', 'swifts', 'acerview'],
  MSI: ['msi', 'mag ', 'mpg ', 'raider', 'katana', 'stealth', 'titan'],
  Gigabyte: ['gigabyte', 'aorus', 'aero'],
  Razer: ['razer'],
  Corsair: ['corsair'],
  HyperX: ['hyperx'],
  Logitech: ['logitech', 'g pro', 'g502', 'g203', 'g403', 'g933', 'g435'],
  SteelSeries: ['steelseries', 'arctis'],
  Zowie: ['zowie', 'benq'],
  BenQ: ['benq', 'zowie'],
  ViewSonic: ['viewsonic'],
  Philips: ['philips'],
  AOC: ['aoc'],
  Kingston: ['kingston', 'fury'],
  Seagate: ['seagate', 'firecuda', 'baracuda', 'barracuda'],
  Crucial: ['crucial'],
  Anker: ['anker'],
  Belkin: ['belkin'],
  Elgato: ['elgato'],
  JBL: ['jbl'],
  Sony: ['sony', 'wh-1000', 'wf-1000'],
  Bose: ['bose'],
  Sennheiser: ['sennheiser'],
  Blue: ['blue yeti', 'blue microphone', 'snowball'],
  Noctua: ['noctua'],
  Arctic: ['arctic'],
  AMD: ['amd', 'ryzen', 'threadripper', 'epyc'],
  Intel: ['intel', 'core i'],
  'Endgame Gear': ['endgame gear', 'endgame'],
  'Cooler Master': ['cooler master', 'hyperfrost'],
  'Lian Li': ['lian li'],
  'Western Digital': ['western digital', 'wd blue', 'wd black', 'wd red', 'wd green'],
  'WD': ['western digital', 'wd blue', 'wd black', 'wd red'],
  'SanDisk': ['sandisk'],
  'Adata': ['adata'],
  Lexar: ['lexar'],
  Tecno: ['tecno'],
  Nokia: ['nokia'],
  'Huawei': ['huawei', 'matebook', 'mate '],
  Honor: ['honor'],
  Oppo: ['oppo'],
  Vivo: ['vivo'],
  OnePlus: ['oneplus'],
  Realme: ['realme'],
  Poco: ['poco'],
  Motorola: ['motorola'],
  Steam: ['steam'],
};

/**
 * Hãng "Custom" — ảnh PC tự build, không yêu cầu tên hãng trong file.
 */
const CUSTOM_BRANDS = new Set(['custom', 'pc gaming', 'custom build']);

/**
 * File -> hãng, suy ra từ CATEGORY Commons (đáng tin cậy) hoặc tên file.
 * Đây là nguồn sự thật để kiểm tra "ảnh đúng hãng" — tên file có thể không
 * chứa tên hãng (vd "ST100VoidPro.jpg" là tai nghe Corsair).
 */
const FILE_BRAND = new Map<string, string>();

function norm(s: string): string {
  return s
    .replace(/^File:/, '')
    .replace(/\.(jpe?g|png|webp|tiff)$/i, '')
    .replace(/[_\-.,()'"/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function fileOf(url: string): string {
  return decodeURIComponent(url.split('?')[0]?.split('/').pop() ?? '').replace(
    /^\d+px-/,
    '',
  );
}

/** Tên file có chứa token đặc trưng của model không? */
function isExactFile(model: string, brand: string, file: string): boolean {
  const t = norm(file);
  const brandToks = brand.toLowerCase().split(/[\s&]+/).filter((b) => b.length >= 3);
  for (const w of model.replace(/[()]/g, ' ').split(/[^A-Za-z0-9]+/).filter(Boolean)) {
    const lw = w.toLowerCase();
    if (STOP.has(lw) || w.length < 3) continue;
    if (brandToks.includes(lw)) continue;
    if (t.includes(lw)) return true;
  }
  return false;
}

/** File có thuộc đúng hãng không? */
function matchesBrand(brand: string, file: string): boolean {
  if (!brand) return true;
  const b = brand.toLowerCase();
  if (CUSTOM_BRANDS.has(b)) return true;

  // 1. Hãng suy ra từ Category Commons (đáng tin cậy nhất).
  const catBrand = FILE_BRAND.get(file);
  if (catBrand) {
    const cb = catBrand.toLowerCase();
    if (cb === b) return true;
    // Cùng nhóm hãng (vd "Asus" vs "ASUS").
    if (norm(cb) === norm(b)) return true;
    // Category thuộc hãng con của hãng cần tìm (vd "Gigabyte Aorus" -> Gigabyte).
    if (norm(cb).includes(norm(b)) || norm(b).includes(norm(cb))) return true;
  }

  // 2. Tên file chứa tên hãng (hoặc alias).
  const t = norm(file);
  const aliases = BRAND_ALIAS[brand] ?? [b];
  return aliases.some((a) => t.includes(a));
}

async function main() {
  const apply = process.argv.includes('--apply');
  const read = (f: string) =>
    JSON.parse(readFileSync(resolve(process.cwd(), f), 'utf-8')) as any;

  const curated = read('scripts/data/curated-model-files.json') as Record<string, string[]>;
  const basePools = read('scripts/data/image-pools.json') as Record<string, string[]>;
  const brandPools = read('scripts/data/brand-type-pools.json') as Record<
    string,
    Record<string, string[]>
  >;
  const catPools = read('scripts/data/product-cat-files.json') as Record<
    string,
    Record<string, string[]>
  >;
  let expanded: Record<string, string[]> = {};
  try {
    expanded = read('scripts/data/expanded-pools.json');
  } catch {
    /* chưa có */
  }

  const pools: Record<string, string[]> = {};
  for (const [k, v] of Object.entries(basePools)) {
    pools[k] = [...new Set([...(expanded[k] ?? []), ...v])];
  }

  const allFiles = [
    ...new Set([
      ...Object.values(curated).flat(),
      ...Object.values(pools).flat(),
      ...Object.values(brandPools).flatMap((b) => Object.values(b).flat()),
      ...Object.values(catPools).flatMap((b) => Object.values(b).flat()),
    ]),
  ];
  console.log(`[curated] Verify ${allFiles.length} file Commons…`);
  const urlMap = await resolveFiles(allFiles);
  console.log(`[curated] Tồn tại: ${urlMap.size}/${allFiles.length}`);

  const dbPath = resolve(process.cwd(), 'scripts/data/model-images.json');
  const db = read('scripts/data/model-images.json') as Record<
    string,
    { images: string[]; source: string; title: string }
  >;

  // File đang dùng trong pool cũ cũng phải được verify — nếu không, ảnh
  // đã bị Commons xoá vẫn nằm trong pool và gán xuống sản phẩm -> 404.
  const dbFiles = new Set<string>();
  for (const v of Object.values(db)) {
    for (const u of v?.images ?? []) dbFiles.add(fileOf(u));
  }
  const missingFromVerify = [...dbFiles].filter((f) => !allFiles.includes(f));
  if (missingFromVerify.length) {
    console.log(
      `[curated] Verify thêm ${missingFromVerify.length} file đang dùng trong pool…`,
    );
    const extra = await resolveFiles(missingFromVerify);
    for (const [f, u] of extra) urlMap.set(f, u);
    console.log(`[curated] Tồn tại thêm: ${extra.size}/${missingFromVerify.length}`);
  }

  const mock = read('scripts/data/frontend-mock.json');
  const meta = new Map<string, { brand: string; categoryName: string }>();
  for (const p of [
    ...(mock.products as any[]),
    ...((mock.sellerProducts ?? []) as any[]),
  ]) {
    const m = modelName(p.name);
    if (!meta.has(m)) meta.set(m, { brand: p.brand, categoryName: p.categoryName ?? '' });
  }

  /* ── 0. Bảng file -> hãng (từ Category Commons) ── */
  for (const brands of Object.values(catPools)) {
    for (const [brand, files] of Object.entries(brands)) {
      for (const f of files) {
        if (!FILE_BRAND.has(f)) FILE_BRAND.set(f, brand);
      }
    }
  }
  // Category model-specific (vd "Samsung 870 QVO") cũng là nguồn hãng.
  for (const [type, brands] of Object.entries(catPools)) {
    for (const [brand, files] of Object.entries(brands)) {
      for (const f of files) {
        if (!FILE_BRAND.has(f)) FILE_BRAND.set(f, brand);
      }
    }
  }
  console.log(`[curated] Bảng file->hãng: ${FILE_BRAND.size} file.`);

  interface ModelImgs {
    exact: string[];
    filler: string[];
    brand: string;
    cat: string;
  }
  const built = new Map<string, ModelImgs>();

  for (const [model, v] of Object.entries(db)) {
    const info = meta.get(model) ?? { brand: '', categoryName: '' };
    const exact: string[] = [];
    const filler: string[] = [];
    for (const u of v?.images ?? []) {
      const f = fileOf(u);
      // Chỉ giữ file CÒN TỒN TẠI trên Commons — file đã bị xoá sẽ
      // trả 404 và làm ảnh vỡ trên giao diện.
      if (!urlMap.has(f)) continue;
      if (isExactFile(model, info.brand, f)) exact.push(u);
      else filler.push(u);
    }
    built.set(model, { exact, filler, brand: info.brand, cat: info.categoryName });
  }

  /* ── 1. Gán ảnh curated (đã verify) — ưu tiên tuyệt đối ── */
  let applied = 0;
  for (const [model, files] of Object.entries(curated)) {
    const urls: string[] = [];
    for (const f of files) {
      if (BANNED.test(f)) continue;
      const u = urlMap.get(f);
      if (u && !urls.includes(u)) urls.push(u);
    }
    if (!urls.length) continue;
    const info = meta.get(model) ?? { brand: '', categoryName: '' };
    const prev = built.get(model) ?? {
      exact: [],
      filler: [],
      brand: info.brand,
      cat: info.categoryName,
    };
    built.set(model, {
      exact: [...new Set([...urls, ...prev.exact])],
      filler: prev.filler.filter((u) => !urls.includes(u)),
      brand: info.brand,
      cat: info.categoryName,
    });
    applied++;
  }
  console.log(`[curated] Đã gán ${applied}/${Object.keys(curated).length} model.`);

  /* ── 2. Bổ sung ảnh cùng hãng + cùng loại ──
   *
   * Nguồn (theo thứ tự chất lượng):
   *   a. product-cat-files  — file nằm trong Category sản phẩm của Commons.
   *   b. brand-type-pools   — file tên có hãng + đúng loại.
   */
  const byTypeBrand = new Map<string, string[]>();
  for (const [type, brands] of Object.entries(catPools)) {
    for (const [brand, files] of Object.entries(brands)) {
      const key = `${type}::${brand.toLowerCase()}`;
      byTypeBrand.set(key, [
        ...new Set([...(byTypeBrand.get(key) ?? []), ...files]),
      ]);
    }
  }
  for (const [type, brands] of Object.entries(brandPools)) {
    for (const [brand, files] of Object.entries(brands)) {
      const key = `${type}::${brand.toLowerCase()}`;
      byTypeBrand.set(key, [
        ...new Set([...(byTypeBrand.get(key) ?? []), ...files]),
      ]);
    }
  }

  for (const [model, m] of built) {
    const type = POOL_BY_TYPE[m.cat];
    if (!type) continue;
    const have = new Set([...m.exact, ...m.filler].map(fileOf));

    // Ứng viên cùng hãng.
    const sameBrandFiles = byTypeBrand.get(`${type}::${m.brand.toLowerCase()}`) ?? [];
    const sameBrand: string[] = [];
    for (const f of sameBrandFiles) {
      if (have.has(f)) continue;
      if (BANNED.test(f)) continue;
      const u = urlMap.get(f);
      if (!u) continue;
      have.add(f);
      sameBrand.push(u);
    }
    m.filler = [...m.filler, ...sameBrand];

    // Loại ảnh SAI HÃNG khỏi toàn bộ bộ ảnh (giữ ảnh đúng hãng + ảnh custom).
    // Nếu lọc hết -> giữ lại bộ cũ để không mất ảnh (sẽ báo cáo sai hãng).
    if (!CUSTOM_BRANDS.has(m.brand.toLowerCase())) {
      const isRight = (u: string) => matchesBrand(m.brand, fileOf(u));
      const keptExact = m.exact.filter(isRight);
      const keptFiller = m.filler.filter(isRight);
      if (keptExact.length || keptFiller.length) {
        m.exact = keptExact;
        m.filler = keptFiller;
      }
    }
  }

  /* ── 3. Phân bổ ảnh chính: unique + đúng hãng ──
   *
   * - Ảnh chính PHẢI khớp model (exact) hoặc đúng hãng.
   * - Không dùng lại ảnh chính đã cấp cho model khác (trừ khi hết lựa chọn).
   */
  const used = new Set<string>();
  const models = [...built.entries()].filter(([, m]) => m.exact.length || m.filler.length);

  const order = [...models].sort((a, b) => {
    const ea = a[1].exact.length;
    const eb = b[1].exact.length;
    if (ea !== eb) return eb - ea;
    return a[0].localeCompare(b[0]);
  });

  for (const [model, m] of order) {
    const candidates = [...new Set([...m.exact, ...m.filler])];

    // Ưu tiên: (1) exact chưa dùng, (2) đúng hãng chưa dùng, (3) bất kỳ chưa dùng.
    let primary =
      candidates.find((u) => !used.has(u) && m.exact.includes(u)) ??
      candidates.find(
        (u) => !used.has(u) && matchesBrand(m.brand, fileOf(u)),
      ) ??
      candidates.find((u) => !used.has(u));

    if (!primary) {
      // Hết ảnh chưa dùng -> lấy ảnh exact đầu tiên (ghi nhận trùng).
      primary = m.exact[0] ?? m.filler[0];
    }
    if (!primary) continue;
    used.add(primary);
    m.exact = [primary, ...m.exact.filter((u) => u !== primary)];
    m.filler = [...new Set([...m.filler.filter((u) => u !== primary), ...m.exact])];
  }

  /* ── 4. Ghi lại db ── */
  for (const [model, m] of built) {
    // Chuẩn hoá URL về thumbnail (width 1280px) — file gốc nặng 5–20MB và
    // Wikimedia chặn hotlink file gốc từ một số trình duyệt.
    const images = [...new Set([...m.exact, ...m.filler])]
      .map((u) => urlMap.get(fileOf(u)) ?? u)
      .filter((u) => !BANNED.test(fileOf(u)));
    if (!images.length) continue;
    db[model] = {
      images,
      source: 'commons-curated',
      title: fileOf(images[0]),
    };
  }
  if (apply) writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf-8');

  /* ── 5. Báo cáo ── */
  const main2 = new Map<string, string[]>();
  for (const [model, v] of Object.entries(db)) {
    if (!v?.images?.length) continue;
    const l = main2.get(v.images[0]) ?? [];
    l.push(model);
    main2.set(v.images[0], l);
  }
  const dup = [...main2.entries()].filter(([, l]) => l.length > 1);
  console.log(`\n[curated] Ảnh chính trùng nhau: ${dup.length} nhóm`);
  for (const [u, ms] of dup.slice(0, 20)) {
    console.log(`   - ${fileOf(u)} <- ${ms.join(' | ')}`);
  }
  const noImg = Object.entries(db).filter(([, v]) => !v?.images?.length).map(([m]) => m);
  console.log(`[curated] Model không có ảnh: ${noImg.length}`);
  if (noImg.length) console.log(noImg.join('\n'));

  // Sai hãng (chỉ báo cáo, không chặn).
  let wrongBrand = 0;
  for (const [model, v] of Object.entries(db)) {
    const info = meta.get(model);
    if (!info?.brand || !v?.images?.length) continue;
    if (!matchesBrand(info.brand, fileOf(v.images[0]))) {
      wrongBrand++;
      if (wrongBrand <= 25) {
        console.log(
          `   ! ${model} [${info.brand}] -> ${fileOf(v.images[0]).slice(0, 60)}`,
        );
      }
    }
  }
  console.log(`[curated] Ảnh chính SAI HÃNG: ${wrongBrand}`);
}

void main();
