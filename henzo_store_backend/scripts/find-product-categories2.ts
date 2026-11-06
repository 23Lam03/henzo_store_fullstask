import { getJson } from './lib/commons-files';

const QUERIES = [
  'Corsair headsets',
  'Corsair mice',
  'Corsair keyboards',
  'Corsair power supplies',
  'Corsair computer cases',
  'Corsair memory modules',
  'Corsair accessories',
  'HyperX headsets',
  'HyperX Cloud',
  'HyperX keyboards',
  'SteelSeries headsets',
  'SteelSeries Arctis',
  'SteelSeries mice',
  'SteelSeries keyboards',
  'Logitech headsets',
  'Logitech mice',
  'Logitech keyboards',
  'Logitech webcams',
  'Zowie',
  'BenQ monitors',
  'Gigabyte monitors',
  'Gigabyte laptops',
  'Gigabyte mice',
  'Gigabyte keyboards',
  'HP monitors',
  'HP laptops',
  'HP Omen',
  'LG monitors',
  'LG UltraGear',
  'LG Gram',
  'Razer mice',
  'Razer keyboards',
  'Razer Blade',
  'Razer monitors',
  'Razer microphones',
  'Samsung solid state drives',
  'Samsung monitors',
  'Samsung laptops',
  'Samsung Galaxy Tab',
  'Kingston solid state drives',
  'Kingston FURY',
  'Kingston memory',
  'Endgame Gear',
  'Asus mice',
  'Asus keyboards',
  'Asus laptops',
  'Asus graphics cards',
  'MSI monitors',
  'MSI laptops',
  'MSI graphics cards',
  'Dell monitors',
  'Dell laptops',
  'Acer monitors',
  'Acer laptops',
  'Apple iPad',
  'AMD Ryzen',
  'Intel Core',
  'Noctua',
  'Arctic',
  'Anker',
  'Belkin',
  'Western Digital hard drives',
  'Solid-state drives',
  'DDR4 SDRAM',
  'DDR5 SDRAM',
  'CPU coolers',
  'Computer power supplies',
  'Graphics cards',
  'Nvidia GeForce',
  'Samsung EVO',
  'Samsung QVO',
  'Zowie XL',
  'BenQ Zowie',
  'HP monitors',
  'Gigabyte AORUS',
  'ASUS ROG',
  'Acer Predator',
];

async function search(q: string): Promise<string[]> {
  const d = await getJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
      `&list=search&srnamespace=14&srlimit=30&srsearch=${encodeURIComponent(q)}`,
  );
  return (d?.query?.search ?? []).map((x: any) =>
    String(x.title).replace(/^Category:/, ''),
  );
}

async function main() {
  const all = new Set<string>();
  for (const q of QUERIES) {
    const r = await search(q);
    console.log(`\n== ${q}`);
    for (const t of r) {
      console.log(`   ${t}`);
      all.add(t);
    }
    await new Promise((s) => setTimeout(s, 110));
  }
  console.log(`\n[TOTAL] ${all.size}`);
}

void main();
