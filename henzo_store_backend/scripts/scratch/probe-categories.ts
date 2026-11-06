/**
 * Liệt kê file trong các Commons category để tìm ảnh SẢN PHẨM THẬT.
 *
 * Chạy: npx tsx scripts/probe-categories.ts
 */
import { getJson } from '../lib/commons-files';

const CATS = [
  'Gaming headsets',
  'Corsair headsets',
  'HyperX headsets',
  'Corsair',
  'HyperX',
  'Corsair keyboards',
  'Headsets',
  'Computer headsets',
];

async function members(cat: string) {
  const d = await getJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
      `&generator=categorymembers&gcmtitle=${encodeURIComponent(`Category:${cat}`)}` +
      `&gcmnamespace=6&gcmlimit=500&prop=imageinfo&iiprop=url|mime&iiurlwidth=1000`,
  );
  const out: string[] = [];
  for (const p of Object.values<any>(d?.query?.pages ?? {})) {
    const ii = (p.imageinfo ?? [])[0];
    if (!ii?.mime || !/^image\/(jpeg|png|webp)$/.test(String(ii.mime))) continue;
    out.push(String(p.title).replace(/^File:/, ''));
  }
  return out;
}

async function main() {
  for (const c of CATS) {
    const m = await members(c);
    console.log(`\n===== Category:${c} (${m.length}) =====`);
    for (const t of m) console.log(`  ${t}`);
  }
}

void main();
