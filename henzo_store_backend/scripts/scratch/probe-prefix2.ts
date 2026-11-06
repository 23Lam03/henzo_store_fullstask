/**
 * PROBE PREFIX (allpages) — thử nhiều dạng prefix, có/khoảng trắng.
 *
 * Chạy: npx tsx scripts/probe-prefix2.ts
 */
import { getJson } from '../lib/commons-files';

const PREFIXES = [
  'HyperX Cloud',
  'HyperX_Cloud',
  'Cloud Alpha',
  'Cloud III',
  'Cloud II',
  'HyperX',
  'Corsair HS',
  'Corsair_VOID',
  'VOID',
  'Corsair headset',
  'Corsair Headset',
  'SteelSeries Arctis',
  'Arctis',
  'SteelSeries',
  'M27Q',
  'M32UC',
  'M34WMU',
  'Gigabyte M',
  'Gigabyte monitor',
  'XL2546',
  'XL2566',
  'Zowie',
  'BenQ XL',
  'Raptor 27',
  'Seiren',
  'XM2we',
  'VP3200',
  'XG272',
  'Harpe',
  'Endgame Gear',
  '870 EVO',
  '870_QVO',
  '990 PRO',
  '990_PRO',
  'UltraGear',
  '27GR95QE',
  '32GP950',
  '27qs',
  'Rival 650',
  'K100',
  'K70',
  'Katar',
  'M75',
];

async function prefix(p: string): Promise<string[]> {
  const d = await getJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
      `&list=allpages&apnamespace=6&apprefix=${encodeURIComponent(p)}&aplimit=60`,
  );
  return (d?.query?.allpages ?? []).map((x: any) =>
    String(x.title).replace(/^File:/, ''),
  );
}

async function main() {
  for (const p of PREFIXES) {
    const r = await prefix(p);
    console.log(`\n== ${p} (${r.length})`);
    for (const t of r.slice(0, 30)) console.log(`   ${t}`);
    await new Promise((s) => setTimeout(s, 90));
  }
}

void main();
