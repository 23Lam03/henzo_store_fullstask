/**
 * Lấy ảnh sản phẩm thật từ Commons CATEGORY theo hãng/loại.
 *
 * Ví dụ: Category:HyperX Cloud Alpha, Category:Corsair headsets,
 *        Category:AOC monitors, Category:Zowie monitors...
 * Mỗi file trả về tên + URL thumb.
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const UA = 'henzo-store/1.0 (model image resolver; dev@henzo.local)';

async function getJson(url: string): Promise<any> {
  for (let a = 0; a < 4; a++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA } });
      if (r.status === 429 || r.status >= 500) {
        await new Promise((s) => setTimeout(s, 1500 * (a + 1)));
        continue;
      }
      if (!r.ok) return null;
      return await r.json();
    } catch {
      await new Promise((s) => setTimeout(s, 900));
    }
  }
  return null;
}

/** File trong category (không recurse). */
async function catFiles(cat: string): Promise<string[]> {
  const out: string[] = [];
  let cont: string | undefined;
  do {
    const d = await getJson(
      `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
        `&generator=categorymembers&gcmtitle=Category:${encodeURIComponent(cat)}` +
        `&gcmtype=file&gcmlimit=200${cont ? `&gcmcontinue=${encodeURIComponent(cont)}` : ''}` +
        `&prop=imageinfo&iiprop=url|mime&iiurlwidth=1000`,
    );
    for (const p of Object.values<any>(d?.query?.pages ?? {})) {
      const ii = (p.imageinfo ?? [])[0];
      if (!ii?.mime || !/^image\/(jpeg|png|webp)$/.test(ii.mime)) continue;
      out.push(String(p.title).replace(/^File:/, ''));
    }
    cont = d?.continue?.gcmcontinue;
  } while (cont && out.length < 600);
  return out;
}

/** Sub-category con. */
async function subCats(cat: string): Promise<string[]> {
  const d = await getJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
      `&list=categorymembers&cmtitle=Category:${encodeURIComponent(cat)}` +
      `&cmtype=subcat&cmlimit=100`,
  );
  return (d?.query?.categorymembers ?? []).map((c: any) => c.title.replace(/^Category:/, ''));
}

/** Tìm category qua search. */
async function findCats(q: string): Promise<string[]> {
  const d = await getJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
      `&list=search&srsearch=${encodeURIComponent(q)}&srnamespace=14&srlimit=20`,
  );
  return (d?.query?.search ?? []).map((s: any) => s.title.replace(/^Category:/, ''));
}

const ROOTS = [
  'HyperX Cloud Alpha', 'HyperX Cloud III', 'HyperX Cloud', 'HyperX headsets',
  'Corsair headsets', 'Corsair HS series', 'Corsair Xeneon', 'Corsair mice',
  'AOC monitors', 'AOC AGON monitors', 'Corsair components',
  'Zowie monitors', 'BenQ Zowie', 'ViewSonic monitors', 'LG UltraGear',
  'Samsung Odyssey monitors', 'Gigabyte monitors', 'Lenovo Legion monitors',
  'HP Omen', 'Razer monitors', 'Razer microphones', 'Seagate FireCuda',
  'Kingston FURY', 'Samsung Odyssey Neo G9', 'Samsung Galaxy Book',
  'ASUS ROG mice', 'AirPods', 'Endgame Gear', 'JBL Quantum',
];

async function main() {
  const out: Record<string, string[]> = {};
  const cats = new Set<string>();
  for (const r of ROOTS) {
    cats.add(r);
    for (const c of await findCats(r)) cats.add(c);
  }
  console.log(`[cats] ${cats.size} category`);

  const all = new Set<string>();
  for (const c of cats) {
    const files = await catFiles(c);
    files.forEach((f) => all.add(f));
    if (files.length) console.log(`  ${c}: ${files.length}`);
  }
  out.__all = [...all];
  writeFileSync(
    resolve(process.cwd(), 'scripts/data/category-product-files.json'),
    JSON.stringify(out, null, 2),
    'utf-8',
  );
  console.log(`[done] ${all.size} file`);
}

void main();
