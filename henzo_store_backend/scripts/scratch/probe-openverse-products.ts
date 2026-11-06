import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const exec = promisify(execFile);

async function ov(query: string, pageSize = 20): Promise<any[]> {
  const url =
    `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}` +
    `&page_size=${pageSize}&mature=false`;
  for (let a = 0; a < 3; a++) {
    try {
      const { stdout } = await exec(
        'curl',
        ['-sS', '-m', '75', '-A', 'Mozilla/5.0 (henzo-store)', '-w', '\n__H__%{http_code}', url],
        { maxBuffer: 16 * 1024 * 1024 },
      );
      const i = stdout.lastIndexOf('__H__');
      const body = stdout.slice(0, i).trim();
      if (stdout.slice(i + 5).trim() !== '200' || !body.startsWith('{')) {
        await new Promise((s) => setTimeout(s, 1500 * (a + 1)));
        continue;
      }
      const j = JSON.parse(body);
      return j.results ?? [];
    } catch {
      await new Promise((s) => setTimeout(s, 1500 * (a + 1)));
    }
  }
  return [];
}

const QUERIES: Record<string, string[]> = {
  'AOC CU34G2X 34in': ['CU34G2X', 'AOC CU34G2X', 'AOC AGON CU34G2X', 'AOC ultrawide monitor', 'AOC gaming monitor'],
  'ASUS ROG Harpe Ace Aim Lab Edition': ['ROG Harpe Ace', 'Harpe Ace mouse', 'ROG Harpe Ace Aim Lab', 'Asus ROG gaming mouse'],
  'Corsair HS60 Wireless': ['Corsair HS60', 'HS60 headset', 'Corsair gaming headset', 'Corsair headset'],
  'Corsair HS60 Wireless Carbon': ['Corsair HS60', 'Corsair HS60 Carbon'],
  'Corsair HS80 RGB USB': ['Corsair HS80', 'HS80 headset', 'Corsair RGB headset'],
  'Corsair HS80 RGB USB Carbon': ['Corsair HS80', 'Corsair HS80 RGB'],
  'Corsair Xeneon 27QHD240 27in': ['Xeneon 27QHD240', 'Corsair Xeneon', 'Corsair gaming monitor'],
  'Endgame Gear XM2we Wireless': ['XM2we', 'Endgame Gear XM2', 'Endgame Gear mouse'],
  'Gigabyte M34WMU 34in': ['M34WMU', 'Gigabyte M34WMU', 'AORUS ultrawide monitor', 'Gigabyte gaming monitor'],
  'HP Omen 27qs 27in': ['HP Omen 27qs', 'OMEN 27 monitor', 'HP Omen gaming monitor'],
  'HP Omen 27qs 27in QHD': ['HP Omen 27qs', 'OMEN 27 QHD'],
  'HP Spectre x360 16-f2005TU': ['HP Spectre x360 16', 'Spectre x360 laptop'],
  'HyperX Cloud Alpha Wireless': ['HyperX Cloud Alpha', 'Cloud Alpha headset'],
  'HyperX Cloud Alpha Wireless Red': ['HyperX Cloud Alpha red', 'HyperX Cloud Alpha headset'],
  'HyperX Cloud III Wireless': ['HyperX Cloud III', 'Cloud III headset'],
  'HyperX Cloud III Wireless Red': ['HyperX Cloud III red', 'HyperX Cloud III headset'],
  'HyperX Cloud III Sumi USB': ['HyperX Cloud III', 'HyperX Cloud III wired headset'],
  'JBL Quantum 910 Wireless': ['JBL Quantum 910', 'JBL Quantum headset', 'JBL Quantum 910 wireless'],
  'Kingston FURY Renegade': ['Kingston FURY Renegade', 'FURY Renegade SSD', 'Kingston Fury SSD', 'Kingston SSD'],
  'Lenovo Legion R32fc-30 32in': ['Legion R32fc-30', 'Lenovo Legion R32', 'Lenovo Legion monitor'],
  'Lenovo Legion R32fc-30 32in FHD': ['Legion R32fc-30', 'Lenovo Legion R32'],
  'LG UltraGear 27GR95QE 27in': ['LG UltraGear 27GR95QE', '27GR95QE', 'LG UltraGear OLED monitor', 'LG gaming monitor'],
  'LG UltraGear 27GR95QE 27in OLED': ['LG UltraGear 27GR95QE', '27GR95QE', 'LG UltraGear OLED'],
  'LG UltraGear 32GP950 32in': ['LG UltraGear 32GP950', '32GP950', 'LG UltraGear 32'],
  'Razer Seiren V2 Pro': ['Razer Seiren V2', 'Seiren V2 microphone', 'Razer gaming microphone'],
  'Razer Raptor 27in': ['Razer Raptor 27', 'Razer Raptor monitor', 'Razer gaming monitor'],
  'Razer Raptor 27in 2K Tổng hợp': ['Razer Raptor monitor', 'Razer Raptor 27'],
  'Samsung Galaxy Book4 Ultra 16in': ['Samsung Galaxy Book4 Ultra', 'Galaxy Book4 Ultra'],
  'Samsung Odyssey G9 34in': ['Samsung Odyssey G9', 'Odyssey G9 monitor', 'Samsung Odyssey monitor'],
  'Seagate FireCuda 530': ['Seagate FireCuda 530', 'FireCuda SSD', 'Seagate NVMe SSD', 'Seagate SSD'],
  'ViewSonic ColorPro VP3200-3K 32in': ['ViewSonic VP3200', 'ViewSonic ColorPro VP3200', 'ViewSonic ColorPro'],
  'ViewSonic XG272-2K-OLED 27in': ['ViewSonic XG272', 'XG272-2K-OLED', 'ViewSonic OLED monitor'],
  'ViewSonic XG272-2K-OLED 27in Gaming': ['ViewSonic XG272', 'XG272-2K-OLED'],
  'Zowie XL2546X 24.5in': ['Zowie XL2546X', 'Zowie XL2546', 'BenQ Zowie monitor', 'Zowie esports monitor'],
  'Zowie XL2546X 24.5in eSports': ['Zowie XL2546X', 'Zowie XL2546', 'Zowie esports monitor'],
  'Zowie XL2566K 27in': ['Zowie XL2566K', 'Zowie XL2566', 'Zowie monitor'],
  'AMD Ryzen 9 7950X3D': ['AMD Ryzen 9 7950X3D', 'Ryzen 9 7950X3D', 'Ryzen 9 CPU'],
  'AirPods 4 ANC Deep': ['AirPods 4', 'AirPods 4 ANC'],
  'AirPods Pro 2 USB-C Deep': ['AirPods Pro 2', 'AirPods Pro 2 USB-C'],
  'Samsung Galaxy Tab S9': ['Samsung Galaxy Tab S9', 'Galaxy Tab S9 tablet'],
};

const OK_LICENSE = /^(cc0|pdm|by|by-sa)/i;

async function main() {
  const out: Record<string, any[]> = {};
  const queue = Object.entries(QUERIES);
  const workers = Array.from({ length: 3 }, async () => {
    while (queue.length) {
      const [model, qs] = queue.shift()!;
      const seen = new Set<string>();
      const hits: any[] = [];
      for (const q of qs) {
        for (const r of await ov(q, 20)) {
          const key = r.id ?? r.url;
          if (seen.has(key)) continue;
          seen.add(key);
          if (!OK_LICENSE.test(String(r.license ?? ''))) continue;
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
      console.log(`\n### ${model} -> ${hits.length}`);
      hits.slice(0, 12).forEach((h) => console.log(`   [${h.source}/${h.license}] ${h.title}`));
    }
  });
  await Promise.all(workers);
  writeFileSync(
    resolve(process.cwd(), 'scripts/data/openverse-products.json'),
    JSON.stringify(out, null, 2),
    'utf-8',
  );
  console.log('\n[done]');
}

void main();
