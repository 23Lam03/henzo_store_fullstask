import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { getJson } from '../lib/commons-files';

const TARGETS: Record<string, string[]> = {
  PHONE: [
    'Samsung Galaxy smartphones', 'iPhone', 'smartphones', 'Google Pixel',
    'OnePlus', 'Realme', 'Xiaomi phones', 'Huawei phones', 'Android phones',
  ],
  PC_CASE: [
    'computer cases', 'desktop computer', 'computer tower', 'personal computers',
  ],
  HEADSET: [
    'gaming headsets', 'headphones', 'computer headset', 'wireless headphones',
  ],
};

const REJECT =
  /\b(disassembl|teardown|exploded|schematic|circuit|mainboard|motherboard|logic ?board|pcb|chipset|logo|icon|diagram|chart|booth|gamescom|comiket|esl|blast|person|people|man|woman|player|streamer|interview|autograph|crowd|audience|stage|signing|museum|store|office|desk|setup|box|package|unboxing|review|comparison|boit|tokyo-game-show|faceit|homestory|hwc|poster|banner|advert|swatch|book|cover|map|screenshot|interface|menu|wallpaper|blueprint|patent|drawing|holding|hand|hands)\b/i;

async function findCats(q: string): Promise<string[]> {
  const d = await getJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json&list=search` +
      `&srsearch=${encodeURIComponent(`incategory:"${q}"`)}&srnamespace=14&srlimit=25`,
  );
  return (d?.query?.search ?? [])
    .map((x: any) => String(x.title).replace(/^Category:/, ''))
    .filter((t: string) => {
      const lw = t.toLowerCase();
      return lw.includes(q.toLowerCase().split(' ')[0]);
    });
}

async function catFiles(c: string, depth = 0): Promise<string[]> {
  const d = await getJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
      `&generator=categorymembers&gcmtitle=${encodeURIComponent(`Category:${c}`)}` +
      `&gcmnamespace=6&gcmlimit=500&prop=imageinfo&iiprop=url|mime&iiurlwidth=1000`,
  );
  const out: string[] = [];
  for (const p of Object.values<any>(d?.query?.pages ?? {})) {
    const ii = (p.imageinfo ?? [])[0];
    if (!ii?.mime || !/^image\/(jpeg|png|webp)$/.test(String(ii.mime))) continue;
    const t = String(p.title).replace(/^File:/, '');
    if (REJECT.test(t)) continue;
    out.push(t);
  }
  if (depth < 1) {
    const d2 = await getJson(
      `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
        `&generator=categorymembers&gcmtitle=${encodeURIComponent(`Category:${c}`)}` +
        `&gcmnamespace=14&gcmlimit=40`,
    );
    for (const p of Object.values<any>(d2?.query?.pages ?? {})) {
      const sub = String(p.title).replace(/^Category:/, '');
      out.push(...(await catFiles(sub, depth + 1)));
    }
  }
  return out;
}

async function main() {
  const res: Record<string, string[]> = {};
  for (const [pool, keys] of Object.entries(TARGETS)) {
    const all = new Set<string>();
    for (const k of keys) {
      const cats = await findCats(k);
      for (const c of cats.slice(0, 8)) {
        const files = await catFiles(c);
        console.log(`[pool] ${pool} <- ${c}: ${files.length}`);
        files.forEach((f) => all.add(f));
      }
    }
    res[pool] = [...all];
    console.log(`[pool] ${pool} tổng: ${all.size}\n`);
  }
  writeFileSync(
    resolve(process.cwd(), 'scripts/data/expanded-pools.json'),
    JSON.stringify(res, null, 2),
    'utf-8',
  );
}

void main();
