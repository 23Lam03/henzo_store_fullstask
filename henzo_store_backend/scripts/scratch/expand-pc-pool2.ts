import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { getJson } from '../lib/commons-files';

const CATS = [
  'Gaming computers',
  'Computer cases',
  'Desktop computers',
  'ATX computer cases',
  'Personal computers',
  'Computer towers',
  'Microcomputers',
  'Computer cases by manufacturer',
  'Gaming computers by manufacturer',
  'Custom computers',
  'Computer case modding',
  'System76 Thelio Prime',
  'ASUS TUF Gaming',
  'Computer enclosures',
  'Water cooling',
];

const REJECT =
  /\b(disassembl|teardown|exploded|schematic|circuit|mainboard|motherboard|logic ?board|pcb|chipset|logo|icon|diagram|chart|booth|gamescom|comiket|person|people|man|woman|player|streamer|interview|crowd|audience|stage|museum|store|office|desk|setup|box|package|unboxing|review|comparison|tokyo-game-show|raspberry|pi |pi\.|screw|bolt|bracket|poweredge|server|scrap|trash|bin\b|zipper|storage bag|palm ?top|8088|ibm |commodore|handheld|floppy|holding|hand|hands)\b/i;

const KEEP =
  /case|tower|desktop|computer|gaming|custom|build|chassis|workstation|gaming ?pc|system|predator|omen|alienware|legion|rog |rtx|radeon|graphics ?card|motherboard/i;

async function cat(c: string): Promise<string[]> {
  const d = await getJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
      `&generator=categorymembers&gcmtitle=${encodeURIComponent(`Category:${c}`)}` +
      `&gcmnamespace=6&gcmlimit=400&prop=imageinfo&iiprop=url|mime&iiurlwidth=1000`,
  );
  const out: string[] = [];
  for (const p of Object.values<any>(d?.query?.pages ?? {})) {
    const ii = (p.imageinfo ?? [])[0];
    if (!ii?.mime || !/^image\/(jpeg|png|webp)$/.test(String(ii.mime))) continue;
    const t = String(p.title).replace(/^File:/, '');
    if (REJECT.test(t)) continue;
    if (!KEEP.test(t)) continue;
    out.push(t);
  }
  return out;
}

async function main() {
  const all = new Set<string>();
  for (const c of CATS) {
    const r = await cat(c);
    console.log(`[pc2] ${c}: ${r.length}`);
    r.forEach((x) => all.add(x));
  }
  console.log(`[pc2] tổng: ${all.size}`);

  const path = resolve(process.cwd(), 'scripts/data/expanded-pools.json');
  const pools = JSON.parse(readFileSync(path, 'utf-8')) as Record<string, string[]>;
  pools.PC_CASE = [...new Set([...(pools.PC_CASE ?? []), ...all])];
  writeFileSync(path, JSON.stringify(pools, null, 2), 'utf-8');
}

void main();
