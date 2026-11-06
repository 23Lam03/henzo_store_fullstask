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
  const out: string[] = [];
  let cont: string | undefined;
  do {
    const d = await getJson(
      `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
        `&generator=categorymembers&gcmtitle=Category:${encodeURIComponent(cat)}` +
        `&gcmtype=file&gcmlimit=200${cont ? `&gcmcontinue=${encodeURIComponent(cont)}` : ''}` +
        `&prop=imageinfo&iiprop=url|mime&iiurlwidth=1000`,
    );
    for (const p of Object.values<any>(d?.query?.pages ?? {})) {
      const ii = (p.imageinfo ?? [])[0];
      if (!ii?.mime || !/^image\/(jpeg|png|webp)$/.test(ii.mime)) continue;
      out.push(String(p.title).replace(/^File:/, ''));
    }
    cont = d?.continue?.gcmcontinue;
  } while (cont && out.length < 500);
  return out;
}

async function findCats(q: string): Promise<string[]> {
  const d = await getJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
      `&list=search&srsearch=${encodeURIComponent(q)}&srnamespace=14&srlimit=30`,
  );
  return (d?.query?.search ?? []).map((s: any) => s.title.replace(/^Category:/, ''));
}

const GUESS = [
  'HyperX', 'HyperX Cloud Alpha', 'HyperX headsets', 'HyperX gaming headsets',
  'Corsair headsets', 'Corsair gaming headsets', 'Corsair HS series',
  'Corsair Xeneon', 'Zowie', 'BenQ Zowie', 'Zowie monitors',
  'LG UltraGear', 'LG monitors', 'Samsung Odyssey monitors', 'Odyssey monitors',
  'Gigabyte monitors', 'Gigabyte Aorus monitors', 'Lenovo Legion',
  'Seagate FireCuda', 'FireCuda', 'Kingston Technology', 'Kingston FURY',
  'ASUS ROG', 'ASUS ROG mice', 'Endgame Gear', 'JBL headphones',
  'Razer microphones', 'Razer Seiren', 'Samsung Galaxy Book series',
  'Microsoft Surface', 'Apple headphones', 'AOC AGON',
];

async function main() {
  const seen = new Set<string>();
  const out: Record<string, string[]> = {};
  for (const g of GUESS) {
    const cats = new Set<string>([g]);
    for (const c of await findCats(g)) cats.add(c);
    for (const c of cats) {
      const files = await catFiles(c);
      if (!files.length) continue;
      const key = `${c}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out[key] = files;
      console.log(`${c}: ${files.length}`);
    }
  }
  writeFileSync(
    resolve(process.cwd(), 'scripts/data/brand-category-files.json'),
    JSON.stringify(out, null, 2),
    'utf-8',
  );
  console.log(`[done] ${Object.keys(out).length} categories`);
}

void main();
