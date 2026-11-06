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

const QUERIES = [
  'Corsair K70',
  'Corsair K100',
  'Corsair Katar',
  'Corsair Scimitar',
  'Corsair M75',
  'Corsair HS60',
  'Corsair HS80',
  'Corsair ST100',
  'Corsair iCUE',
  'Corsair MM300',
  'Corsair Dominator',
  'Corsair Vengeance',
  'Corsair MP600',
  'Corsair RM850',
  'Corsair PSU',
  'Corsair case',
  'MSI Katana',
  'MSI Raider',
  'MSI Titan',
  'MSI Stealth',
  'MSI Bravo',
  'MSI GE laptop',
  'MSI Prestige',
  'MSI modern',
  'AOC monitor',
  'Gigabyte AORUS monitor',
  'Gigabyte M32U',
  'Gigabyte M34',
  'MSI MAG monitor',
  'MSI Optix',
  'HyperX Cloud',
  'SteelSeries Arctis',
  'Razer Kraken',
  'Razer DeathAdder',
  'Logitech G502',
  'Logitech MX Master',
  'Keychron keyboard',
  'ROCCAT keyboard',
  'Elgato Stream Deck',
  'monitor ultrawide',
  'monitor curved gaming',
  'gaming headset',
  'wireless gaming mouse',
  'gaming microphone',
  'webcam',
  'power bank',
  'iPad Pro',
  'Galaxy Tab',
  'Surface Laptop',
  'Dell XPS',
  'HP laptop',
  'ASUS Zenbook',
  'Razer Blade',
  'Acer Predator',
  'Asus TUF',
  'CPU socket AM5',
  'motherboard ATX',
  'desktop computer tower',
  'graphics card RTX',
];

async function main() {
  const out: string[] = [];
  const log: string[] = [];
  for (const q of QUERIES) {
    const d = await getJson(
      `https://commons.wikimedia.org/w/api.php?action=query&format=json&list=search` +
        `&srsearch=${encodeURIComponent(`filetype:bitmap ${q}`)}&srnamespace=6&srlimit=40`,
    );
    const res = (d?.query?.search ?? []) as any[];
    log.push(`\n=== ${q} (${res.length}) ===`);
    for (const r of res) log.push(`  ${r.title.replace(/^File:/, '')}`);
    out.push(...res.map((r) => r.title.replace(/^File:/, '')));
  }
  writeFileSync('scripts/data/probe-latest.json', JSON.stringify([...new Set(out)], null, 2));
  writeFileSync('scripts/data/probe-latest.txt', log.join('\n'));
}

void main();
