/**
 * MỞ RỘNG POOL ẢNH THEO (LOẠI, HÃNG) TỪ WIKIMEDIA COMMONS.
 *
 * `type-brand-pools.json` chỉ có 16 loại × vài hãng, nên nhiều model không
 * có ảnh fallback. Script này probe Commons theo từ khóa "<brand> <type>"
 * (vd "Corsair headset", "Logitech webcam", "Apple iPad") và ghi kết quả
 * vào `scripts/data/type-brand-pools.json`.
 *
 * Ảnh được chấm điểm: ưu tiên tên file CHỨA cả brand + từ khóa loại,
 * loại ảnh cảnh chụp/đời thường (mua bán, cửa hàng, biểu đồ...).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { getJson, resolveFiles } from '../../lib/commons-files';

const POOL_PATH = resolve(process.cwd(), 'scripts/data/type-brand-pools.json');

/** Từ khóa tìm ảnh cho từng loại. */
const TYPE_QUERY: Record<string, string> = {
  PHONE: 'smartphone',
  TABLET: 'tablet',
  LAPTOP: 'laptop',
  MONITOR: 'monitor',
  MOUSE: 'computer mouse',
  KEYBOARD: 'mechanical keyboard',
  HEADSET: 'headset',
  WEBCAM: 'webcam',
  MIC: 'microphone',
  STORAGE: 'SSD',
  RAM: 'DDR5 memory module',
  GPU: 'graphics card',
  CPU: 'CPU processor',
  PSU: 'power supply unit',
  COOLER: 'CPU cooler',
  ACCESSORY: 'computer accessory',
  SMARTWATCH: 'smartwatch',
  TABLET_PRO: 'tablet computer',
};

/** Cụm từ loại ảnh không dùng làm ảnh sản phẩm. */
const BAD = /\b(shop|store|mall|market|sign|street|banner|poster|logo|chart|graph|diagram|map|comparison|compare|vs |versus|people|person|hand|hands|woman|man |boy|girl|protest|meeting|conference|exhibition|booth|trade show|package|box|unboxing|review|manual|instruction|advertis)/i;

const BRANDS: Record<string, string[]> = {
  PHONE: ['Apple', 'Samsung', 'Xiaomi', 'Oppo', 'Vivo', 'Huawei', 'Realme', 'OnePlus', 'Nokia', 'Honor', 'Google', 'Motorola'],
  TABLET: ['Apple iPad', 'Samsung Galaxy Tab', 'Microsoft Surface', 'Lenovo Tab'],
  LAPTOP: ['Apple MacBook', 'Asus', 'Dell', 'HP', 'Lenovo', 'Acer', 'MSI', 'Razer', 'Gigabyte', 'Samsung', 'LG', 'Microsoft Surface'],
  MONITOR: ['Samsung monitor', 'Dell monitor', 'LG monitor', 'ViewSonic monitor', 'Acer monitor', 'Gigabyte monitor', 'Asus monitor', 'MSI monitor', 'BenQ monitor', 'HP monitor', 'Philips monitor', 'Corsair monitor', 'Zowie monitor'],
  MOUSE: ['Logitech mouse', 'Razer mouse', 'Corsair mouse', 'SteelSeries mouse', 'Microsoft mouse', 'Keychron mouse'],
  KEYBOARD: ['Logitech keyboard', 'Razer keyboard', 'Corsair keyboard', 'SteelSeries keyboard', 'Microsoft keyboard', 'Keychron keyboard', 'ROCCAT keyboard'],
  HEADSET: ['Sony headset', 'Logitech headset', 'Razer headset', 'Sennheiser headset', 'Corsair headset', 'SteelSeries headset', 'HyperX headset', 'Apple AirPods', 'Bose headset', 'Endgame Gear headset'],
  WEBCAM: ['Logitech webcam', 'HP webcam', 'Elgato webcam', 'Razer webcam', 'SteelSeries webcam', 'Microsoft webcam'],
  MIC: ['Blue microphone', 'Logitech microphone', 'Razer microphone', 'HyperX microphone', 'SteelSeries microphone'],
  STORAGE: ['Samsung SSD', 'Kingston SSD', 'Crucial SSD', 'Seagate hard drive', 'Western Digital hard drive'],
  RAM: ['Corsair memory module', 'Kingston FURY memory', 'Crucial memory module', 'G.Skill memory', 'Samsung memory module'],
  GPU: ['Nvidia GeForce RTX', 'AMD Radeon graphics card', 'Asus graphics card', 'MSI graphics card', 'Gigabyte graphics card'],
  CPU: ['Intel Core processor', 'AMD Ryzen processor'],
  PSU: ['Seasonic power supply', 'Corsair power supply', 'MSI power supply'],
  COOLER: ['Asus CPU cooler', 'Noctua CPU cooler', 'Arctic CPU cooler'],
  ACCESSORY: ['Apple charger', 'Samsung charger', 'Logitech accessory', 'Belkin accessory', 'Anker charger'],
  SMARTWATCH: ['Apple Watch', 'Samsung Galaxy Watch', 'Garmin watch', 'Xiaomi watch'],
};

