/**
 * PROBE: ảnh sản phẩm qua Wikipedia (pageimages) + Wikidata (P18).
 *
 * Wikimedia Commons search chỉ tìm TEXT trong nội dung file, bỏ sót nhiều
 * ảnh sản phẩm nổi tiếng. Wikipedia `pageimages` và Wikidata `P18` là các
 * nguồn bổ sung đáng tin cậy.
 *
 * Chạy: npx tsx scripts/probe-wiki.ts
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { getJson } from '../lib/commons-files';

interface Cand {
  title: string;
  url: string;
  via: string;
}

const PAGES = [
  'HyperX',
  'HyperX Cloud',
  'Cloud (headset)',
  'Corsair Gaming',
  'Corsair HS60',
  'List of Corsair products',
  'HyperX Cloud II',
];

async function pageImages(lang: string, page: string): Promise<Cand[]> {
  const d = await getJson(
    `https://${lang}.wikipedia.org/w/api.php?action=query&format=json` +
      `&titles=${encodeURIComponent(page)}&prop=pageimages&piprop=original|thumbnail` +
      `&pithumbsize=1000&redirects=1`,
  );
  const out: Cand[] = [];
  for (const p of Object.values<any>(d?.query?.pages ?? {})) {
    const orig = p?.original?.source;
    if (orig) out.push({ title: String(p.title), url: String(orig), via: `${lang}:pageimage` });
    const thumb = p?.thumbnail?.source;
    if (thumb && !orig) out.push({ title: String(p.title), url: String(thumb), via: `${lang}:thumb` });
  }
  return out;
}

async function wikidataImages(q: string): Promise<Cand[]> {
  const d = await getJson(
    `https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&language=en&type=item&limit=10&search=${encodeURIComponent(q)}`,
  );
  const out: Cand[] = [];
  for (const it of d?.search ?? []) {
    const label = String(it?.label ?? '');
    const desc = String(it?.description ?? '');
    if (!/headset|headphone|gaming|keyboard|electronics|hardware/i.test(`${label} ${desc}`)) continue;
    const e = await getJson(
      `https://www.wikidata.org/w/api.php?action=wbgetclaims&format=json&entity=${it.id}&property=P18`,
    );
    for (const c of e?.claims?.P18 ?? []) {
      const u = c?.mainsnak?.datavalue?.value;
      if (typeof u === 'string') {
        const fname = u.replace(/^.*\//, '');
        const info = await getJson(
          `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
            `&titles=${encodeURIComponent(`File:${fname}`)}&prop=imageinfo&iiprop=url|mime&iiurlwidth=1000`,
        );
        for (const p of Object.values<any>(info?.query?.pages ?? {})) {
          const ii = (p.imageinfo ?? [])[0];
          if (!ii?.mime || !/^image\/(jpeg|png|webp)$/.test(String(ii.mime))) continue;
          out.push({ title: fname, url: String(ii.thumburl ?? ii.url), via: `wikidata:${label}` });
        }
      }
    }
  }
  return out;
}

async function main() {
  const all: Record<string, Cand[]> = {};
  for (const page of PAGES) {
    const c = [...(await pageImages('en', page)), ...(await pageImages('de', page))];
    all[`page:${page}`] = c;
    console.log(`\n== page ${page} (${c.length})`);
    for (const x of c) console.log(`  [${x.via}] ${x.title}`);
  }
  for (const q of ['HyperX Cloud', 'Corsair HS60', 'Corsair HS80', 'HyperX Cloud Alpha']) {
    const c = await wikidataImages(q);
    all[`wd:${q}`] = c;
    console.log(`\n== wikidata ${q} (${c.length})`);
    for (const x of c) console.log(`  [${x.via}] ${x.title}`);
  }
  writeFileSync(
    resolve(process.cwd(), 'scripts/data/probe-wiki.json'),
    JSON.stringify(all, null, 2),
    'utf-8',
  );
}

void main();
