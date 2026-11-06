import { writeFileSync } from 'node:fs';
import { getJson } from '../lib/commons-files';

const PREFIXES = [
  'Poco',
  'POCO',
  'Realme',
  'realme',
  'Nokia G',
  'Tecno Spark 3',
  'OnePlus 12',
  'Vivo V40',
  'Vivo X200',
  'Xiaomi Pad',
  'ASUS ROG Phone 9',
  'Huawei Mate 60',
  'Honor Magic6',
  'Xiaomi 15',
  'Samsung Galaxy S26',
  'Samsung Galaxy A56',
  'Samsung Galaxy A36',
  'Samsung Galaxy A16',
  'Samsung Galaxy S24',
  'Samsung Galaxy S25',
  'Redmi Note 14',
  'Google Pixel 9 Pro XL',
  'OPPO Find X8',
  'Xiaomi 14T',
  'iPhone 16 Pro Max',
  'IPhone 16',
  'IPhone 15',
  'Samsung Galaxy Z Fold 6',
  'Samsung Galaxy Z Flip 6',
  'Samsung Galaxy Tab S9',
  'Samsung Galaxy Tab S8',
  'Microsoft Surface Pro 12',
  'Microsoft Surface Pro',
  'Lenovo ThinkPad X1 Carbon',
  'LG Gram',
  'Dell Inspiron 15 3530',
  'Samsung 990 PRO',
  'Samsung SSD',
  'Bose QuietComfort',
  'Sony WH-1000',
  'Sony WF-1000',
  'Samsung Galaxy Book4',
  'Samsung Galaxy Book',
  'Xiaomi 15 Ultra',
  'Samsung Odyssey G9',
  'LG UltraGear 32',
  'LG UltraGear 27',
  'Samsung ViewFinity',
  'Samsung Odyssey OLED',
  'Samsung Odyssey Neo',
  'Dell UltraSharp U2723QE',
  'Dell Alienware AW3225',
  'Dell Alienware AW2723',
  'AOC AGON',
  'AOC CU34',
  'MSI MAG 321UPX',
  'MSI MAG 401QR',
  'MSI MPG 271QRX',
  'Gigabyte M32UC',
  'Gigabyte M34WMU',
  'Gigabyte M27Q',
  'BenQ PD3225',
  'BenQ MO320',
  'Zowie XL2566',
  'Zowie XL2546',
  'ViewSonic XG272',
  'ViewSonic ColorPro',
  'HP Omen 27qs',
  'HP Victus 27q',
  'Philips 27E2N',
  'Philips 34E2N',
  'Lenovo Legion R32',
  'Lenovo ThinkVision T32',
  'ASUS ProArt PA32',
  'ASUS ProArt PA279',
  'ASUS ROG Swift PG32',
  'Corsair Xeneon',
  'Acer Nitro XR273',
  'Acer Predator XB273',
  'Razer Raptor 27',
  'Seagate FireCuda',
  'Crucial T500',
  'Crucial P3',
  'Western Digital Blue',
  'Western Digital Black',
  'Samsung 870 QVO',
];

async function main() {
  const log: string[] = [];
  const all = new Set<string>();
  for (const p of PREFIXES) {
    let cont: string | undefined;
    const items: string[] = [];
    do {
      const d = await getJson(
        `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
          `&list=allpages&apnamespace=6&apprefix=${encodeURIComponent(p)}` +
          `&aplimit=500&formatversion=2${cont ? `&apcontinue=${encodeURIComponent(cont)}` : ''}`,
      );
      const pages = (d?.query?.allpages ?? []) as any[];
      items.push(...pages.map((x) => String(x.title).replace(/^File:/, '')));
      cont = d?.continue?.apcontinue;
    } while (cont);
    log.push(`\n=== ${p} (${items.length}) ===`);
    for (const t of items) {
      log.push(`  ${t}`);
      all.add(t);
    }
  }
  writeFileSync('scripts/data/probe-names2.txt', log.join('\n'));
  writeFileSync('scripts/data/probe-names2.json', JSON.stringify([...all], null, 2));
  console.log('total', all.size);
}

void main();