/** Chuẩn hoá tên file để so khớp. */
const norm = (s: string): string =>
  s
    .replace(/^File:/, '')
    .replace(/\.(jpe?g|png|webp)$/i, '')
    .replace(/[_\s]+/g, ' ')
    .trim()
    .toLowerCase();

/** Chấm điểm ứng viên. */
function score(title: string, brand: string, typeWord: string): number {
  const t = norm(title);
  if (BAD.test(title)) return 0;
  const b = norm(brand).split(' ')[0];
  const hasBrand = t.includes(b);
  const hasType = t.includes(norm(typeWord));
  if (!hasBrand && !hasType) return 0;
  let s = 0;
  if (hasBrand) s += 4;
  if (hasType) s += 4;
  if (hasBrand && hasType) s += 6;
  // Ảnh chụp cận cảnh sản phẩm, tên ngắn gọn -> ưu tiên.
  const words = t.split(' ').length;
  if (words <= 6) s += 3;
  else if (words > 14) s -= 3;
  return s;
}

async function probe(brand: string, typeWord: string, limit = 8): Promise<string[]> {
  const q = `intitle:"${brand} ${typeWord}" filetype:bitmap`;
  const d = await getJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
      `&generator=search&gsrnamespace=6&gsrlimit=${limit}` +
      `&gsrsearch=${encodeURIComponent(q)}` +
      `&prop=imageinfo&iiprop=url|mime&iiurlwidth=1000`,
  );
  const out: { file: string; score: number }[] = [];
  const seen = new Set<string>();
  for (const p of Object.values<any>(d?.query?.pages ?? {})) {
    const ii = (p.imageinfo ?? [])[0];
    if (!ii || !/^image\/(jpeg|png|webp)$/.test(String(ii.mime))) continue;
    const title = String(p.title ?? '').replace(/^File:/, '');
    const s = score(title, brand, typeWord);
    if (s <= 0) continue;
    const file = (String(ii.url ?? '').split('/').pop() ?? title).replace(/^\d+px-/, '');
    if (seen.has(file)) continue;
    seen.add(file);
    out.push({ file, score: s });
  }
  return out
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((x) => x.file);
}

const pool: Record<string, Record<string, string[]>> = JSON.parse(
  readFileSync(POOL_PATH, 'utf-8'),
);

let added = 0;
for (const [typeKey, brands] of Object.entries(BRANDS)) {
  const typeWord = TYPE_QUERY[typeKey] ?? 'computer';
  pool[typeKey] ??= {};
  for (const brand of brands) {
    const key = brand.toLowerCase();
    if (pool[typeKey][key]?.length) continue;
    const files = await probe(brand, typeWord);
    if (!files.length) continue;
    pool[typeKey][key] = files;
    added++;
    console.log(`  + ${typeKey}/${key}: ${files.length} ảnh`);
    await new Promise((s) => setTimeout(s, 250));
  }
}

writeFileSync(POOL_PATH, JSON.stringify(pool, null, 2), 'utf-8');
console.log(`\nĐã bổ sung ${added} cặp (loại, hãng)`);

// Kiểm chứng: resolve được file nào.
const all = [...new Set(Object.values(pool).flatMap((b) => Object.values(b).flat()))];
const map = await resolveFiles(all);
console.log(`Resolve được ${map.size}/${all.length} file`);
