import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const UA = 'henzo-store/1.0 (brand logo resolver; dev@henzo.local)';

const BRANDS: Record<string, string[]> = {
  Logitech: ['Logitech logo', 'Logitech'],
  Microsoft: ['Microsoft logo', 'Microsoft'],
  Keychron: ['Keychron logo', 'Keychron'],
  ViewSonic: ['ViewSonic logo', 'ViewSonic'],
  Philips: ['Philips logo', 'Philips'],
  Gigabyte: ['Gigabyte logo', 'Gigabyte Technology'],
  Realme: ['Realme logo', 'Realme'],
  Tecno: ['Tecno logo', 'Tecno Mobile'],
  BenQ: ['BenQ logo', 'BenQ'],
  AOC: ['AOC logo', 'AOC International'],
  ROCCAT: ['ROCCAT logo', 'Roccat'],
  'Endgame Gear': ['Endgame Gear logo', 'Endgame Gear'],
  'G.Skill': ['G.Skill logo', 'G.Skill'],
  Crucial: ['Crucial logo', 'Crucial Technology'],
  'Western Digital': ['Western Digital logo', 'Western Digital'],
  LG: ['LG logo', 'LG Corporation'],
  Custom: ['Computer icon', 'Personal computer'],
  Seagate: ['Seagate Technology logo', 'Seagate'],
  Wacom: ['Wacom logo', 'Wacom'],
  Toshiba: ['Toshiba logo', 'Toshiba'],
  Kingston: ['Kingston Technology logo', 'Kingston Technology'],
  Microsoft_: [],
};

function scoreFile(title: string, brand: string): number {
  const t = title.toLowerCase();
  let s = 0;
  if (t.includes('logo')) s += 10;
  if (t.includes(brand.toLowerCase().split(' ')[0])) s += 5;
  if (t.endsWith('.svg')) s += 3;
  if (t.includes('wordmark')) s += 2;
  if (t.includes('icon')) s -= 2;
  if (t.includes('building') || t.includes('headquarters')) s -= 3;
  return s;
}

async function search(query: string): Promise<Array<{ title: string; url: string }>> {
  const url =
    `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
    `&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(query)}` +
    `&gsrlimit=12&prop=imageinfo&iiprop=url|mime&iiurlwidth=400`;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } });
      if (res.status === 429) {
        await new Promise((r) => setTimeout(r, 2500 * (attempt + 1)));
        continue;
      }
      if (!res.ok) return [];
      const data: any = await res.json();
      const pages = data?.query?.pages ?? {};
      const out: Array<{ title: string; url: string }> = [];
      for (const v of Object.values<any>(pages)) {
        const ii = (v.imageinfo ?? [])[0];
        if (!ii) continue;
        const u: string = ii.thumburl ?? ii.url;
        if (!u) continue;
        out.push({ title: String(v.title ?? ''), url: u });
      }
      return out;
    } catch {
      await new Promise((r) => setTimeout(r, 1200));
    }
  }
  return [];
}

async function main() {
  const result: Record<string, { title: string; url: string } | null> = {};

  for (const [brand, queries] of Object.entries(BRANDS)) {
    if (!queries.length) continue;
    let best: { title: string; url: string } | null = null;
    let bestScore = -999;

    for (const q of queries) {
      const hits = await search(q);
      for (const h of hits) {
        const s = scoreFile(h.title, brand);
        if (s > bestScore) {
          bestScore = s;
          best = h;
        }
      }
      if (best && bestScore >= 15) break;
    }

    let ok = false;
    if (best) {
      const res = await fetch(best.url, {
        method: 'HEAD',
        headers: { 'User-Agent': UA },
      }).catch(() => null);
      ok = !!res && res.status === 200;
    }

    result[brand] = ok ? best : null;
    console.log(
      `${ok ? '✓' : '✗'} ${brand.padEnd(18)} score=${String(bestScore).padStart(3)} ` +
        `${best?.title ?? ''}`,
    );
    if (ok) console.log(`     ${best!.url}`);
    await new Promise((r) => setTimeout(r, 350));
  }

  const out = resolve(process.cwd(), 'scripts/data/brand-logos.json');
  writeFileSync(out, JSON.stringify(result, null, 2), 'utf-8');
  console.log(`\n[logos] -> ${out}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
