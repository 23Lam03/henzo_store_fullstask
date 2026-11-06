import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const UA = 'henzo-store/1.0 (model image resolver; dev@henzo.local)';
let lastCall = 0;

async function getJson(url: string): Promise<any> {
  for (let a = 0; a < 5; a++) {
    const gap = Date.now() - lastCall;
    if (gap < 350) await new Promise((s) => setTimeout(s, 350 - gap));
    lastCall = Date.now();
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA } });
      if (r.status === 429 || r.status >= 500) {
        await new Promise((s) => setTimeout(s, 2000 * (a + 1)));
        continue;
      }
      if (!r.ok) {
        await new Promise((s) => setTimeout(s, 1200));
        continue;
      }
      return await r.json();
    } catch {
      await new Promise((s) => setTimeout(s, 1200));
    }
  }
  return null;
}

async function subCats(cat: string): Promise<string[]> {
  const d = await getJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
      `&list=categorymembers&cmtitle=Category:${encodeURIComponent(cat)}` +
      `&cmtype=subcat&cmlimit=200`,
  );
  return (d?.query?.categorymembers ?? []).map((c: any) =>
    String(c.title).replace(/^Category:/, ''),
  );
}

async function catFiles(cat: string, limit = 200): Promise<string[]> {
  const out: string[] = [];
  let cont: string | undefined;
  do {
    const d = await getJson(
      `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
        `&generator=categorymembers&gcmtitle=Category:${encodeURIComponent(cat)}` +
        `&gcmtype=file&gcmlimit=100` +
        `${cont ? `&gcmcontinue=${encodeURIComponent(cont)}` : ''}` +
        `&prop=imageinfo&iiprop=mime&iiurlwidth=1000`,
    );
    for (const p of Object.values<any>(d?.query?.pages ?? {})) {
      const ii = (p.imageinfo ?? [])[0];
      if (!ii?.mime || !/^image\/(jpeg|png|webp|tiff)$/.test(ii.mime)) continue;
      out.push(String(p.title).replace(/^File:/, ''));
    }
    cont = d?.continue?.gcmcontinue;
  } while (cont && out.length < limit);
  return out;
}

const ROOTS = [
  'Zowie', 'BenQ', 'LG', 'Samsung Electronics', 'Samsung Odyssey',
  'ViewSonic', 'Seagate', 'Corsair', 'HyperX', 'AOC', 'Gigabyte',
  'Lenovo', 'Razer', 'ASUS', 'ASUSTeK Computer', 'Kingston Technology',
  'JBL', 'Endgame Gear', 'AMD', 'Apple Inc.', 'Sony', 'Logitech',
  'MSI (company)', 'Acer Inc.', 'Dell', 'Hewlett-Packard', 'Intel',
  'Creative Technology', 'Sennheiser', 'SteelSeries', 'SteelSeries Arctis',
  'G.Skill', 'Crucial (company)', 'Western Digital', 'SanDisk', 'ADATA',
  'Cooler Master', 'NZXT', 'Thermaltake', 'Alienware', 'Huawei',
  'Xiaomi', 'Oppo', 'Vivo', 'Realme', 'OnePlus', 'Honor (company)',
  'Google', 'Nokia', 'Poco', 'Tecno', 'Western Digital', 'Elgato',
  'Roccat', 'Trust (company)', 'Keychron', 'M-Audio', 'Blue (company)',
];

async function crawl(root: string, maxDepth = 3) {
  const files = new Set<string>();
  const cats = new Set<string>();
  let frontier = [root];
  const visited = new Set<string>();
  for (let depth = 0; depth < maxDepth && frontier.length; depth++) {
    const next: string[] = [];
    for (const c of frontier) {
      if (visited.has(c)) continue;
      visited.add(c);
      cats.add(c);
      for (const f of await catFiles(c)) files.add(f);
      const subs = await subCats(c);
      for (const s of subs) {
        if (!visited.has(s)) next.push(s);
      }
    }
    frontier = next.slice(0, 60);
    console.log(`   [d${depth + 1}] frontier=${frontier.length} files=${files.size}`);
  }
  return { files: [...files], cats: [...cats] };
}

async function main() {
  const out: Record<string, { files: string[]; cats: string[] }> = {};
  const allCats = new Set<string>();
  const allFiles = new Set<string>();

  for (const root of ROOTS) {
    console.log(`\n=== ${root}`);
    const r = await crawl(root, 3);
    for (const c of r.cats) allCats.add(c);
    for (const f of r.files) allFiles.add(f);
    console.log(`   -> cats=${r.cats.length} files=${r.files.length}`);
  }

  writeFileSync(
    resolve(process.cwd(), 'scripts/data/brand-tree.json'),
    JSON.stringify({ cats: [...allCats], files: [...allFiles] }, null, 2),
    'utf-8',
  );
  console.log(`\n[done] cats=${allCats.size} files=${allFiles.size}`);
}

void main();
