/**
 * PROBE các trường hợp khó: tìm ảnh đúng model khi intitle search không ra.
 *
 * Chạy: npx tsx scripts/probe-hard.ts
 */
import { getJson } from '../lib/commons-files';

const TERMS = [
  'WH-1000XM5',
  'WF-1000XM5',
  'Sony headphones WH-1000',
  'Realme 13',
  'Realme GT',
  'Nokia G42',
  'Poco F6',
  'Poco X6',
  '870 EVO',
  'Samsung 870 QVO',
  'Natural Titanium iPhone',
  'iPhone 16 Pro Max Titanium',
  'SteelSeries Sonar',
  'Zowie XL2566K',
  'Zowie XL2546X',
  'LG UltraGear 27GR95QE',
  'LG UltraGear 32GP950',
  'Endgame Gear XM2',
  'Logitech MX Keys S',
  'HP Omen 27',
  'Omen 27qs',
];

async function search(q: string): Promise<string[]> {
  const d = await getJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
      `&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(q)}` +
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
  for (const t of TERMS) {
    const r = await search(t);
    console.log(`\n== ${t} (${r.length})`);
    for (const x of r.slice(0, 25)) console.log(`   ${x}`);
  }
}

void main();
