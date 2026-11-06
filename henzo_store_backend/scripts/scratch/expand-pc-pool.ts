/**
 * Bổ sung pool ảnh PC/case thật (không phải Raspberry Pi) bằng search
 * Commons theo tên hãng case + dòng sản phẩm.
 *
 * Chạy: npx tsx scripts/expand-pc-pool.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { getJson } from '../lib/commons-files';

const QUERIES = [
  'custom gaming PC', 'gaming computer tower', 'desktop PC case',
  'Phanteks case', 'Lian Li case', 'Cooler Master case', 'Thermaltake case',
  'Nzxt case', 'Fractal Design case', 'Corsair case', 'Antec case',
  'Alienware desktop', 'Dell XPS tower', 'HP Omen desktop',
  'Lenovo Legion desktop', 'Asus ROG desktop', 'MSI gaming desktop',
  'Acer Predator desktop', 'gaming PC build', 'desktop computer white',
];

const REJECT =
  /\b(disassembl|teardown|exploded|schematic|circuit|mainboard|motherboard|logic ?board|pcb|chipset|logo|icon|diagram|chart|booth|gamescom|comiket|esl|blast|person|people|man|woman|player|streamer|interview|autograph|crowd|audience|stage|signing|museum|store|office|desk|setup|box|package|unboxing|review|comparison|boit|tokyo-game-show|faceit|homestory|hwc|poster|banner|advert|swatch|book|cover|map|screenshot|interface|menu|wallpaper|blueprint|patent|drawing|holding|hand|hands|raspberry|pi |pi\.|microbit|arduino|screw|bolt|bracket|poweredge|server|scrap|trash|bin\b|recycl|dumpster|industrial|robot|machine|drill|printer|scanner|sinumerik|factory|warehouse|shelf|drawer)\b/i;

const KEEP = [
  'front', 'back', 'rear', 'side', 'top', 'view', 'angle', 'angled', 'oblique',
  'case', 'tower', 'desktop', 'computer', 'pc ', 'pc.', 'pc-', 'chassis',
  'gaming', 'custom', 'build', 'system', 'workstation', 'mini', 'atx',
  'midi', 'itx', 'silicon', 'avadi', 'falcon', 'phanteks', 'lian', 'nzxt',
  'fractal', 'cooler master', 'thermaltake', 'antec', 'aerocool', 'corsair',
  'alienware', 'omen', 'xps', 'legion', 'predator', 'radeon', 'rtx', 'gpu',
  'graphics card', 'motherboard', 'thunderbolt', 'cm ', 'tt ',
];

async function search(q: string): Promise<string[]> {
  const d = await getJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
      `&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(q)}` +
      `&gsrlimit=40&prop=imageinfo&iiprop=url|mime&iiurlwidth=1000`,
  );
  const out: string[] = [];
  for (const p of Object.values<any>(d?.query?.pages ?? {})) {
    const ii = (p.imageinfo ?? [])[0];
    if (!ii?.mime || !/^image\/(jpeg|png|webp)$/.test(String(ii.mime))) continue;
    const t = String(p.title).replace(/^File:/, '');
    if (REJECT.test(t)) continue;
    if (!KEEP.some((k) => t.toLowerCase().includes(k))) continue;
    out.push(t);
  }
  return out;
}

async function main() {
  const all = new Set<string>();
  for (const q of QUERIES) {
    const r = await search(q);
    console.log(`[pc] ${q}: ${r.length}`);
    r.forEach((x) => all.add(x));
  }
  console.log(`[pc] tổng: ${all.size}`);

  const path = resolve(process.cwd(), 'scripts/data/expanded-pools.json');
  const pools = JSON.parse(readFileSync(path, 'utf-8')) as Record<string, string[]>;
  pools.PC_CASE = [...new Set([...(pools.PC_CASE ?? []), ...all])];
  writeFileSync(path, JSON.stringify(pools, null, 2), 'utf-8');
}

void main();
