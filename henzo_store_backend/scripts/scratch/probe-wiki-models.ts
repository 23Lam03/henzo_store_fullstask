/**
 * TÌM ẢNH SẢN PHẨM QUA WIKIPEDIA (en) + WIKIDATA.
 *
 * Nhiều model không có ảnh riêng trên Commons nhưng có bài viết Wikipedia
 * (hoặc mục Wikidata) với ảnh sản phẩm. Script này:
 *   1. search enwiki theo tên/code model -> lấy pageimages (original)
 *   2. search wikidata theo tên -> lấy P18 (image)
 *   3. search commons insource/intitle với code
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

/** Ảnh bài viết Wikipedia (en). */
async function wikiImages(title: string): Promise<any[]> {
  const d = await getJson(
    `https://en.wikipedia.org/w/api.php?action=query&format=json&titles=${encodeURIComponent(title)}` +
      `&prop=pageimages|images&piprop=original&imlimit=20&pilicense=any`,
  );
  const out: any[] = [];
  for (const p of Object.values<any>(d?.query?.pages ?? {})) {
    if (p.original?.source) {
      out.push({ title: `${p.title} (lead)`, url: p.original.source });
    }
    for (const im of p.images ?? []) {
      if (/^(File|Image):/i.test(im.title)) {
        out.push({ title: String(im.title).replace(/^File:/, ''), url: '' });
      }
    }
  }
  return out;
}

async function wikiSearch(q: string): Promise<any[]> {
  const d = await getJson(
    `https://en.wikipedia.org/w/api.php?action=query&format=json&list=search` +
      `&srsearch=${encodeURIComponent(q)}&srlimit=8&srnamespace=0`,
  );
  return (d?.query?.search ?? []).map((s: any) => ({
    title: s.title,
    snippet: String(s.snippet ?? '').replace(/<[^>]+>/g, '').slice(0, 120),
  }));
}

/** P18 của Wikidata item. */
async function wikidataImages(query: string): Promise<any[]> {
  const d = await getJson(
    `https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json` +
      `&language=en&type=item&limit=8&search=${encodeURIComponent(query)}`,
  );
  const items = (d?.search ?? []) as any[];
  const out: any[] = [];
  for (const it of items) {
    const e = await getJson(
      `https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&ids=${it.id}` +
        `&props=claims|labels&languages=en`,
    );
    const claims = e?.entities?.[it.id]?.claims ?? {};
    const p18 = claims.P18 ?? [];
    const p373 = (claims.P373 ?? [])[0]?.mainsnak?.datavalue?.value;
    out.push({
      title: it.label ?? it.id,
      id: it.id,
      p18: p18.map((c: any) => c.mainsnak?.datavalue?.value).filter(Boolean),
      commonsCat: p373 ?? null,
    });
  }
  return out;
}

const TARGETS: Record<string, string[]> = {
  'AOC CU34G2X 34in': ['CU34G2X', 'AOC CU34G2X'],
  'ASUS ROG Harpe Ace Aim Lab Edition': ['ROG Harpe Ace', 'ASUS Harpe'],
  'Corsair HS60 Wireless': ['HS60', 'Corsair HS60'],
  'Corsair HS60 Wireless Carbon': ['HS60 Carbon'],
  'Corsair HS80 RGB USB': ['HS80', 'Corsair HS80'],
  'Corsair HS80 RGB USB Carbon': ['HS80 Carbon'],
  'Corsair Xeneon 27QHD240 27in': ['Xeneon 27QHD240', 'Corsair Xeneon'],
  'Endgame Gear XM2we Wireless': ['Endgame Gear XM2', 'Endgame Gear'],
  'Gigabyte M34WMU 34in': ['M34WMU', 'Gigabyte M34'],
  'HP Omen 27qs 27in': ['Omen 27', 'HP Omen'],
  'HP Spectre x360 16-f2005TU': ['Spectre x360 16', 'HP Spectre x360'],
  'HyperX Cloud Alpha Wireless Red': ['HyperX Cloud Alpha', 'Cloud Alpha'],
  'HyperX Cloud III Wireless': ['HyperX Cloud III', 'Cloud III'],
  'JBL Quantum 910 Wireless': ['JBL Quantum 910', 'JBL Quantum'],
  'Kingston FURY Renegade': ['Kingston Fury Renegade', 'FURY Renegade'],
  'Lenovo Legion R32fc-30 32in': ['Legion R32', 'Lenovo Legion 32'],
  'LG UltraGear 27GR95QE 27in': ['27GR95QE', 'UltraGear 27'],
  'LG UltraGear 32GP950 32in': ['32GP950', 'UltraGear 32'],
  'Razer Seiren V2 Pro': ['Seiren V2', 'Razer Seiren'],
  'Razer Raptor 27in': ['Razer Raptor', 'Razer 27 monitor'],
  'Samsung Galaxy Book4 Ultra 16in': ['Galaxy Book4 Ultra', 'Samsung Galaxy Book'],
  'Samsung Odyssey G9 34in': ['Odyssey G9', 'Samsung Odyssey G9'],
  'Seagate FireCuda 530': ['FireCuda 530', 'FireCuda'],
  'ViewSonic ColorPro VP3200-3K 32in': ['VP3200', 'ViewSonic ColorPro'],
  'ViewSonic XG272-2K-OLED 27in': ['XG272', 'ViewSonic XG27'],
  'Zowie XL2546X 24.5in': ['XL2546X', 'Zowie XL2546'],
  'Zowie XL2566K 27in': ['XL2566K', 'Zowie XL2566'],
  'AMD Ryzen 9 7950X3D': ['7950X3D', 'AMD Ryzen 9 7950X'],
  'AirPods 4 ANC Deep': ['AirPods 4'],
  'AirPods Pro 2 USB-C Deep': ['AirPods Pro 2'],
};

async function main() {
  const out: Record<string, any> = {};
  for (const [model, qs] of Object.entries(TARGETS)) {
    const rec: any = { wiki: [], wd: [] };
    for (const q of qs) {
      const res = await wikiSearch(q);
      for (const r of res) {
        if (rec.wiki.some((x: any) => x.title === r.title)) continue;
        const imgs = await wikiImages(r.title);
        rec.wiki.push({ ...r, images: imgs });
      }
      const wds = await wikidataImages(q);
      for (const w of wds) rec.wd.push(w);
    }
    out[model] = rec;
    console.log(`\n### ${model}`);
    rec.wiki.slice(0, 4).forEach((w: any) =>
      console.log(
        `   W ${w.title} -> ${(w.images ?? []).slice(0, 3).map((i: any) => i.title).join(' | ')}`,
      ),
    );
    rec.wd
      .filter((w: any) => w.p18.length || w.commonsCat)
      .slice(0, 4)
      .forEach((w: any) => console.log(`   D ${w.title} p18=${w.p18.join(',')} cat=${w.commonsCat}`));
  }
  writeFileSync(
    resolve(process.cwd(), 'scripts/data/wiki-model-probe.json'),
    JSON.stringify(out, null, 2),
    'utf-8',
  );
}

void main();
