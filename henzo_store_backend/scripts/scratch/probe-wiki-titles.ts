/**
 * DÒ ẢNH THẬT QUA WIKIPEDIA (title trực tiếp) + WIKIDATA (P18).
 *
 * - Wikipedia: thử tên bài cụ thể (redirects) -> lấy ảnh + tên file Commons.
 * - Wikidata: wbsearchentities -> P18 (ảnh) -> Commons.
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const UA = 'henzo-store/1.0 (model image resolver; dev@henzo.local)';

async function getJson(url: string): Promise<any> {
  for (let a = 0; a < 4; a++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA } });
      if (r.status === 429 || r.status >= 500) {
        await new Promise((s) => setTimeout(s, 1200 * (a + 1)));
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

/** Tên bài có thể có trên Wikipedia (en + de). */
const TITLES: Record<string, string[]> = {
  'AOC CU34G2X 34in': ['AOC CU34G2X', 'AGON CU34G2X'],
  'ASUS ROG Harpe Ace Aim Lab Edition': ['ROG Harpe Ace', 'Asus ROG Harpe Ace'],
  'Corsair HS60 Wireless': ['Corsair HS60', 'HS60'],
  'Corsair HS60 Wireless Carbon': ['Corsair HS60'],
  'Corsair HS80 RGB USB': ['Corsair HS80', 'HS80'],
  'Corsair HS80 RGB USB Carbon': ['Corsair HS80'],
  'Corsair Xeneon 27QHD240 27in': ['Corsair Xeneon', 'Xeneon'],
  'Endgame Gear XM2we Wireless': ['Endgame Gear XM2', 'XM2we'],
  'Gigabyte M34WMU 34in': ['M34WMU', 'Gigabyte M34WMU'],
  'HP Omen 27qs 27in': ['HP Omen 27', 'OMEN 27'],
  'HP Omen 27qs 27in QHD': ['HP Omen 27'],
  'HP Spectre x360 16-f2005TU': ['HP Spectre x360 16', 'HP Spectre x360'],
  'HyperX Cloud Alpha Wireless Red': ['HyperX Cloud Alpha', 'Cloud Alpha'],
  'HyperX Cloud III Wireless': ['HyperX Cloud III'],
  'HyperX Cloud III Wireless Red': ['HyperX Cloud III'],
  'HyperX Cloud Alpha Wireless': ['HyperX Cloud Alpha'],
  'JBL Quantum 910 Wireless': ['JBL Quantum 910', 'JBL Quantum'],
  'Kingston FURY Renegade': ['Kingston FURY Renegade', 'Kingston FURY'],
  'Lenovo Legion R32fc-30 32in': ['Lenovo Legion R32fc-30', 'Legion R32fc-30'],
  'Lenovo Legion R32fc-30 32in FHD': ['Lenovo Legion R32fc-30'],
  'LG UltraGear 27GR95QE 27in': ['LG UltraGear 27GR95QE', '27GR95QE'],
  'LG UltraGear 27GR95QE 27in OLED': ['LG UltraGear 27GR95QE'],
  'LG UltraGear 32GP950 32in': ['LG UltraGear 32GP950', '32GP950'],
  'Razer Seiren V2 Pro': ['Razer Seiren V2', 'Seiren V2'],
  'Razer Raptor 27in': ['Razer Raptor 27', 'Razer Raptor'],
  'Razer Raptor 27in 2K Tổng hợp': ['Razer Raptor 27'],
  'Samsung Galaxy Book4 Ultra 16in': ['Samsung Galaxy Book4 Ultra', 'Galaxy Book4'],
  'Samsung Odyssey G9 34in': ['Samsung Odyssey G9', 'Odyssey G9'],
  'Seagate FireCuda 530': ['Seagate FireCuda 530', 'FireCuda'],
  'ViewSonic ColorPro VP3200-3K 32in': ['ViewSonic ColorPro VP3200-3K'],
  'ViewSonic XG272-2K-OLED 27in': ['ViewSonic XG272-2K-OLED'],
  'ViewSonic XG272-2K-OLED 27in Gaming': ['ViewSonic XG272-2K-OLED'],
  'Zowie XL2546X 24.5in': ['Zowie XL2546X'],
  'Zowie XL2546X 24.5in eSports': ['Zowie XL2546X'],
  'Zowie XL2566K 27in': ['Zowie XL2566K'],
  'AMD Ryzen 9 7950X3D': ['Ryzen 9 7950X3D', 'AMD Ryzen 9'],
  'AirPods 4 ANC Deep': ['AirPods 4'],
  'AirPods Pro 2 USB-C Deep': ['AirPods Pro 2'],
  'Samsung Galaxy Tab S9': ['Samsung Galaxy Tab S9'],
};

