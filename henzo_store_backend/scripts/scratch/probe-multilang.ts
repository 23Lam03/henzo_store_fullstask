import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { getJson } from '../lib/commons-files';

const LANGS = ['de', 'es', 'fr', 'it', 'ru', 'ja', 'pt', 'pl', 'nl', 'cs', 'sv', 'fi'];
const TERMS = [
  'HyperX Cloud',
  'HyperX',
  'Corsair HS60',
  'Corsair Gaming',
  'Corsair K100',
  'Zowie XL2566K',
  'Zowie',
  'Razer Raptor',
  'ViewSonic ColorPro',
  'LG UltraGear',
  'Seagate FireCuda',
  'Gigabyte M34WMU',
  'Lenovo Legion R32',
  'Acer Nitro XR273',
  'AOC CU34G2X',
  'Corsair Xeneon',
  'Endgame Gear',
  'Sony WH-1000XM5',
  'Sony WF-1000XM5',
];

interface Hit {
  lang: string;
  page: string;
  file: string;
  url: string;
}

async function pageImages(lang: string, page: string): Promise<Hit[]> {
  const d = await getJson(
    `https://${lang}.wikipedia.org/w/api.php?action=query&format=json` +
      `&titles=${encodeURIComponent(page)}&prop=pageimages&piprop=original&redirects=1`,
  );
  const out: Hit[] = [];
  for (const p of Object.values<any>(d?.query?.pages ?? {})) {
    const orig = p?.original?.source;
    if (!orig) continue;
    out.push({ lang, page: String(p.title), file: orig.split('/').pop() ?? '', url: String(orig) });
  }
  return out;
}

async function searchPages(lang: string, q: string): Promise<string[]> {
  const d = await getJson(
    `https://${lang}.wikipedia.org/w/api.php?action=query&format=json&list=search` +
      `&srsearch=${encodeURIComponent(q)}&srlimit=6`,
  );
  return (d?.query?.search ?? []).map((x: any) => String(x.title));
}

async function main() {
  const hits: Hit[] = [];
  const seen = new Set<string>();
  for (const term of TERMS) {
    for (const lang of LANGS) {
      const pages = await searchPages(lang, term);
      for (const p of pages.slice(0, 4)) {
        for (const h of await pageImages(lang, p)) {
          if (seen.has(h.file)) continue;
          seen.add(h.file);
          hits.push(h);
          console.log(`  ${lang}:${p}  ->  ${h.file}`);
        }
      }
    }
  }
  writeFileSync(
    resolve(process.cwd(), 'scripts/data/probe-multilang.json'),
    JSON.stringify(hits, null, 2),
    'utf-8',
  );
  console.log(`\nTổng: ${hits.length}`);
}

void main();
