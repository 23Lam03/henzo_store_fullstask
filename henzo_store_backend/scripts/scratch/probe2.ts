/** Probe Commons search cho các model cụ thể còn thiếu ảnh riêng. */
import { writeFileSync } from 'node:fs';

const UA = 'henzo-store/1.0 (model image resolver; dev@henzo.local)';

async function getJson(url: string): Promise<any> {
  for (let a = 0; a < 3; a++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA } });
      if (r.status === 429) {
        await new Promise((s) => setTimeout(s, 2000 * (a + 1)));
        continue;
      }
      if (!r.ok) return null;
      return await r.json();
    } catch {
      await new Promise((s) => setTimeout(s, 800));
    }
  }
  return null;
}

const QUERIES = [
  'Corsair STRAFE',
  'Corsair K95',
  'Corsair Virtuoso',
  'Corsair Hydro',
  'Corsair keyboard gaming 2017',
  'Corsair Vanguard',
  'Corsair 4000D',
  'Corsair 780T',
  'Corsair Vengeance RGB',
  'Corsair fan',
  'Corsair mouse 2019',
  'Corsair headset 2023',
  'MSI Katana laptop',
  'MSI gaming laptop 2024',
  'MSI GF63',
  'MSI GS75',
  'MSI Bravo 17',
  'Acer GD245HQ',
  'Acer Predator monitor',
  'Samsung Odyssey G8',
  'Samsung monitor 2019',
  'Philips 27M1C5500',
  'Dell S3423DWC',
  'BenQ gaming monitor',
  'Gigabyte GS27F',
  'AORUS monitor',
  'MSI MAG 272UP',
  'MSI MPG 272URX',
  'MSI Optix monitor',
  'ROCCAT Ryos',
  'ROCCAT mouse',
  'HyperX Cloud II',
  'HyperX headset red',
  'SteelSeries Arctis headset',
  'SteelSeries Apex',
  'SteelSeries mouse',
  'Logitech G915',
  'Logitech G Pro X',
  'Keychron K2',
  'Keychron K1',
  'Keychron Q1',
  'Elgato Wave',
  'Samsung Galaxy Book',
  'Oppo Reno',
  'Xiaomi Pad',
  'Nokia G42',
  'Poco phone',
  'OnePlus phone',
  'Realme phone',
  'Vivo phone',
  'Sony WF-1000XM5',
  'Sony WH-1000XM5',
  'AirPods Pro',
  'AirPods 4',
  'MagSafe charger',
  'Sennheiser headset',
  'Bose headphones',
];

async function main() {
  const log: string[] = [];
  const all = new Set<string>();
  for (const q of QUERIES) {
    const d = await getJson(
      `https://commons.wikimedia.org/w/api.php?action=query&format=json&list=search` +
        `&srsearch=${encodeURIComponent(`filetype:bitmap ${q}`)}&srnamespace=6&srlimit=40`,
    );
    const res = (d?.query?.search ?? []) as any[];
    log.push(`\n=== ${q} (${res.length}) ===`);
    for (const r of res) {
      const t = String(r.title).replace(/^File:/, '');
      log.push(`  ${t}`);
      all.add(t);
    }
  }
  writeFileSync('scripts/data/probe2.txt', log.join('\n'));
  writeFileSync('scripts/data/probe2.json', JSON.stringify([...all], null, 2));
  console.log('total', all.size);
}

void main();