const WIKILANGS = ['en', 'de'];

/** Tra cứu bài Wikipedia theo title, lấy ảnh + tên file Commons. */
async function wikiByTitle(title: string, lang: string) {
  const d = await getJson(
    `https://${lang}.wikipedia.org/w/api.php?action=query&format=json` +
      `&titles=${encodeURIComponent(title)}&redirects=1` +
      `&prop=pageimages&piprop=thumbnail|name&pithumbsize=1000`,
  );
  if (!d?.query?.pages) return null;
  const p = Object.values<any>(d.query.pages)[0];
  if (!p || p.missing !== undefined) return null;
  if (!p.thumbnail?.source && !p.pageimage) return null;
  const name = p.pageimage ?? null;
  let file: string | null = null;
  if (name) {
    const c = await getJson(
      `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
        `&titles=${encodeURIComponent(`File:${name}`)}&prop=imageinfo&iiprop=url|mime&iiurlwidth=1000`,
    );
    const cp = Object.values<any>(c?.query?.pages ?? {})[0];
    const ii = (cp?.imageinfo ?? [])[0];
    if (ii && /^image\/(jpeg|png|webp|tiff)$/.test(String(ii.mime))) {
      file = String(cp.title).replace(/^File:/, '');
    }
  }
  return { title: String(p.title), file, url: p.thumbnail?.source ?? null };
}

/** Wikidata: tìm entity + P18. */
async function wikidataP18(query: string) {
  const d = await getJson(
    `https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json` +
      `&language=en&limit=6&search=${encodeURIComponent(query)}`,
  );
  const out: string[] = [];
  for (const x of d?.search ?? []) {
    const id = String(x.id);
    const e = await getJson(
      `https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&ids=${id}` +
        `&props=claims|labels`,
    );
    const ent = e?.entities?.[id];
    const label = String(ent?.labels?.en?.value ?? '');
    const p18 = (ent?.claims?.P18 ?? [])
      .map((c: any) => String(c.mainsnak?.datavalue?.value ?? ''))
      .filter(Boolean);
    out.push(`${id} "${label}" -> ${p18.join(' | ') || '-'}`);
  }
  return out;
}

async function main() {
  const out: Record<string, any> = {};
  const queue = Object.entries(TITLES);
  const workers = Array.from({ length: 5 }, async () => {
    while (queue.length) {
      const [model, titles] = queue.shift()!;
      const hits: any[] = [];
      for (const lang of WIKILANGS) {
        for (const t of titles) {
          const h = await wikiByTitle(t, lang);
          if (h) hits.push({ lang, ...h });
        }
      }
      const wd = await wikidataP18(model.replace(/\s+\d+(\.\d+)?in\b/i, '').trim());
      out[model] = { hits, wikidata: wd };
      console.log(`\n### ${model}`);
      for (const h of hits) console.log(`   [${h.lang}] ${h.title} :: ${h.file ?? h.url}`);
      for (const w of wd) console.log(`   WD ${w}`);
    }
  });
  await Promise.all(workers);
  writeFileSync(
    resolve(process.cwd(), 'scripts/data/wiki-title-probe.json'),
    JSON.stringify(out, null, 2),
    'utf-8',
  );
  console.log('\n[done]');
}

void main();
