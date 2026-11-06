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

const LANGS = ['de', 'zh', 'fr', 'es', 'it', 'ru', 'ja', 'ko', 'pl', 'nl', 'pt', 'sv', 'cs', 'fi', 'tr', 'uk'];

async function searchImg(lang: string, q: string) {
  const d = await getJson(
    `https://${lang}.wikipedia.org/w/api.php?action=query&format=json` +
      `&generator=search&gsrsearch=${encodeURIComponent(q)}&gsrlimit=8` +
      `&prop=pageimages|info&piprop=thumbnail|name&pithumbsize=1200&inprop=url`,
  );
  const out: any[] = [];
  for (const p of Object.values<any>(d?.query?.pages ?? {})) {
    if (!p?.thumbnail?.source) continue;
    out.push({ title: String(p.title), thumb: String(p.thumbnail.source), name: p.pageimage ?? null });
  }
  return out;
}

async function commonsFiles(names: string[]): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  for (let i = 0; i < names.length; i += 20) {
    const chunk = names.slice(i, i + 20);
    const d = await getJson(
      `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
        `&titles=${encodeURIComponent(chunk.map((n) => `File:${n}`).join('|'))}` +
        `&prop=imageinfo&iiprop=url|mime&iiurlwidth=1000`,
    );
    for (const p of Object.values<any>(d?.query?.pages ?? {})) {
      const ii = (p.imageinfo ?? [])[0];
      if (!ii || !/^image\/(jpeg|png|webp|tiff)$/.test(String(ii.mime))) continue;
      out[String(p.title).replace(/^File:/, '')] = String(ii.thumburl ?? ii.url);
    }
  }
  return out;
}

const QUERIES: Record<string, string[]> = {
  'AOC CU34G2X 34in': ['CU34G2X'],
  'ASUS ROG Harpe Ace Aim Lab Edition': ['ROG Harpe Ace', 'Harpe Ace Aim Lab'],
  'Corsair HS60 Wireless': ['Corsair HS60'],
  'Corsair HS60 Wireless Carbon': ['Corsair HS60'],
  'Corsair HS80 RGB USB': ['Corsair HS80'],
  'Corsair HS80 RGB USB Carbon': ['Corsair HS80'],
  'Corsair Xeneon 27QHD240 27in': ['Corsair Xeneon', 'Xeneon 27QHD240'],
  'Endgame Gear XM2we Wireless': ['Endgame Gear XM2'],
  'Gigabyte M34WMU 34in': ['M34WMU'],
  'HP Omen 27qs 27in': ['OMEN 27', 'Omen 27qs'],
  'HP Omen 27qs 27in QHD': ['OMEN 27'],
  'HP Spectre x360 16-f2005TU': ['Spectre x360 16', 'HP Spectre x360'],
  'HyperX Cloud Alpha Wireless Red': ['HyperX Cloud Alpha'],
  'HyperX Cloud Alpha Wireless': ['HyperX Cloud Alpha'],
  'HyperX Cloud III Wireless': ['HyperX Cloud III'],
  'HyperX Cloud III Wireless Red': ['HyperX Cloud III'],
  'HyperX Cloud III Sumi USB': ['HyperX Cloud III'],
  'JBL Quantum 910 Wireless': ['JBL Quantum 910', 'JBL Quantum'],
  'Kingston FURY Renegade': ['Kingston FURY Renegade', 'FURY Renegade'],
  'Lenovo Legion R32fc-30 32in': ['Legion R32fc-30', 'Lenovo Legion R32'],
  'Lenovo Legion R32fc-30 32in FHD': ['Legion R32fc-30'],
  'LG UltraGear 27GR95QE 27in': ['UltraGear 27GR95QE', 'LG 27GR95QE'],
  'LG UltraGear 27GR95QE 27in OLED': ['UltraGear 27GR95QE'],
  'LG UltraGear 32GP950 32in': ['UltraGear 32GP950', 'LG 32GP950'],
  'Razer Seiren V2 Pro': ['Razer Seiren V2'],
  'Razer Raptor 27in': ['Razer Raptor'],
  'Razer Raptor 27in 2K Tổng hợp': ['Razer Raptor'],
  'Samsung Galaxy Book4 Ultra 16in': ['Samsung Galaxy Book4', 'Galaxy Book4 Ultra'],
  'Samsung Odyssey G9 34in': ['Samsung Odyssey G9', 'Odyssey G9'],
  'Seagate FireCuda 530': ['Seagate FireCuda', 'FireCuda'],
  'ViewSonic ColorPro VP3200-3K 32in': ['ViewSonic VP3200'],
  'ViewSonic XG272-2K-OLED 27in': ['ViewSonic XG272'],
  'ViewSonic XG272-2K-OLED 27in Gaming': ['ViewSonic XG272'],
  'Zowie XL2546X 24.5in': ['Zowie XL2546', 'XL2546X'],
  'Zowie XL2546X 24.5in eSports': ['Zowie XL2546'],
  'Zowie XL2566K 27in': ['Zowie XL2566', 'XL2566K'],
  'AMD Ryzen 9 7950X3D': ['Ryzen 9 7950X3D', '7950X3D'],
  'AirPods 4 ANC Deep': ['AirPods 4'],
  'AirPods Pro 2 USB-C Deep': ['AirPods Pro 2'],
  'Samsung Galaxy Tab S9': ['Samsung Galaxy Tab S9'],
};

const VERIFY: Record<string, RegExp> = {
  'AOC CU34G2X 34in': /CU34G2/i,
  'ASUS ROG Harpe Ace Aim Lab Edition': /harpe/i,
  'Corsair HS60 Wireless': /HS60/i,
  'Corsair HS60 Wireless Carbon': /HS60/i,
  'Corsair HS80 RGB USB': /HS80/i,
  'Corsair HS80 RGB USB Carbon': /HS80/i,
  'Corsair Xeneon 27QHD240 27in': /xeneon|27QHD240/i,
  'Endgame Gear XM2we Wireless': /XM2/i,
  'Gigabyte M34WMU 34in': /M34WMU/i,
  'HP Omen 27qs 27in': /omen/i,
  'HP Omen 27qs 27in QHD': /omen/i,
  'HP Spectre x360 16-f2005TU': /spectre|x360/i,
  'HyperX Cloud Alpha Wireless Red': /cloud alpha/i,
  'HyperX Cloud Alpha Wireless': /cloud alpha/i,
  'HyperX Cloud III Wireless': /cloud ?iii/i,
  'HyperX Cloud III Wireless Red': /cloud ?iii/i,
  'HyperX Cloud III Sumi USB': /cloud ?iii/i,
  'JBL Quantum 910 Wireless': /quantum/i,
  'Kingston FURY Renegade': /renegade|fury/i,
  'Lenovo Legion R32fc-30 32in': /legion|r32/i,
  'Lenovo Legion R32fc-30 32in FHD': /legion|r32/i,
  'LG UltraGear 27GR95QE 27in': /27GR95QE|ultragear/i,
  'LG UltraGear 27GR95QE 27in OLED': /27GR95QE|ultragear/i,
  'LG UltraGear 32GP950 32in': /32GP950|ultragear/i,
  'Razer Seiren V2 Pro': /seiren/i,
  'Razer Raptor 27in': /raptor/i,
  'Razer Raptor 27in 2K Tổng hợp': /raptor/i,
  'Samsung Galaxy Book4 Ultra 16in': /galaxy book|book ?4/i,
  'Samsung Odyssey G9 34in': /odyssey|g9/i,
  'Seagate FireCuda 530': /firecuda/i,
  'ViewSonic ColorPro VP3200-3K 32in': /VP3200/i,
  'ViewSonic XG272-2K-OLED 27in': /XG272/i,
  'ViewSonic XG272-2K-OLED 27in Gaming': /XG272/i,
  'Zowie XL2546X 24.5in': /XL2546/i,
  'Zowie XL2546X 24.5in eSports': /XL2546/i,
  'Zowie XL2566K 27in': /XL2566/i,
  'AMD Ryzen 9 7950X3D': /7950X3D/i,
  'AirPods 4 ANC Deep': /airpods ?4/i,
  'AirPods Pro 2 USB-C Deep': /airpods ?pro ?2/i,
  'Samsung Galaxy Tab S9': /galaxy tab s9/i,
};

async function main() {
  const out: Record<string, any[]> = {};
  const queue = Object.entries(QUERIES);
  const workers = Array.from({ length: 6 }, async () => {
    while (queue.length) {
      const [model, qs] = queue.shift()!;
      const hits: any[] = [];
      const seen = new Set<string>();
      for (const lang of LANGS) {
        for (const q of qs) {
          for (const p of await searchImg(lang, q)) {
            const key = `${lang}:${p.title}`;
            if (seen.has(key)) continue;
            if (!VERIFY[model].test(p.title)) continue;
            seen.add(key);
            hits.push({ lang, ...p });
          }
        }
        if (hits.length >= 4) break;
      }

      const names = hits.map((h) => h.name).filter(Boolean) as string[];
      const cfiles = names.length ? await commonsFiles([...new Set(names)]) : {};
      for (const h of hits) if (h.name && cfiles[h.name]) h.file = h.name;
      out[model] = hits;
      console.log(`\n### ${model} -> ${hits.length}`);
      hits.slice(0, 10).forEach((h) => console.log(`   [${h.lang}] ${h.title} :: ${h.file ?? h.thumb}`));
    }
  });
  await Promise.all(workers);
  writeFileSync(
    resolve(process.cwd(), 'scripts/data/wiki-multi-probe.json'),
    JSON.stringify(out, null, 2),
    'utf-8',
  );
  console.log('\n[done]');
}

void main();
