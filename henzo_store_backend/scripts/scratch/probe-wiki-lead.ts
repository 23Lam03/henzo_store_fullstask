/**
 * LẤY ẢNH CHÍNH SẢN PHẨM TỪ WIKIPEDIA/WIKIDATA (P18).
 *
 * Chiến lược: ảnh chính trên Wikipedia (lead image) là ảnh SẢN PHẨM chụp
 * riêng, chính xác nhất — tốt hơn nhiều so với ảnh trong Category (toàn ảnh
 * người dùng / sự kiện).
 *
 *   1. Wikidata: wbsearchentities -> entity -> P18 (image) -> P373/P935.
 *   2. Wikipedia (en/de/fr/es/it/ja/zh): search -> pageimages -> thumbnail.
 *
 * Chạy: npx tsx scripts/probe-wiki-lead.ts [từ khóa...]
 */
import { getJson } from '../lib/commons-files';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const LANGS = ['en', 'de', 'fr', 'es', 'it', 'ja', 'zh', 'ru', 'pl', 'nl'];

async function wikidataImages(q: string): Promise<{ title: string; url: string }[]> {
  const out: { title: string; url: string }[] = [];
  const d = await getJson(
    `https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json` +
      `&language=en&uselang=en&type=item&limit=8&search=${encodeURIComponent(q)}`,
  );
  for (const hit of d?.search ?? []) {
    const id = hit.id;
    if (!id) continue;
    const e = await getJson(
      `https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&ids=${id}` +
        `&props=claims|labels`,
    );
    const ent = e?.entities?.[id];
    if (!ent) continue;
    const p18 = ent.claims?.P18 ?? [];
    for (const c of p18) {
      const file = c.mainsnak?.datavalue?.value;
      if (typeof file !== 'string' || !file) continue;
      const title = file.replace(/^File:/, '');
      const info = await getJson(
        `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
          `&titles=${encodeURIComponent(`File:${title}`)}` +
          `&prop=imageinfo&iiprop=url|mime&iiurlwidth=1000`,
      );
      for (const p of Object.values<any>(info?.query?.pages ?? {})) {
        const ii = (p.imageinfo ?? [])[0];
        if (!ii || !/^image\/(jpeg|png|webp)$/.test(String(ii.mime))) continue;
        out.push({ title, url: String(ii.thumburl ?? ii.url) });
      }
    }
  }
  return out;
}

async function wikipediaLead(q: string): Promise<{ title: string; url: string }[]> {
  const out: { title: string; url: string }[] = [];
  for (const lang of LANGS) {
    const d = await getJson(
      `https://${lang}.wikipedia.org/w/api.php?action=query&format=json` +
        `&generator=search&gsrsearch=${encodeURIComponent(q)}` +
        `&gsrnamespace=0&gsrlimit=4&prop=pageimages&piprop=original|thumbnail&pithumbsize=1000`,
    );
    for (const p of Object.values<any>(d?.query?.pages ?? {})) {
      const orig = p.original?.source;
      const thumb = p.thumbnail?.source;
      const url = thumb ?? orig;
      if (!url) continue;
      out.push({ title: String(p.title), url });
    }
    if (out.length >= 6) break;
  }
  return out;
}

/** Model cần probe (mặc định: toàn bộ model đang có ảnh chính sai). */
async function main() {
  const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  let models: string[] = args;
  if (!models.length) {
    const audit = JSON.parse(
      readFileSync(resolve(process.cwd(), 'scripts/data/model-audit.json'), 'utf-8'),
    ) as any[];
    models = audit.filter((a) => !a.exact).map((a) => a.model);
  }

  const result: Record<string, { title: string; url: string }[]> = {};
  for (const m of models) {
    const hits = new Map<string, { title: string; url: string }>();
    for (const h of await wikidataImages(m)) hits.set(h.url, h);
    for (const h of await wikipediaLead(m)) hits.set(h.url, h);
    result[m] = [...hits.values()];
    console.log(`\n== ${m} (${result[m].length})`);
    for (const h of result[m].slice(0, 10)) console.log(`   ${h.title}\n      ${h.url}`);
    await new Promise((s) => setTimeout(s, 300));
  }

  writeFileSync(
    resolve(process.cwd(), 'scripts/data/wiki-lead-images.json'),
    JSON.stringify(result, null, 2),
    'utf-8',
  );
  console.log('\n[wiki-lead] Đã lưu wiki-lead-images.json');
}

void main();
