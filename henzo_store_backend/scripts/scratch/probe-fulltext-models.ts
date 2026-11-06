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
      await new Promise((s) => setTimeout(s, 700));
    }
  }
  return null;
}

async function srsearch(q: string, ns: 6 | 14, limit = 50): Promise<string[]> {
  const d = await getJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
      `&list=search&srsearch=${encodeURIComponent(q)}&srnamespace=${ns}&srlimit=${limit}`,
  );
  return (d?.query?.search ?? []).map((s: any) => String(s.title));
}

async function catFiles(cat: string): Promise<string[]> {
  const d = await getJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
      `&generator=categorymembers&gcmtitle=Category:${encodeURIComponent(cat)}` +
      `&gcmtype=file&gcmlimit=200&prop=imageinfo&iiprop=mime&iiurlwidth=1000`,
  );
  const out: string[] = [];
  for (const p of Object.values<any>(d?.query?.pages ?? {})) {
    const ii = (p.imageinfo ?? [])[0];
    if (!ii?.mime || !/^image\/(jpeg|png|webp|tiff)$/.test(ii.mime)) continue;
    out.push(String(p.title).replace(/^File:/, ''));
  }
  return out;
}

const CODES: Record<string, string[]> = {
  'AOC CU34G2X 34in': ['CU34G2X'],
  'ASUS ROG Harpe Ace Aim Lab Edition': ['"Harpe Ace"', 'Harpe Ace Aim Lab'],
  'Corsair HS60 Wireless': ['"Corsair HS60"', 'HS60 headset'],
  'Corsair HS60 Wireless Carbon': ['"Corsair HS60"'],
  'Corsair HS80 RGB USB': ['"Corsair HS80"'],
  'Corsair HS80 RGB USB Carbon': ['"Corsair HS80"'],
  'Corsair Xeneon 27QHD240 27in': ['27QHD240', 'Xeneon 27QHD'],
  'Endgame Gear XM2we Wireless': ['XM2we', 'Endgame Gear XM2'],
  'Gigabyte M34WMU 34in': ['M34WMU'],
  'HP Omen 27qs 27in': ['27qs', 'OMEN 27qs'],
  'HP Omen 27qs 27in QHD': ['27qs'],
  'HP Spectre x360 16-f2005TU': ['Spectre x360 16', 'x360 16-f'],
  'HyperX Cloud Alpha Wireless Red': ['"Cloud Alpha"', 'Cloud Alpha headset'],
  'HyperX Cloud Alpha Wireless': ['"Cloud Alpha"'],
  'HyperX Cloud III Wireless': ['"Cloud III"', 'Cloud III headset'],
  'HyperX Cloud III Wireless Red': ['"Cloud III"'],
  'HyperX Cloud III Sumi USB': ['"Cloud III"'],
  'JBL Quantum 910 Wireless': ['Quantum 910', 'JBL Quantum'],
  'Kingston FURY Renegade': ['FURY Renegade'],
  'Lenovo Legion R32fc-30 32in': ['R32fc', 'Legion R32'],
  'Lenovo Legion R32fc-30 32in FHD': ['R32fc'],
  'LG UltraGear 27GR95QE 27in': ['27GR95QE'],
  'LG UltraGear 27GR95QE 27in OLED': ['27GR95QE'],
  'LG UltraGear 32GP950 32in': ['32GP950'],
  'Razer Seiren V2 Pro': ['Seiren V2'],
  'Razer Raptor 27in': ['"Razer Raptor"', 'Raptor 27'],
  'Razer Raptor 27in 2K Tổng hợp': ['"Razer Raptor"'],
  'Samsung Galaxy Book4 Ultra 16in': ['Galaxy Book4', 'Book4 Ultra'],
  'Samsung Odyssey G9 34in': ['Odyssey G9', 'Odyssey Neo G9'],
  'Seagate FireCuda 530': ['FireCuda'],
  'ViewSonic ColorPro VP3200-3K 32in': ['VP3200'],
  'ViewSonic XG272-2K-OLED 27in': ['XG272'],
  'ViewSonic XG272-2K-OLED 27in Gaming': ['XG272'],
  'Zowie XL2546X 24.5in': ['XL2546'],
  'Zowie XL2546X 24.5in eSports': ['XL2546'],
  'Zowie XL2566K 27in': ['XL2566'],
  'AMD Ryzen 9 7950X3D': ['7950X3D'],
  'AirPods 4 ANC Deep': ['"AirPods 4"'],
  'AirPods Pro 2 USB-C Deep': ['"AirPods Pro 2"'],
  'Samsung Galaxy Tab S9': ['"Galaxy Tab S9"'],
};

