import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const UA = 'henzo-store/1.0 (model image resolver; dev@henzo.local)';

async function getJson(url: string): Promise<any> {
  for (let a = 0; a < 3; a++) {
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

async function ov(query: string, pageSize = 20): Promise<any[]> {
  const d = await getJson(
    `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}` +
      `&page_size=${pageSize}&mature=false`,
  );
  return d?.results ?? [];
}

const QUERIES: Record<string, string[]> = {
  'AOC CU34G2X 34in': ['"CU34G2X"', '"AOC CU34G2X"', 'AOC AGON CU34G2X'],
  'ASUS ROG Harpe Ace Aim Lab Edition': ['"ROG Harpe Ace"', '"Harpe Ace"', 'ROG Harpe Ace mouse'],
  'Corsair HS60 Wireless': ['"HS60"', '"Corsair HS60"', 'Corsair HS60 headset'],
  'Corsair HS60 Wireless Carbon': ['"HS60"', '"Corsair HS60"', 'Corsair HS60 Carbon'],
  'Corsair HS80 RGB USB': ['"HS80"', '"Corsair HS80"', 'Corsair HS80 headset'],
  'Corsair HS80 RGB USB Carbon': ['"HS80"', '"Corsair HS80"', 'Corsair HS80 Carbon'],
  'Corsair Xeneon 27QHD240 27in': ['"27QHD240"', '"Xeneon"', 'Corsair Xeneon monitor'],
  'Endgame Gear XM2we Wireless': ['"XM2we"', '"Endgame Gear"', 'Endgame Gear XM2 mouse'],
  'Gigabyte M34WMU 34in': ['"M34WMU"', '"M34WMU" monitor'],
  'HP Omen 27qs 27in': ['"27qs"', '"OMEN 27"', 'HP Omen 27 monitor'],
  'HP Omen 27qs 27in QHD': ['"27qs"', '"OMEN 27"'],
  'HyperX Cloud Alpha Wireless Red': ['"Cloud Alpha"', '"HyperX Cloud Alpha"', 'HyperX Cloud Alpha headset'],
  'HyperX Cloud III Wireless': ['"Cloud III"', '"HyperX Cloud III"'],
  'HyperX Cloud III Wireless Red': ['"Cloud III"', '"HyperX Cloud III"'],
  'JBL Quantum 910 Wireless': ['"Quantum 910"', '"JBL Quantum"'],
  'Kingston FURY Renegade': ['"FURY Renegade"', '"Kingston FURY"'],
  'Lenovo Legion R32fc-30 32in': ['"R32fc"', '"Legion R32"', 'Legion R32 monitor'],
  'Lenovo Legion R32fc-30 32in FHD': ['"R32fc"', '"Legion R32"'],
  'LG UltraGear 27GR95QE 27in': ['"27GR95QE"', '"UltraGear 27"', 'LG UltraGear 27GR95QE'],
  'LG UltraGear 27GR95QE 27in OLED': ['"27GR95QE"', '"UltraGear 27"'],
  'LG UltraGear 32GP950 32in': ['"32GP950"', '"UltraGear 32"', 'LG UltraGear 32GP950'],
  'Razer Seiren V2 Pro': ['"Seiren V2"', '"Razer Seiren"'],
  'Razer Raptor 27in': ['"Razer Raptor"', 'Razer Raptor monitor'],
  'Razer Raptor 27in 2K Tổng hợp': ['"Razer Raptor"'],
  'Samsung Galaxy Book4 Ultra 16in': ['"Galaxy Book4"', '"Galaxy Book4 Ultra"'],
  'Samsung Odyssey G9 34in': ['"Odyssey G9"', '"Odyssey Neo G9"', 'Samsung Odyssey G9 monitor'],
  'Seagate FireCuda 530': ['"FireCuda"', '"FireCuda 530"', 'Seagate FireCuda SSD'],
  'ViewSonic ColorPro VP3200-3K 32in': ['"VP3200"', '"ColorPro"'],
  'ViewSonic XG272-2K-OLED 27in': ['"XG272"', '"XG272-2K"'],
  'ViewSonic XG272-2K-OLED 27in Gaming': ['"XG272"'],
  'Zowie XL2546X 24.5in': ['"XL2546X"', '"XL2546"', 'Zowie XL2546X'],
  'Zowie XL2546X 24.5in eSports': ['"XL2546X"'],
  'Zowie XL2566K 27in': ['"XL2566K"', '"XL2566"'],
  'AMD Ryzen 9 7950X3D': ['"7950X3D"', 'AMD Ryzen 9 7950X3D'],
  'AirPods 4 ANC Deep': ['"AirPods 4"'],
  'AirPods Pro 2 USB-C Deep': ['"AirPods Pro 2"'],
  'HP Spectre x360 16-f2005TU': ['"Spectre x360 16"'],
};

async function main() {
  const out: Record<string, any[]> = {};
  const queue = Object.entries(QUERIES);
  const workers = Array.from({ length: 4 }, async () => {
    while (queue.length) {
      const [model, queries] = queue.shift()!;
      const seen = new Set<string>();
      const hits: any[] = [];
      for (const q of queries) {
        for (const r of await ov(q, 20)) {
          const key = r.id ?? r.url;
          if (seen.has(key)) continue;
          seen.add(key);
          hits.push({
            title: r.title,
            url: r.url,
            thumb: r.thumbnail ?? r.url,
            creator: r.creator,
            license: `${r.license} ${r.license_version ?? ''}`.trim(),
            source: r.source,
            landing: r.foreign_landing_url,
          });
        }
      }
      out[model] = hits;
      console.log(`\n### ${model}  (${hits.length})`);
      hits.slice(0, 12).forEach((h) => console.log(`   [${h.source}] ${h.title}`));
    }
  });
  await Promise.all(workers);
  writeFileSync(
    resolve(process.cwd(), 'scripts/data/openverse-exact-probe.json'),
    JSON.stringify(out, null, 2),
    'utf-8',
  );
  console.log('\n[done]');
}

void main();
