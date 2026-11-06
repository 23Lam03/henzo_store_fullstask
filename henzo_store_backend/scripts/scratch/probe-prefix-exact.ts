/**
 * PROBE prefix chính xác cho các model còn thiếu ảnh.
 *
 * Chạy: npx tsx scripts/probe-prefix-exact.ts
 */
import { getJson } from '../lib/commons-files';

const PREFIXES = [
  'Realme 1', 'Realme 13', 'Realme 12', 'Realme GT', 'Realme G', 'Realme N',
  'Tecno', 'Nokia G', 'Nokia 3', 'Nokia C',
  'Poco F', 'Poco X', 'POCO F', 'POCO X', 'Poco 6', 'Poco 7',
  'Sony WH-1000', 'Sony WF-1000', 'WH-1000', 'WF-1000', 'Sony WH', 'Sony WF',
  'Find X8', 'OPPO Find', 'Oppo Find',
  'Samsung 870', '870 EVO', '870 QVO',
  'Logitech MX Keys', 'MX Keys', 'Logitech MX',
  'SteelSeries', 'Zowie', 'BENQ XL', 'BenQ XL',
  'UltraGear', 'LG UltraGear', 'LG 27', 'LG 32',
  'Endgame', 'HyperX Cloud', 'Cloud II',
  'HP Omen', 'OMEN 27', 'Omen 16',
  'Realme Pad',
];

async function prefix(p: string): Promise<string[]> {
  const d = await getJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
      `&list=allpages&apnamespace=6&apprefix=${encodeURIComponent(p)}&aplimit=100`,
  );
  return (d?.query?.allpages ?? []).map((x: any) => String(x.title).replace(/^File:/, ''));
}

async function main() {
  for (const p of PREFIXES) {
    const r = await prefix(p);
    console.log(`\n== ${p} (${r.length})`);
    for (const t of r) console.log(`   ${t}`);
  }
}

void main();