const STRICT: Record<string, RegExp> = {
  'AOC CU34G2X 34in': /CU34G2/i,
  'ASUS ROG Harpe Ace Aim Lab Edition': /Harpe/i,
  'Corsair HS60 Wireless': /HS60/i,
  'Corsair HS60 Wireless Carbon': /HS60/i,
  'Corsair HS80 RGB USB': /HS80/i,
  'Corsair HS80 RGB USB Carbon': /HS80/i,
  'Corsair Xeneon 27QHD240 27in': /27QHD240|Xeneon/i,
  'Endgame Gear XM2we Wireless': /XM2/i,
  'Gigabyte M34WMU 34in': /M34WMU/i,
  'HP Omen 27qs 27in': /27qs|omen 27/i,
  'HP Omen 27qs 27in QHD': /27qs|omen 27/i,
  'HP Spectre x360 16-f2005TU': /spectre.*x360|x360/i,
  'HyperX Cloud Alpha Wireless Red': /cloud alpha/i,
  'HyperX Cloud Alpha Wireless': /cloud alpha/i,
  'HyperX Cloud III Wireless': /cloud ?iii/i,
  'HyperX Cloud III Wireless Red': /cloud ?iii/i,
  'HyperX Cloud III Sumi USB': /cloud ?iii/i,
  'JBL Quantum 910 Wireless': /quantum/i,
  'Kingston FURY Renegade': /fury|renegade/i,
  'Lenovo Legion R32fc-30 32in': /r32fc|legion.*r32/i,
  'Lenovo Legion R32fc-30 32in FHD': /r32fc|legion.*r32/i,
  'LG UltraGear 27GR95QE 27in': /27gr95qe/i,
  'LG UltraGear 27GR95QE 27in OLED': /27gr95qe/i,
  'LG UltraGear 32GP950 32in': /32gp950/i,
  'Razer Seiren V2 Pro': /seiren/i,
  'Razer Raptor 27in': /raptor/i,
  'Razer Raptor 27in 2K Tổng hợp': /raptor/i,
  'Samsung Galaxy Book4 Ultra 16in': /galaxy book|book4/i,
  'Samsung Odyssey G9 34in': /odyssey.*g9|g9.*odyssey/i,
  'Seagate FireCuda 530': /firecuda/i,
  'ViewSonic ColorPro VP3200-3K 32in': /vp3200/i,
  'ViewSonic XG272-2K-OLED 27in': /xg272/i,
  'ViewSonic XG272-2K-OLED 27in Gaming': /xg272/i,
  'Zowie XL2546X 24.5in': /xl2546/i,
  'Zowie XL2546X 24.5in eSports': /xl2546/i,
  'Zowie XL2566K 27in': /xl2566/i,
  'AMD Ryzen 9 7950X3D': /7950x3d/i,
  'AirPods 4 ANC Deep': /airpods ?4/i,
  'AirPods Pro 2 USB-C Deep': /airpods ?pro ?2/i,
  'Samsung Galaxy Tab S9': /galaxy tab s9/i,
};

async function main() {
  const out: Record<string, { files: string[]; cats: string[] }> = {};
  const queue = Object.entries(CODES);
  const workers = Array.from({ length: 5 }, async () => {
    while (queue.length) {
      const [model, qs] = queue.shift()!;
      const files = new Set<string>();
      const cats = new Set<string>();
      for (const q of qs) {
        for (const t of await srsearch(q, 6, 60)) {
          const f = t.replace(/^File:/, '');
          if (STRICT[model]?.test(f)) files.add(f);
        }
        for (const t of await srsearch(q, 14, 20)) {
          cats.add(t.replace(/^Category:/, ''));
        }
      }

      for (const c of [...cats].slice(0, 8)) {
        for (const f of await catFiles(c)) {
          if (STRICT[model]?.test(f)) files.add(f);
        }
      }
      out[model] = { files: [...files], cats: [...cats] };
      console.log(`\n### ${model} -> files=${files.size} cats=${cats.size}`);
      [...files].slice(0, 20).forEach((f) => console.log(`   FILE ${f}`));
      [...cats].slice(0, 10).forEach((c) => console.log(`   CAT  ${c}`));
    }
  });
  await Promise.all(workers);
  writeFileSync(
    resolve(process.cwd(), 'scripts/data/fulltext-probe.json'),
    JSON.stringify(out, null, 2),
    'utf-8',
  );
  console.log('\n[done]');
}

void main();
