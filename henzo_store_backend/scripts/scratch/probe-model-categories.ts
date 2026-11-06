/**
 * PROBE CATEGORY CON CỤ THỂ cho các brand còn thiếu ảnh sản phẩm.
 *
 * Chạy: npx tsx scripts/probe-model-categories.ts
 */
import { getJson } from '../lib/commons-files';

const QUERIES = [
  // HyperX
  'HyperX Cloud II',
  'HyperX Cloud Alpha',
  'HyperX Cloud III',
  'HyperX Cloud',
  'HyperX',
  'HyperX headsets',
  // Corsair
  'Corsair VOID',
  'Corsair HS60',
  'Corsair HS80',
  'Corsair headset',
  'Corsair ST100',
  'Corsair',
  // Gigabyte
  'M27Q',
  'M32UC',
  'M34WMU',
  'Gigabyte monitor',
  'Gigabyte M-series',
  'AORUS',
  'Gigabyte Aorus',
  'AORUS laptops',
  // Razer
  'Razer monitor',
  'Razer Raptor',
  'Razer',
  // Samsung
  'Samsung 870 EVO',
  'Samsung 870',
  'Samsung 990 PRO',
  'Samsung NVMe',
  // Endgame
  'Endgame Gear mouse',
  'Endgame',
  // ASUS
  'ASUS ROG Harpe',
  'ROG Harpe',
  'ROG mouse',
  'ASUS mice',
  // G.Skill
  'G.Skill',
  'G.Skill Trident',
  'G.Skill Ripjaws',
  // LG / Philips / ViewSonic / HP
  'UltraGear',
  'LG UltraGear',
  'Philips monitor',
  'ViewSonic ColorPro',
  'VP3200',
  'XG272',
  'HP Omen monitor',
  'OMEN 27',
  // SteelSeries / Logitech
  'Arctis',
  'SteelSeries Arctis Nova',
  'Logitech G Pro X',
  'Logitech G Pro',
  'Logitech headset',
  // Zowie / BenQ
  'Zowie XL2546',
  'Zowie XL2566',
  'BenQ Zowie',
  'Zowie',
  // MSI / Dell / Acer
  'MSI MAG',
  'MSI MPG',
  'Dell Alienware',
  'AW3225QF',
  'Alienware monitors',
];

async function search(q: string): Promise<string[]> {
  const d = await getJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
      `&list=search&srnamespace=14&srlimit=20&srsearch=${encodeURIComponent(q)}`,
  );
  return (d?.query?.search ?? []).map((x: any) =>
    String(x.title).replace(/^Category:/, ''),
  );
}

async function main() {
  for (const q of QUERIES) {
    const r = await search(q);
    console.log(`\n== ${q}`);
    for (const t of r) console.log(`   ${t}`);
    await new Promise((s) => setTimeout(s, 100));
  }
}

void main();
