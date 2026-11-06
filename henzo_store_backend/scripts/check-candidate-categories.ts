import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const UA = 'henzo-store/1.0 (model image resolver; dev@henzo.local)';

async function getJson(url: string): Promise<any> {
  for (let a = 0; a < 4; a++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA } });
      if (r.status === 429 || r.status >= 500) {
        await new Promise((s) => setTimeout(s, 1500 * (a + 1)));
        continue;
      }
      if (!r.ok) return null;
      return await r.json();
    } catch {
      await new Promise((s) => setTimeout(s, 900));
    }
  }
  return null;
}

async function catFiles(cat: string): Promise<string[]> {
  const d = await getJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
      `&generator=categorymembers&gcmtitle=Category:${encodeURIComponent(cat)}` +
      `&gcmtype=file&gcmlimit=120` +
      `&prop=imageinfo&iiprop=mime&iiurlwidth=1000`,
  );
  const out: string[] = [];
  for (const p of Object.values<any>(d?.query?.pages ?? {})) {
    const ii = (p.imageinfo ?? [])[0];
    if (!ii?.mime || !/^image\/(jpeg|png|webp)$/.test(ii.mime)) continue;
    out.push(String(p.title).replace(/^File:/, ''));
  }
  return out;
}

const CANDIDATES = [
  'HyperX Cloud III', 'HyperX Cloud II', 'HyperX Cloud Alpha', 'HyperX Cloud',
  'HyperX headsets', 'HyperX Cloud Alpha Wireless',
  'Corsair headsets', 'Corsair HS60', 'Corsair HS80', 'Corsair Void',
  'Corsair Xeneon', 'Corsair HS70', 'Corsair gaming headsets',
  'Zowie monitors', 'BenQ Zowie', 'Zowie XL',
  'LG UltraGear', 'LG UltraGear monitors', 'UltraGear 27GR95QE',
  'UltraGear 32GP950', 'LG monitors', 'LG Flatron',
  'Samsung Odyssey monitors', 'Samsung Odyssey', 'Odyssey G9', 'Odyssey Neo G9',
  'Samsung Odyssey OLED', 'Samsung Galaxy Book', 'Samsung Galaxy Book4 Ultra',
  'AOC monitors', 'AOC AGON', 'AOC LCD monitors',
  'Gigabyte monitors', 'Gigabyte AORUS monitors',
  'Lenovo Legion', 'Lenovo Legion monitors', 'Lenovo monitors',
  'ViewSonic monitors', 'ViewSonic ColorPro',
  'HP Omen', 'HP Omen monitors', 'HP Spectre', 'HP Spectre x360',
  'HP laptops', 'HP EliteBook',
  'Razer monitors', 'Razer Seiren', 'Razer Raptor', 'Razer mice',
  'ASUS ROG mice', 'ASUS mice', 'ROG Swift',
  'Seagate FireCuda', 'FireCuda', 'Seagate SSDs', 'Kingston FURY',
  'Kingston memory', 'Western Digital SSDs', 'WD Black', 'Crucial SSDs',
  'JBL Quantum', 'JBL headphones', 'SteelSeries Arctis', 'SteelSeries headsets',
  'Endgame Gear', 'Endgame Gear mice',
  'GeForce RTX 40 series', 'GeForce RTX 50 series', 'GeForce RTX 4090',
  'GeForce RTX 5090', 'Nvidia GeForce', 'GeForce RTX 4070', 'GeForce RTX 4080',
  'Custom computer builds', 'Computer cases', 'Gaming computers',
  'AirPods 4', 'AirPods Pro 2', 'Apple AirPods',
  'Razer Seiren V2', 'AMD Ryzen 9 7950X3D', 'AMD Ryzen 9000 series',
  'AMD Ryzen 7000 series', 'Gaming peripherals', 'Computer peripherals',
  'Headphones', 'Headsets', 'Gaming headsets', 'Computer monitors',
  'LCD monitors', 'Gaming monitors', 'Computer mice', 'Gaming mice',
  'Computer keyboards', 'Gaming keyboards', 'Graphics processing units',
  'Solid-state drives', 'Computer memory', 'DDR5 SDRAM',
  'Computer power supply units', 'CPU coolers', 'Laptops', 'Tablet computers',
  'Smartphones', 'Nvidia RTX 50 series', 'Nvidia RTX 40 series',
];

async function main() {
  const found: Record<string, string[]> = {};
  const queue = [...CANDIDATES];
  const workers = Array.from({ length: 8 }, async () => {
    while (queue.length) {
      const c = queue.shift()!;
      const files = await catFiles(c);
      if (files.length) {
        found[c] = files;
        console.log(`\n### ${c} (${files.length})`);
        files.slice(0, 25).forEach((f) => console.log(`   ${f}`));
      }
    }
  });
  await Promise.all(workers);
  writeFileSync(
    resolve(process.cwd(), 'scripts/data/candidate-categories.json'),
    JSON.stringify(found, null, 2),
    'utf-8',
  );
  console.log(`\n[done] ${Object.keys(found).length} category có file`);
}

void main();
