/**
 * TÌM TÊN CATEGORY COMMONS THẬT cho (hãng + loại sản phẩm).
 *
 * Dùng list=search với namespace 14 (Category).
 *
 * Chạy: npx tsx scripts/find-product-categories.ts
 */
import { getJson } from './lib/commons-files';

const QUERIES: Array<[string, string]> = [
  ['Corsair', 'Corsair headsets|mice|keyboards|power supplies|computer cases|memory'],
  ['HyperX', 'HyperX headsets|keyboards|memory'],
  ['SteelSeries', 'SteelSeries headsets|Arctis|mice|keyboards'],
  ['Logitech', 'Logitech headsets|mice|keyboards|webcams'],
  ['Zowie', 'Zowie monitors|BenQ Zowie'],
  ['Gigabyte', 'Gigabyte monitors|laptops|mice|keyboards|graphics cards'],
  ['HP', 'HP monitors|laptops|Omen'],
  ['LG', 'LG monitors|UltraGear|Ultragear|gram laptops'],
  ['ViewSonic', 'ViewSonic monitors'],
  ['Razer', 'Razer monitors|mice|keyboards|Blade|laptops|microphones'],
  ['Philips', 'Philips monitors'],
  ['Samsung', 'Samsung solid-state drives|monitors|laptops|Galaxy Tab'],
  ['Kingston', 'Kingston solid-state drives|Flash drives|memory modules|FURY'],
  ['Endgame', 'Endgame Gear mice|Endgame Gear'],
  ['Corsair headset', 'Category:Corsair headsets'],
  ['AOC', 'AOC monitors'],
  ['Asus', 'Asus monitors|mice|keyboards|laptops|graphics cards|ROG'],
  ['MSI', 'MSI monitors|keyboards|laptops|graphics cards'],
  ['Dell', 'Dell monitors|laptops|Alienware'],
  ['Acer', 'Acer monitors|laptops|Predator'],
  ['Apple', 'Apple iPad|iPad tablets'],
  ['Microsoft', 'Microsoft Surface tablets|Surface'],
  ['AMD', 'AMD Ryzen processors|Ryzen'],
  ['Intel', 'Intel Core processors'],
  ['Noctua', 'Noctua CPU coolers'],
  ['Arctic', 'Arctic CPU coolers'],
  ['Elgato', 'Elgato'],
  ['Anker', 'Anker power banks|Anker'],
  ['Belkin', 'Belkin chargers|Belkin'],
  ['Lian Li', 'Lian Li computer cases'],
  ['Cooler Master', 'Cooler Master computer cases'],
  ['Crucial', 'Crucial solid-state drives'],
  ['Seagate', 'Seagate hard drives'],
  ['Western Digital', 'Western Digital hard drives'],
  ['JBL', 'JBL headphones'],
  ['Sennheiser', 'Sennheiser'],
  ['Blue', 'Blue microphones|Blue Yeti'],
  ['Bose', 'Bose headphones'],
  ['Sony headphones', 'Sony WH-1000XM'],
  ['Huawei', 'Huawei tablets|MateBook'],
  ['ASUS', 'Category:ASUS products'],
];

async function search(q: string): Promise<string[]> {
  const d = await getJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
      `&list=search&srnamespace=14&srlimit=25&srsearch=${encodeURIComponent(q)}`,
  );
  return (d?.query?.search ?? []).map((x: any) =>
    String(x.title).replace(/^Category:/, ''),
  );
}

async function main() {
  for (const [label, q] of QUERIES) {
    const r = await search(q);
    console.log(`\n== ${label}`);
    for (const t of r) console.log(`   ${t}`);
    await new Promise((s) => setTimeout(s, 120));
  }
}

void main();
