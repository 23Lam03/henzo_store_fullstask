/**
 * Tìm ảnh sản phẩm cho các model còn thiếu qua nhiều nguồn:
 *  - Wikipedia (en + các ngôn ngữ khác) pageimages & media-list
 *  - Commons category đệ quy (Category:Corsair (brand) -> subcategory)
 *  - Commons search với bộ lọc filetype
 *
 * Chạy: npx tsx scripts/find-missing-images.ts
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { modelName } from './lib/model-name';

const UA = 'henzo-store/1.0 (model image resolver; dev@henzo.local)';

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

/** Ảnh trong media-list của 1 trang Wikipedia (bất kỳ ngôn ngữ). */
async function wikiMedia(page: string, lang = 'en') {
  const d = await getJson(
    `https://${lang}.wikipedia.org/api/rest_v1/page/media-list/${encodeURIComponent(page)}`,
  );
  const out: string[] = [];
  for (const it of d?.items ?? []) {
    if (it?.type !== 'image') continue;
    const t = String(it.title ?? '');
    if (/vector|logo|icon|diagram|chart|screenshot|graph|\.svg$/i.test(t)) continue;
    out.push(t);
  }
  return out;
}

/** Tìm trang Wikipedia liên quan (en). */
async function wikiSearch(q: string) {
  const d = await getJson(
    `https://en.wikipedia.org/w/api.php?action=query&format=json&list=search` +
      `&srsearch=${encodeURIComponent(q)}&srlimit=8`,
  );
  return (d?.query?.search ?? []).map((x: any) => String(x.title));
}

/** Sub-category của 1 category Commons. */
async function subCats(cat: string) {
  const d = await getJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
      `&list=categorymembers&cmtitle=${encodeURIComponent(`Category:${cat}`)}` +
      `&cmtype=subcat&cmlimit=50`,
  );
  return (d?.query?.categorymembers ?? []).map((x: any) => String(x.title));
}

/** File trong 1 category Commons (đệ quy, giới hạn chiều sâu). */
async function catFiles(cat: string, depth = 2, max = 80): Promise<string[]> {
  const d = await getJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
      `&list=categorymembers&cmtitle=${encodeURIComponent(`Category:${cat}`)}` +
      `&cmtype=file&cmlimit=100`,
  );
  const files = (d?.query?.categorymembers ?? []).map((x: any) => String(x.title));
  if (depth > 0) {
    const subs = await subCats(cat);
    for (const s of subs.slice(0, 6)) {
      const name = s.replace(/^Category:/i, '');
      const f = await catFiles(name, depth - 1, max);
      for (const x of f) if (!files.includes(x)) files.push(x);
      if (files.length >= max) break;
    }
  }
  return files.slice(0, max);
}

async function main() {
  const mock = JSON.parse(
    readFileSync(resolve(process.cwd(), 'scripts/data/frontend-mock.json'), 'utf-8'),
  );
  const dest = resolve(process.cwd(), 'scripts/data/model-images.json');
  const images: Record<string, any> = existsSync(dest)
    ? JSON.parse(readFileSync(dest, 'utf-8'))
    : {};

  const all = [
    ...(mock.products as any[]),
    ...((mock.sellerProducts ?? []) as any[]),
  ];
  const byModel = new Map<string, { brand: string; categoryName: string }>();
  for (const p of all) {
    const m = modelName(p.name);
    if (!byModel.has(m)) {
      byModel.set(m, { brand: p.brand, categoryName: p.categoryName ?? '' });
    }
  }

  const missing = [...byModel.keys()]
    .filter((m) => !images[m]?.images?.length)
    .sort();

  console.log(`THIẾU: ${missing.length} model\n`);

  for (const m of missing) {
    const info = byModel.get(m)!;
    console.log(`\n########## ${m}  [${info.brand} | ${info.categoryName}]`);

    // A) Trang Wikipedia khớp tên.
    const titles = await wikiSearch(m);
    for (const t of titles.slice(0, 3)) {
      const files = await wikiMedia(t);
      const good = files.filter((f) =>
        /headset|headphone|mouse|keyboard|ssd|drive|wireless/i.test(f),
      );
      console.log(`  WIKI "${t}" -> ${good.length ? good.slice(0, 4).join(' | ') : '(không có ảnh SP)'}`);
    }

    // B) Category Commons theo tên model / dòng.
    for (const cat of [m, m.replace(/\s+(Wireless|Carbon|Red)$/i, '')]) {
      const f = await catFiles(cat, 1);
      if (f.length) {
        console.log(`  CAT "${cat}" -> ${f.slice(0, 5).join(' | ')}`);
      }
    }

    // C) Category Commons theo hãng (đệ quy).
    const brandCat = info.brand === 'HyperX' ? 'HyperX' : `${info.brand} (brand)`;
    const bf = await catFiles(brandCat, 2, 60);
    const good = bf.filter((f) => {
      const low = f.toLowerCase();
      if (/logo|booth|game show|gamescom|headquarters/i.test(low)) return false;
      const typeRe =
        info.categoryName === 'Tai nghe'
          ? /headset|headphone|cloud|hs\d|arctis/
          : info.categoryName === 'Chuột'
            ? /mouse|m\d{2}|kronos|viper|basilisk/
            : /ssd|drive|t500|p3|storage|memory/;
      return typeRe.test(low);
    });
    console.log(`  BRANDCAT "${brandCat}" (${bf.length}) -> ${good.length ? good.slice(0, 6).join(' | ') : '(không có)'}`);
  }
}
void main();
