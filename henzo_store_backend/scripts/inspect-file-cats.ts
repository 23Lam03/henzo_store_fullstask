/**
 * KIỂM TRA CATEGORY + MÔ TẢ CỦA FILE COMMONS (dùng để lọc ảnh sản phẩm).
 *
 * Chạy: npx tsx scripts/inspect-file-cats.ts <file1> <file2> ...
 */
import { getJson } from './lib/commons-files';

async function main() {
  const titles = process.argv.slice(2);
  const d = await getJson(
    'https://commons.wikimedia.org/w/api.php?action=query&format=json' +
      '&prop=imageinfo|categories&cllimit=100&iiprop=extmetadata|url' +
      '&titles=' +
      encodeURIComponent(titles.map((t) => `File:${t}`).join('|')),
  );
  for (const p of Object.values<any>(d?.query?.pages ?? {})) {
    console.log(`\n## ${p.title}`);
    const ii = (p.imageinfo ?? [])[0];
    const meta = ii?.extmetadata ?? {};
    const desc = meta.ImageDescription?.value ?? meta.ObjectName?.value ?? '';
    console.log(`   desc: ${String(desc).replace(/<[^>]+>/g, ' ').slice(0, 220)}`);
    const cats = (p.categories ?? []).map((c: any) => c.title.replace(/^Category:/, ''));
    console.log(`   cats: ${cats.slice(0, 18).join(' | ')}`);
  }
}

void main();
