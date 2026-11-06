/**
 * CIRRUSSEARCH — tìm file theo nhiều tiêu chí kết hợp.
 *
 * Commons search hỗ trợ:
 *   - insource / intitle
 *   - haswbstatement:P18=<QID>
 *   - incategory:"<Category>"
 *   - filetype:bitmap
 *
 * Chạy: npx tsx scripts/probe-cirrus.ts
 */
import { getJson } from '../lib/commons-files';

const QUERIES = [
  'intitle:"HyperX Cloud"',
  'intitle:HyperX filetype:bitmap',
  '"Cloud Alpha" headset',
  'HyperX headset -intitle:booth -intitle:logo',
  'intitle:"Corsair" headset',
  'Corsair HS60 OR HS80 OR VOID',
  'intitle:"SteelSeries Arctis"',
  'intitle:"Arctis"',
  'intitle:"XL2546" OR intitle:"XL2566"',
  'intitle:"M27Q" OR intitle:"M32UC"',
  'intitle:"Raptor" monitor',
  'intitle:"Razer" monitor',
  'intitle:"VP3200" OR intitle:"XG272"',
  'intitle:"UltraGear"',
  'intitle:"870 EVO" OR intitle:"870 QVO"',
  'intitle:"990 PRO"',
  'intitle:"XM2we" OR intitle:"Endgame"',
  'intitle:"Harpe" mouse',
  'intitle:"Seiren" microphone',
  'intitle:"27qs" OR intitle:"OMEN 27"',
];

async function search(q: string): Promise<string[]> {
  const d = await getJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
      `&list=search&srnamespace=6&srlimit=30&srsearch=${encodeURIComponent(q)}`,
  );
  return (d?.query?.search ?? []).map((x: any) =>
    String(x.title).replace(/^File:/, ''),
  );
}

async function main() {
  for (const q of QUERIES) {
    const r = await search(q);
    console.log(`\n== ${q} (${r.length})`);
    for (const t of r) console.log(`   ${t}`);
    await new Promise((s) => setTimeout(s, 120));
  }
}

void main();
