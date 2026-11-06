/** Tìm tên file Commons CHÍNH XÁC cho các model (dùng prefix listing). */
import { writeFileSync } from 'node:fs';
import { getJson } from '../lib/commons-files';

const PREFIXES = [
  'iPhone 16',
  'iPhone 15',
  'Samsung Galaxy S26',
  'Samsung Galaxy S25',
  'Samsung Galaxy S24',
  'Samsung Galaxy S23',
  'Samsung Galaxy A56',
  'Samsung Galaxy A36',
  'Samsung Galaxy A16',
  'Samsung Galaxy Z Fold',
  'Samsung Galaxy Z Flip',
  'Xiaomi 15',
  'Xiaomi 14T',
  'Redmi Note 14',
  'OPPO Find X8',
  'Vivo X200',
  'Google Pixel 9',
  'Realme 13',
  'Realme GT',
  'OnePlus 13',
  'OnePlus 12',
  'Honor Magic',
  'Tecno Spark',
  'Nokia G42',
  'Poco F6',
  'Poco X6',
  'ROG Phone',
  'Huawei Mate 60',
  'Bose QuietComfort',
  'Sony WH-1000XM',
  'Sony WF-1000XM',
  'Headset Sem Fio',
  'Samsung Battery',
  'Razer BlackWidow',
  'Acer GD245HQ',
  'Corsair 4000D',
  'Computer Tower',
  'Samsung 870 EVO',
  'Samsung 990 PRO',
  'Solid State Drive',
  'Lenovo ThinkPad X1',
  'Huawei MateBook',
  'LG Gram',
  'Dell Inspiron',
  'MSI Bravo',
  'MSI Katana',
  'MSI Raide',
  'MSI Titan',
  'MSI Stealth',
  'Sony WH',
  'Sony WF',
  'ASUS ROG Delta',
  'SteelSeries Sonar',
  'Elgato HD60',
  'Apple USB-C',
  'Microsoft Surface Pro',
  'Microsoft Surface Laptop 7',
  'Samsung Galaxy Tab S10',
  'Samsung Galaxy Tab S9',
  'Xiaomi Pad 6',
  'LG UltraGear',
  'Samsung Odyssey',
  'Samsung ViewFinity',
  'Acer Nitro XR',
  'Acer Predator XB',
  'Corsair Xeneon',
  'Zowie XL',
  'ViewSonic XG272',
  'ViewSonic ColorPro',
  'HP Omen 27',
  'HP Victus 27',
  'Philips 27E2N7900',
  'Philips 34E2N5600',
  'Lenovo ThinkVision',
  'Lenovo Legion R32',
  'ASUS ProArt PA32',
  'ASUS ProArt PA279',
  'BenQ PD3225',
  'BenQ MO320',
  'Dell UltraSharp',
  'Dell Alienware AW',
  'AOC AGON',
  'AOC CU34',
  'MSI MAG 321',
  'MSI MAG 401',
  'MSI MPG 271',
  'Gigabyte M32UC',
  'Gigabyte M34WMU',
  'Gigabyte M27Q',
  'Razer Raptor',
  'Samsung 990',
  'Samsung 870',
  'Crucial P3',
  'Seagate FireCuda',
  'Western Digital',
  'Samsung Odyssey G9',
  'ASUS ROG Swift PG32',
  'Samsung Galaxy S10',
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
  writeFileSync('scripts/data/probe-names.txt', log.join('\n'));
  writeFileSync('scripts/data/probe-names.json', JSON.stringify([...all], null, 2));
  console.log('total', all.size);
}

void main();
