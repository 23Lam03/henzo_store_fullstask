import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const UA = 'henzo-store/1.0 (model image resolver; dev@henzo.local)';
const DEST = resolve(process.cwd(), 'scripts/data/type-image-pools.json');

const TYPE_QUERIES: Record<string, string[]> = {
  'Điện thoại': [
    'smartphone', 'iPhone', 'Samsung Galaxy smartphone', 'Android phone',
    'Google Pixel phone', 'Xiaomi phone', 'OnePlus smartphone', 'mobile phone back',
  ],
  Tablet: [
    'tablet computer', 'iPad', 'Galaxy Tab', 'Samsung tablet',
    'Android tablet', 'tablet device',
  ],
  Laptop: [
    'laptop computer', 'notebook computer', 'MacBook', 'gaming laptop',
    'ultrabook', 'laptop open screen',
  ],
  'Màn hình': [
    'computer monitor', 'LCD display', 'gaming monitor', 'ultrawide monitor',
    'monitor screen', 'computer display panel',
  ],
  'PC Gaming': [
    'gaming computer', 'desktop computer tower', 'graphics card',
    'solid state drive', 'computer power supply', 'DDR memory module',
    'CPU processor chip', 'computer case',
  ],
  Chuột: [
    'computer mouse', 'gaming mouse', 'wireless mouse', 'mouse on desk',
    'optical mouse',
  ],
  'Bàn phím': [
    'computer keyboard', 'mechanical keyboard', 'gaming keyboard',
    'keyboard on desk', 'RGB keyboard',
  ],
  'Tai nghe': [
    'headset', 'headphones', 'gaming headset', 'wireless headphones',
    'earphones', 'microphone headset',
  ],
  'Phụ kiện': [
    'USB-C charger', 'power bank', 'webcam', 'microphone',
    'laptop dock', 'USB hub', 'cable connector',
  ],
};

const PER_TYPE = Number(process.env.TYPE_POOL_SIZE ?? 150);

const REJECT =
  /\b(disassembl|teardown|exploded|schematic|circuit|mainboard|motherboard|logic board|pcb|chipset|module|stick|sodimm|dimm|coolant|pump|connector|cable|port|button|wheel|underneath|bottom|top view|rear view|back view|side view|inside|interior|logo|icon|diagram|chart|booth|game ?show|gamescom|comiket|esport|tournament|championship|person|people|man|woman|player|streamer|interview|autograph|crowd|audience|stage|panel|signing|museum|store|office|desk|setup|box|package|unboxing|review|comparison|boit|tokyo-game-show|faceit|homestory|hwc|esl|blast|map|graph|chart|sign|poster|screenshot)\b/i;

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

async function commonsSearch(query: string, limit = 50): Promise<{ title: string; url: string }[]> {
  const d = await getJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
      `&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(query)}` +
      `&gsrlimit=${limit}&prop=imageinfo&iiprop=url|mime&iiurlwidth=900`,
  );
  const out: { title: string; url: string }[] = [];
  for (const p of Object.values<any>(d?.query?.pages ?? {})) {
    const ii = (p.imageinfo ?? [])[0];
    if (!ii?.mime || !/^image\/(jpeg|png|webp)$/.test(ii.mime)) continue;
    out.push({
      title: String(p.title).replace(/^File:/, ''),
      url: String(ii.thumburl ?? ii.url),
    });
  }
  return out;
}

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function main() {
  const pools: Record<string, string[]> = {};
  const seen = new Set<string>();

  for (const [type, queries] of Object.entries(TYPE_QUERIES)) {
    const picked: { title: string; url: string }[] = [];
    for (const q of queries) {
      if (picked.length >= PER_TYPE) break;
      const cands = await commonsSearch(q, 60);
      for (const c of cands) {
        if (picked.length >= PER_TYPE) break;
        if (REJECT.test(c.title)) continue;
        if (seen.has(c.url)) continue;
        seen.add(c.url);
        picked.push(c);
      }
    }
    pools[type] = picked.map((c) => c.url);
    console.log(`${type.padEnd(14)} -> ${picked.length} ảnh`);
  }

  writeFileSync(DEST, JSON.stringify(pools, null, 2), 'utf-8');
  console.log(`\n[build] Đã ghi ${DEST}`);
}

void main();