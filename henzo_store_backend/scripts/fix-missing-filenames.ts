/**
 * Tìm TÊN FILE THẬT trên Commons cho các file trong finalize-model-images.ts
 * mà không tồn tại (tên sai khớp chữ hoa/thương hiệu/ký hiệu).
 *
 * Chiến lược: thử chuẩn hoá tên (bỏ phần mở rộng, đổi phân biệt hoa thường),
 * tìm theo prefix, và theo model code trong tên.
 *
 * Chạy: npx tsx scripts/fix-missing-filenames.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { getJson } from './lib/commons-files';

const MISSING = [
  'Headset Sem Fio Avell Fusion.jpg',
  'Sony WH-1000XM5.jpg',
  'WH-1000XM5.png',
  'Sony WF-1000XM5.jpg',
  'WF-1000XM5.png',
  'Samsung Battery Pack.jpg',
  'Bose QuietComfort Ultra.jpg',
  'Razer BlackWidow Chroma 1 2017-01-01.jpg',
  'Acer GD245HQ - 2.JPG',
  'Computer Tower.jpg',
  'Samsung 870 EVO SSD.jpg',
  'Samsung 990 PRO SSD.jpg',
  'Solid State Drive.jpg',
  'Lenovo ThinkPad X1 Carbon Gen 12.jpg',
  'Huawei MateBook X Pro.jpg',
  'LG Gram 17.jpg',
  'Dell Inspiron 15 3530.jpg',
  'Apple iPhone 16 Pro Max Natural Titanium.jpg',
  'Back_of_iPhone_16_Pro_Max_Gold_model.jpg',
  'iPhone 16 Pro.jpg',
  'iPhone 16.jpg',
  'iPhone 16 Plus.jpg',
  'iPhone 16e.jpg',
  'iPhone 15 Pro.jpg',
  'iPhone 15.jpg',
  'Samsung Galaxy S23 Ultra.jpg',
  'Samsung Galaxy A56.jpg',
  'Samsung Galaxy A36.jpg',
  'Samsung Galaxy A16.jpg',
  'Samsung Galaxy Z Fold6.jpg',
  'Samsung Galaxy Z Flip6.jpg',
  'Samsung Galaxy S26.jpg',
  'Xiaomi 15.jpg',
  'Redmi Note 14 Pro 5G.jpg',
  'OPPO Find X8 Pro.jpg',
  'OPPO Find X8.jpg',
  'Google Pixel 9 Pro XL.jpg',
  'Google Pixel 9.jpg',
  'Realme 13 Pro+.jpg',
  'Realme GT 6.jpg',
  'Tecno Spark 30 Pro.jpg',
  'Nokia G42 5G.jpg',
  'Poco F6 Pro.jpg',
  'Poco X6 Pro.jpg',
  'ASUS ROG Phone 9 Pro.jpg',
  'Huawei Mate 60 Pro.jpg',
];

/** Từ khoá tìm kiếm cho mỗi file (thay vì dùng tên file nguyên bản). */
const KEYWORDS: Record<string, string[]> = {
  'Sony WH-1000XM5.jpg': ['WH-1000XM5'],
  'WH-1000XM5.png': ['WH-1000XM5'],
  'Sony WF-1000XM5.jpg': ['WF-1000XM5'],
  'WF-1000XM5.png': ['WF-1000XM5'],
  'Bose QuietComfort Ultra.jpg': ['QuietComfort'],
  'Samsung Galaxy S26.jpg': ['Galaxy S26'],
  'Samsung Galaxy A56.jpg': ['Galaxy A56'],
  'Samsung Galaxy A36.jpg': ['Galaxy A36'],
  'Samsung Galaxy A16.jpg': ['Galaxy A16'],
  'Samsung Galaxy Z Fold6.jpg': ['Galaxy Z Fold6'],
  'Samsung Galaxy Z Flip6.jpg': ['Galaxy Z Flip6'],
  'Samsung Galaxy S23 Ultra.jpg': ['Galaxy S23 Ultra'],
  'Samsung 870 EVO SSD.jpg': ['870 EVO'],
  'Samsung 990 PRO SSD.jpg': ['990 PRO'],
  'Xiaomi 15.jpg': ['Xiaomi 15'],
  'Redmi Note 14 Pro 5G.jpg': ['Redmi Note 14 Pro'],
  'OPPO Find X8 Pro.jpg': ['Find X8 Pro'],
  'OPPO Find X8.jpg': ['Find X8'],
  'Google Pixel 9 Pro XL.jpg': ['Pixel 9 Pro'],
  'Google Pixel 9.jpg': ['Pixel 9'],
  'Realme 13 Pro+.jpg': ['Realme 13 Pro'],
  'Realme GT 6.jpg': ['Realme GT 6'],
  'Tecno Spark 30 Pro.jpg': ['Spark 30'],
  'Nokia G42 5G.jpg': ['Nokia G42'],
  'Poco F6 Pro.jpg': ['Poco F6'],
  'Poco X6 Pro.jpg': ['Poco X6'],
  'ASUS ROG Phone 9 Pro.jpg': ['ROG Phone 9'],
  'Huawei Mate 60 Pro.jpg': ['Mate 60 Pro'],
  'iPhone 16.jpg': ['iPhone 16'],
  'iPhone 16 Plus.jpg': ['iPhone 16 Plus'],
  'iPhone 16e.jpg': ['iPhone 16e'],
  'iPhone 16 Pro.jpg': ['iPhone 16 Pro'],
  'iPhone 15.jpg': ['iPhone 15'],
  'iPhone 15 Pro.jpg': ['iPhone 15 Pro'],
  'Lenovo ThinkPad X1 Carbon Gen 12.jpg': ['ThinkPad X1 Carbon'],
  'Huawei MateBook X Pro.jpg': ['MateBook X Pro'],
  'LG Gram 17.jpg': ['LG Gram'],
  'Dell Inspiron 15 3530.jpg': ['Inspiron 15'],
  'Acer GD245HQ - 2.JPG': ['GD245HQ'],
};

async function search(q: string): Promise<string[]> {
  const d = await getJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
      `&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(`intitle:${q}`)}` +
      `&gsrlimit=25&prop=imageinfo&iiprop=url|mime&iiurlwidth=1000`,
  );
  const out: string[] = [];
  for (const p of Object.values<any>(d?.query?.pages ?? {})) {
    const ii = (p.imageinfo ?? [])[0];
    if (!ii?.mime || !/^image\/(jpeg|png|webp)$/.test(String(ii.mime))) continue;
    out.push(String(p.title).replace(/^File:/, ''));
  }
  return out;
}

async function main() {
  const report: Record<string, string[]> = {};
  for (const f of MISSING) {
    const kw = KEYWORDS[f] ?? [f.replace(/\.(jpe?g|png)$/i, '')];
    const seen = new Set<string>();
    const out: string[] = [];
    for (const k of kw) {
      for (const t of await search(k)) {
        if (seen.has(t)) continue;
        seen.add(t);
        out.push(t);
      }
    }
    report[f] = out;
    console.log(`\n== ${f} (${out.length})`);
    for (const t of out.slice(0, 20)) console.log(`   ${t}`);
  }
  writeFileSync(
    resolve(process.cwd(), 'scripts/data/fix-filenames.json'),
    JSON.stringify(report, null, 2),
    'utf-8',
  );
}

void main();
