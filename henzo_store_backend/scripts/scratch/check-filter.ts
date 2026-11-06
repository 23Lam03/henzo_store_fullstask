import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const mi = JSON.parse(
  readFileSync(resolve(process.cwd(), 'scripts/data/model-images.json'), 'utf-8'),
) as Record<string, { images: string[] }>;

function keyword(model: string): string {
  const t = model
    .replace(/^(Samsung|Apple|ASUS|MSI|Dell|Lenovo|HP|Acer|Gigabyte|Razer|Logitech|Corsair|SteelSeries|ROCCAT|Keychron|Bose|JBL|Intel|AMD|NVIDIA|G\.Skill|Western Digital|Seagate|Crucial|Amazon|Belkin|Elgato|Zowie|BenQ|ViewSonic|Philips|AOC|Apple|Microsoft|Huawei|LG|OPPO|Vivo|Xiaomi|Realme|Nokia|OnePlus|Honor|Tecno|Google|Redmi|Poco|Sony|Samsung|Cooler Master|DeepCool|MX|Acer|Solidigm|Sabrent|Teamgroup|WD|Kingston|Cougar|Redragon|Etekcity)[\s-]/i, '')
    .trim();

  return t;
}

const samples = [
  'Samsung Galaxy A16',
  'Samsung Galaxy Z Fold6',
  'Samsung Galaxy S24 Ultra',
  'Samsung Galaxy S26',
  'Samsung Galaxy S26+',
  'iPhone 16',
  'iPhone 16 Plus',
  'Gigabyte M32UC',
  'HP Omen 16',
  'HP Victus 15',
];

for (const m of samples) {
  const pool = mi[m]?.images ?? [];
  const kw = keyword(m);
  const parts = kw.split(/\s+/).filter(Boolean);
  const matched = pool.filter((u) => {
    const f = decodeURIComponent(u);
    return parts.every((p) => f.toLowerCase().includes(p.toLowerCase().replace(/\s+/g, '')) || f.toLowerCase().includes(p.toLowerCase()));
  });
  console.log(`${m.padEnd(28)} kw="${kw}" pool=${pool.length} khớp=${matched.length}`);
  matched.slice(0, 3).forEach((x) => console.log('     ', x.slice(70, 150)));
}
