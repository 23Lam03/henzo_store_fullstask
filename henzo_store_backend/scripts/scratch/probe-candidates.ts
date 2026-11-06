import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { getJson } from '../lib/commons-files';

interface Cand {
  title: string;
  url: string;
  via: string;
}

async function cSearch(q: string, limit = 30, via = 'search'): Promise<Cand[]> {
  const d = await getJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
      `&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(q)}` +
      `&gsrlimit=${limit}&prop=imageinfo&iiprop=url|mime&iiurlwidth=1000`,
  );
  const out: Cand[] = [];
  for (const p of Object.values<any>(d?.query?.pages ?? {})) {
    const ii = (p.imageinfo ?? [])[0];
    if (!ii?.mime || !/^image\/(jpeg|png|webp)$/.test(String(ii.mime))) continue;
    out.push({
      title: String(p.title ?? '').replace(/^File:/, ''),
      url: String(ii.thumburl ?? ii.url),
      via,
    });
  }
  return out;
}

async function cCategory(cat: string): Promise<Cand[]> {
  const d = await getJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
      `&generator=categorymembers&gcmtitle=${encodeURIComponent(`Category:${cat}`)}` +
      `&gcmnamespace=6&gcmlimit=100&prop=imageinfo&iiprop=url|mime&iiurlwidth=1000`,
  );
  const out: Cand[] = [];
  for (const p of Object.values<any>(d?.query?.pages ?? {})) {
    const ii = (p.imageinfo ?? [])[0];
    if (!ii?.mime || !/^image\/(jpeg|png|webp)$/.test(String(ii.mime))) continue;
    out.push({
      title: String(p.title ?? '').replace(/^File:/, ''),
      url: String(ii.thumburl ?? ii.url),
      via: `cat:${cat}`,
    });
  }
  return out;
}

async function main() {
  const specFile = process.argv[2];
  const spec = JSON.parse(
    readFileSync(resolve(process.cwd(), specFile), 'utf-8'),
  ) as Record<string, { brand: string; queries: string[]; categories?: string[] }>;

  const report: Record<string, Cand[]> = {};
  for (const [model, s] of Object.entries(spec)) {
    const all: Cand[] = [];
    const seen = new Set<string>();
    const push = (list: Cand[]) => {
      for (const c of list) {
        if (seen.has(c.title)) continue;
        seen.add(c.title);
        all.push(c);
      }
    };
    for (const q of s.queries) push(await cSearch(q, 30, `q:${q}`));
    for (const c of s.categories ?? []) push(await cCategory(c));
    report[model] = all;
    console.log(`\n===== ${model} (${all.length}) =====`);
    for (const c of all.slice(0, 40)) console.log(`  [${c.via}] ${c.title}`);
  }
  writeFileSync(
    resolve(process.cwd(), 'scripts/data/probe-candidates.json'),
    JSON.stringify(report, null, 2),
    'utf-8',
  );
}

void main();
