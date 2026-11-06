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

async function catFiles(cat: string): Promise<string[]> {
  const d = await getJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
      `&generator=categorymembers&gcmtitle=Category:${encodeURIComponent(cat)}` +
      `&gcmtype=file&gcmlimit=120` +
      `&prop=imageinfo&iiprop=mime&iiurlwidth=1000`,
  );
  const out: string[] = [];
  for (const p of Object.values<any>(d?.query?.pages ?? {})) {
    const ii = (p.imageinfo ?? [])[0];
    if (!ii?.mime || !/^image\/(jpeg|png|webp)$/.test(ii.mime)) continue;
    out.push(String(p.title).replace(/^File:/, ''));
  }
  return out;
}

async function nsSearch(ns: 6 | 14, q: string): Promise<string[]> {
  const d = await getJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
      `&list=search&srsearch=${encodeURIComponent(q)}&srnamespace=${ns}&srlimit=40`,
  );
  return (d?.query?.search ?? []).map((s: any) =>
    String(s.title).replace(/^File:/, '').replace(/^Category:/, ''),
  );
}

const CODES: Record<string, string[]> = {
  'AOC CU34G2X 34in': ['CU34G2X', 'CU34G2'],
  'ASUS ROG Harpe Ace Aim Lab Edition': ['Harpe Ace', 'ROG Harpe Ace'],
  'Corsair HS60 Wireless': ['HS60'],
  'Corsair HS60 Wireless Carbon': ['HS60'],
  'Corsair HS80 RGB USB': ['HS80'],
  'Corsair HS80 RGB USB Carbon': ['HS80'],
  'Corsair Xeneon 27QHD240 27in': ['27QHD240', 'Xeneon'],
  'Endgame Gear XM2we Wireless': ['XM2we', 'XM2'],
  'Gigabyte M34WMU 34in': ['M34WMU'],
  'HP Omen 27qs 27in': ['27qs', 'OMEN 27'],
  'HP Omen 27qs 27in QHD': ['27qs', 'OMEN 27'],
  'HyperX Cloud Alpha Wireless Red': ['Cloud Alpha'],
  'HyperX Cloud III Wireless': ['Cloud III'],
  'HyperX Cloud III Wireless Red': ['Cloud III'],
  'JBL Quantum 910 Wireless': ['Quantum 910', 'Quantum 2'],
  'Kingston FURY Renegade': ['FURY Renegade', 'Renegade'],
  'Lenovo Legion R32fc-30 32in': ['R32fc', 'R32'],
  'Lenovo Legion R32fc-30 32in FHD': ['R32fc', 'R32'],
  'LG UltraGear 27GR95QE 27in': ['27GR95QE', 'GR95QE'],
  'LG UltraGear 27GR95QE 27in OLED': ['27GR95QE', 'GR95QE'],
  'LG UltraGear 32GP950 32in': ['32GP950', 'GP950'],
  'Razer Seiren V2 Pro': ['Seiren V2', 'Seiren'],
  'Razer Raptor 27in': ['Razer Raptor', 'Raptor'],
  'Samsung Galaxy Book4 Ultra 16in': ['Galaxy Book4', 'Book4'],
  'Samsung Odyssey G9 34in': ['Odyssey G9', 'Neo G9'],
  'Seagate FireCuda 530': ['FireCuda 530', 'FireCuda'],
  'ViewSonic ColorPro VP3200-3K 32in': ['VP3200'],
  'ViewSonic XG272-2K-OLED 27in': ['XG272'],
  'ViewSonic XG272-2K-OLED 27in Gaming': ['XG272'],
  'Zowie XL2546X 24.5in': ['XL2546X'],
  'Zowie XL2546X 24.5in eSports': ['XL2546X'],
  'Zowie XL2566K 27in': ['XL2566K'],
  'AMD Ryzen 9 7950X3D': ['7950X3D'],
};

async function main() {
  const out: Record<string, any> = {};
  const queue = Object.entries(CODES);
  const workers = Array.from({ length: 6 }, async () => {
    while (queue.length) {
      const [model, codes] = queue.shift()!;
      const rec: any = { cats: {}, files: {} };
      for (const code of codes) {

        for (const cat of await nsSearch(14, code)) {
          if (rec.cats[cat]) continue;
          const files = await catFiles(cat);
          if (files.length) rec.cats[cat] = files;
        }

        for (const f of await nsSearch(6, `intitle:${code}`)) {
          if (rec.files[f]) continue;
          rec.files[f] = true;
        }
      }
      out[model] = rec;
      const nc = Object.keys(rec.cats).length;
      const nf = Object.keys(rec.files).length;
      if (nc || nf) {
        console.log(`\n### ${model}  cats=${nc} files=${nf}`);
        for (const [c, fs] of Object.entries<any>(rec.cats)) {
          console.log(`   CAT ${c} (${fs.length})`);
          fs.slice(0, 6).forEach((f: string) => console.log(`        ${f}`));
        }
        Object.keys(rec.files).slice(0, 10).forEach((f) => console.log(`   FILE ${f}`));
      }
    }
  });
  await Promise.all(workers);
  writeFileSync(
    resolve(process.cwd(), 'scripts/data/code-model-probe.json'),
    JSON.stringify(out, null, 2),
    'utf-8',
  );
  console.log('\n[done]');
}

void main();
