/**
 * LỌC LẠI POOL ẢNH: loại ảnh không đúng loại sản phẩm.
 *
 * Ví dụ pool "Chuột" lẫn ảnh chuột nhắc (động vật), pool "Màn hình" lẫn ảnh
 * màn hình cũ. Script này áp bộ lọc NGỮ NGHĨA cho từng loại: ảnh còn lại
 * phải chứa từ khóa đúng loại VÀ không chứa từ khóa của loại khác/động vật.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const POOL_PATH = resolve(process.cwd(), 'scripts/data/type-image-pools.json');

/** Từ khóa BẮT BUỘC có trong tên file. */
const MUST: Record<string, string[]> = {
  'Điện thoại': ['iphone', 'galaxy s', 'pixel', 'phone', 'smartphone', 'redmi', 'oneplus', 'fone'],
  Tablet: ['ipad', 'galaxy tab', 'tablet'],
  Laptop: ['macbook', 'notebook', 'laptop', 'thinkpad', 'ideapad', 'zenbook', 'vivobook', 'pavilion', 'omen', 'predator', 'nitro', 'swift go', 'legion', 'matebook', 'gram', 'aorus', 'blade', 'alienware'],
  'Màn hình': ['monitor', 'display', 'ultragear', 'odyssey'],
  'PC Gaming': ['tower', 'desktop', 'graphics card', 'gpu', 'motherboard', 'power supply', 'memory module', 'ssd', 'nvme', 'geforce'],
  Chuột: ['mouse', 'g502', 'g pro x', 'deathadder', 'viper', 'basilisk', 'harpe', 'katar', 'm75', 'xm2', 'rival', 'naga', 'deathadder'],
  'Bàn phím': ['keyboard', 'keychron', 'k70', 'hhkb', 'mx keys', 'blackwidow', 'huntsman', 'azoth', 'vulcan', 'ducky', 'stream deck', 'thinkpad'],
  'Tai nghe': ['headset', 'headphone', 'airpods', 'earphone', 'wh-1000', 'quietcomfort', 'arctis'],
  'Phụ kiện': ['webcam', 'microphone', 'charger', 'power adapter', 'usb', 'dock', 'hub', 'cable'],
};

/** Từ khóa KHÔNG được có (loại khác, động vật, đời thường). */
const FORBID: Record<string, string[]> = {
  Chuột: ['spider', 'lemmur', 'grass mouse', 'mouse-deer', 'chevo', 'brain', 'nucleus', 'cell', 'stained', 'kidney', 'pony', 'blossom', 'mouse trap', 'mechanism', 'animal', 'rodent'],
  'Bàn phím': ['keycap', 'switch only', 'layout chart'],
  'Tai nghe': ['earcup', 'connector'],
  'Màn hình': ['vector', 'clipart', 'crt', 'diagram'],
  'Điện thoại': ['vector', 'clipart', 'diagram'],
  Tablet: ['vector', 'clipart', 'diagram'],
  Laptop: ['vector', 'clipart', 'diagram', 'keyboard only', 'touchpad'],
  'PC Gaming': ['vector', 'clipart', 'diagram', 'tool', 'screwdriver'],
  'Phụ kiện': ['vector', 'clipart', 'diagram'],
};

/** Từ chung của mọi loại — ảnh chứa chúng không đủ để xác định loại. */
const GENERIC = ['usb', 'cable'];

const pools: Record<string, string[]> = JSON.parse(
  readFileSync(POOL_PATH, 'utf-8'),
);

let totalBefore = 0;
let totalAfter = 0;

for (const [type, urls] of Object.entries(pools)) {
  totalBefore += urls.length;
  const must = MUST[type] ?? [];
  const forbid = FORBID[type] ?? [];
  const kept = urls.filter((u) => {
    const name = decodeURIComponent(u.split('?')[0]?.split('/').pop() ?? '')
      .replace(/^\d+px-/, '')
      .replace(/\.(jpe?g|png|webp)$/i, '')
      .replace(/[_.]/g, ' ')
      .toLowerCase();
    if (!must.length) return true;
    if (!must.some((k) => name.includes(k))) return false;
    if (forbid.some((k) => name.includes(k))) return false;
    // Loại chung chỉ dùng khi loại đó không có từ khóa riêng (Phụ kiện).
    if (type !== 'Phụ kiện' && GENERIC.some((g) => name === g)) return false;
    return true;
  });
  pools[type] = kept;
  totalAfter += kept.length;
  console.log(`${type}: ${urls.length} -> ${kept.length}`);
}

writeFileSync(POOL_PATH, JSON.stringify(pools, null, 2), 'utf-8');
console.log(`\nTổng: ${totalBefore} -> ${totalAfter}`);
