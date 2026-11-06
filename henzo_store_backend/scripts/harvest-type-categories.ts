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

async function catFiles(cat: string, limit = 400): Promise<string[]> {
  const out: string[] = [];
  let cont: string | undefined;
  do {
    const d = await getJson(
      `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
        `&generator=categorymembers&gcmtitle=Category:${encodeURIComponent(cat)}` +
        `&gcmtype=file&gcmlimit=200` +
        `${cont ? `&gcmcontinue=${encodeURIComponent(cont)}` : ''}` +
        `&prop=imageinfo&iiprop=mime&iiurlwidth=1000`,
    );
    for (const p of Object.values<any>(d?.query?.pages ?? {})) {
      const ii = (p.imageinfo ?? [])[0];
      if (!ii?.mime || !/^image\/(jpeg|png|webp)$/.test(ii.mime)) continue;
      out.push(String(p.title).replace(/^File:/, ''));
    }
    cont = d?.continue?.gcmcontinue;
  } while (cont && out.length < limit);
  return out;
}

async function subCats(cat: string): Promise<string[]> {
  const d = await getJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
      `&list=categorymembers&cmtitle=Category:${encodeURIComponent(cat)}` +
      `&cmtype=subcat&cmlimit=100`,
  );
  return (d?.query?.categorymembers ?? []).map((c: any) => c.title.replace(/^Category:/, ''));
}

const ROOTS = [
  'Headsets', 'Headphones', 'Gaming headsets', 'Bluetooth headsets',
  'Computer headsets', 'Earphones', 'In-ear monitors',
  'Computer monitors', 'LCD monitors', 'Gaming monitors', 'Ultrawide monitors',
  'Computer mice', 'Gaming mice', 'Computer keyboards', 'Gaming keyboards',
  'Solid-state drives', 'NVM Express', 'Hard disk drives', 'Computer memory',
  'DDR SDRAM', 'Computer power supply units', 'CPU coolers', 'Computer cases',
  'Microphones', 'Webcams', 'Computer peripherals', 'Graphics processing units',
  'Nvidia GeForce', 'Nvidia graphics cards', 'Laptops', 'Smartphones',
  'Tablet computers', 'Portable chargers', 'Power banks',
];

const SKIP = /^(Graphics|Movies|Music|Timetables|Trains|Books|Ships|Cars|Aircraft|Flora|Fauna|Maps|Flags|Bridges|Streets|Churches)/i;

async function main() {
  const all = new Set<string>();
  const seenCats = new Set<string>();
  const level1: string[] = [];

  for (const r of ROOTS) {
    for (const sc of await subCats(r)) {
      if (SKIP.test(sc)) continue;
      level1.push(sc);
    }
    for (const f of await catFiles(r, 400)) all.add(f);
  }
  console.log(`[l1] ${level1.length} subcategory`);

  for (const c of level1) {
    if (seenCats.has(c)) continue;
    seenCats.add(c);
    for (const f of await catFiles(c, 250)) all.add(f);
  }
  console.log(`[done] ${all.size} file`);
  writeFileSync(
    resolve(process.cwd(), 'scripts/data/type-category-files.json'),
    JSON.stringify({ __all: [...all] }, null, 2),
    'utf-8',
  );
}

void main();
