/** Liệt kê TOÀN BỘ file Commons bắt đầu bằng prefix (allpages, ns=6). */
import { writeFileSync } from 'node:fs';

const UA = 'henzo-store/1.0 (model image resolver; dev@henzo.local)';

async function getJson(url: string): Promise<any> {
  for (let a = 0; a < 4; a++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA } });
      if (r.status === 429) {
        await new Promise((s) => setTimeout(s, 2500 * (a + 1)));
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

const PREFIXES = [
  'Corsair',
  'MSI ',
  'MSI-',
  'Gigabyte ',
  'AOC ',
  'BenQ ',
  'Acer ',
  'Samsung Galaxy',
  'ASUS ',
  'Asus ',
  'Logitech ',
  'SteelSeries',
  'Razer ',
  'HyperX',
  'Keychron',
  'ROCCAT',
  'Elgato',
  'Lenovo ThinkPad',
  'Sony WH-1000XM',
  'AirPods',
  'Oppo Reno',
  'Xiaomi Pad',
  'Nokia G',
  'Poco ',
  'OnePlus ',
  'Realme ',
  'Vivo ',
  'Surface ',
  'HP Victus',
  'Dell S3423',
  'Dell U',
  'LG UltraGear',
  'Zowie',
  'ViewSonic',
  'Philips 27',
  'Samsung Odyssey',
  'Cooler Master',
  'DeepCool',
  'Seagate ',
  'Western Digital',
  'Crucial ',
  'G.Skill',
  'Kingston ',
  'Palit ',
  'Thermaltake',
  'Noctua',
  'be quiet',
  'NZXT',
  'Antec ',
  'Fractal Design',
  'Logostek',
];

async function main() {
  const log: string[] = [];
  const all = new Set<string>();
  for (const p of PREFIXES) {
    let cont: string | undefined;
    const items: string[] = [];
    do {
      const d = await getJson(
        `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
          `&list=allpages&apnamespace=6&apprefix=${encodeURIComponent(p)}` +
          `&aplimit=500&formatversion=2${cont ? `&apcontinue=${encodeURIComponent(cont)}` : ''}`,
      );
      const pages = (d?.query?.allpages ?? []) as any[];
      items.push(...pages.map((x) => String(x.title).replace(/^File:/, '')));
      cont = d?.continue?.apcontinue;
    } while (cont);
    log.push(`\n=== ${p} (${items.length}) ===`);
    for (const t of items) {
      log.push(`  ${t}`);
      all.add(t);
    }
  }
  writeFileSync('scripts/data/probe-prefix.txt', log.join('\n'));
  writeFileSync('scripts/data/probe-prefix.json', JSON.stringify([...all], null, 2));
  console.log('total', all.size);
}

void main();
