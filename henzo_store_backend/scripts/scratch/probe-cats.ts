/** Liệt kê toàn bộ file trong các Category Commons cụ thể (dùng cm=category). */
import { writeFileSync } from 'node:fs';

const UA = 'henzo-store/1.0 (model image resolver; dev@henzo.local)';

async function getJson(url: string): Promise<any> {
  for (let a = 0; a < 3; a++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA } });
      if (r.status === 429) {
        await new Promise((s) => setTimeout(s, 2000 * (a + 1)));
        continue;
      }
      if (!r.ok) return null;
      return await r.json();
    } catch {
      await new Promise((s) => setTimeout(s, 800));
    }
  }
  return null;
}

const CATS = [
  'Category:Corsair keyboards',
  'Category:Corsair mice',
  'Category:Corsair headsets',
  'Category:Corsair computer cases',
  'Category:Corsair power supplies',
  'Category:Corsair memory',
  'Category:Corsair SSD',
  'Category:MSI laptops',
  'Category:MSI notebooks',
  'Category:MSI graphics cards',
  'Category:MSI motherboards',
  'Category:MSI computer monitors',
  'Category:MSI gaming computers',
  'Category:Gigabyte monitors',
  'Category:Gigabyte laptops',
  'Category:Gigabyte graphics cards',
  'Category:ASUS ROG laptops',
  'Category:Acer Predator laptops',
  'Category:HyperX headsets',
  'Category:SteelSeries headsets',
  'Category:Razer headsets',
  'Category:Keychron keyboards',
  'Category:Logitech mice',
  'Category:ROCCAT keyboards',
  'Category:Lenovo ThinkPad laptops',
  'Category:Apple iPad Pro',
  'Category:Samsung Galaxy Tab S9',
  'Category:Microsoft Surface',
  'Category:Elgato',
  'Category:Anker power banks',
];

async function main() {
  const log: string[] = [];
  const all = new Set<string>();
  for (const c of CATS) {
    const d = await getJson(
      `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
        `&list=categorymembers&cmtitle=${encodeURIComponent(c)}&cmtype=file&cmlimit=200`,
    );
    const res = (d?.query?.categorymembers ?? []) as any[];
    log.push(`\n=== ${c} (${res.length}) ===`);
    for (const r of res) {
      const t = String(r.title).replace(/^File:/, '');
      log.push(`  ${t}`);
      all.add(t);
    }
  }
  writeFileSync('scripts/data/probe-cats.txt', log.join('\n'));
  writeFileSync('scripts/data/probe-cats.json', JSON.stringify([...all], null, 2));
  console.log('total', all.size);
}

void main();
