/**
 * TÌM FILE COMMONS THEO PREFIX (allpages) + insource.
 *
 * Prefix search rất nhanh và chính xác cho tên file dạng
 * "<ModelCode> ..." hoặc "<Brand> <Model> ...".
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
      await new Promise((s) => setTimeout(s, 700));
    }
  }
  return null;
}

async function prefix(p: string): Promise<string[]> {
  const out: string[] = [];
  let cont: string | undefined;
  do {
    const d = await getJson(
      `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
        `&list=allpages&apnamespace=6&apprefix=${encodeURIComponent(p)}&aplimit=100` +
        `${cont ? `&apcontinue=${encodeURIComponent(cont)}` : ''}`,
    );
    for (const a of d?.query?.allpages ?? []) out.push(String(a.title).replace(/^File:/, ''));
    cont = d?.continue?.apcontinue;
  } while (cont && out.length < 200);
  return out;
}

/** Tìm file bằng insource (nội dung mô tả/trang chứa từ khoá). */
async function insource(q: string): Promise<string[]> {
  const d = await getJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
      `&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(q)}` +
      `&gsrlimit=40`,
  );
  const out: string[] = [];
  for (const p of Object.values<any>(d?.query?.pages ?? {})) {
    out.push(String(p.title).replace(/^File:/, ''));
  }
  return out;
}

/** model -> prefix thử. */
const PREFIXES: Record<string, string[]> = {
  'AOC CU34G2X 34in': ['CU34G2X', 'AOC CU34G2X', 'CU34G2'],
  'ASUS ROG Harpe Ace Aim Lab Edition': ['ROG Harpe Ace', 'Harpe Ace', 'ROG Harpe'],
  'Corsair HS60 Wireless': ['HS60', 'Corsair HS60'],
  'Corsair HS60 Wireless Carbon': ['HS60', 'Corsair HS60'],
  'Corsair HS80 RGB USB': ['HS80', 'Corsair HS80'],
  'Corsair HS80 RGB USB Carbon': ['HS80', 'Corsair HS80'],
  'Corsair Xeneon 27QHD240 27in': ['Xeneon', '27QHD240', 'Corsair Xeneon'],
  'Endgame Gear XM2we Wireless': ['Endgame Gear', 'XM2we'],
  'Gigabyte M34WMU 34in': ['M34WMU', 'Gigabyte M34'],
  'HP Omen 27qs 27in': ['HP Omen 27', 'OMEN 27', 'Omen 27'],
  'HP Omen 27qs 27in QHD': ['HP Omen 27', 'OMEN 27', 'Omen 27'],
  'HP Spectre x360 16-f2005TU': ['Spectre x360 16', 'HP Spectre x360'],
  'HyperX Cloud Alpha Wireless Red': ['HyperX Cloud Alpha', 'Cloud Alpha'],
  'HyperX Cloud III Wireless': ['HyperX Cloud III', 'Cloud III'],
  'HyperX Cloud III Wireless Red': ['HyperX Cloud III', 'Cloud III'],
  'JBL Quantum 910 Wireless': ['JBL Quantum', 'Quantum 910'],
  'Kingston FURY Renegade': ['FURY Renegade', 'Kingston FURY'],
  'Lenovo Legion R32fc-30 32in': ['Legion R32', 'R32fc', 'Lenovo Legion'],
  'Lenovo Legion R32fc-30 32in FHD': ['Legion R32', 'R32fc', 'Lenovo Legion'],
  'LG UltraGear 27GR95QE 27in': ['27GR95QE', 'GR95QE', 'UltraGear 27'],
  'LG UltraGear 27GR95QE 27in OLED': ['27GR95QE', 'GR95QE', 'UltraGear 27'],
  'LG UltraGear 32GP950 32in': ['32GP950', 'GP950', 'UltraGear 32'],
  'Razer Seiren V2 Pro': ['Seiren V2', 'Razer Seiren'],
  'Razer Raptor 27in': ['Razer Raptor', 'Raptor 27'],
  'Razer Raptor 27in 2K Tổng hợp': ['Razer Raptor', 'Raptor 27'],
  'Samsung Galaxy Book4 Ultra 16in': ['Galaxy Book4', 'Samsung Galaxy Book'],
  'Samsung Odyssey G9 34in': ['Odyssey G9', 'Odyssey Neo G9'],
  'Seagate FireCuda 530': ['FireCuda', 'Seagate FireCuda'],
  'ViewSonic ColorPro VP3200-3K 32in': ['VP3200', 'ViewSonic ColorPro'],
  'ViewSonic XG272-2K-OLED 27in': ['XG272', 'ViewSonic XG'],
  'ViewSonic XG272-2K-OLED 27in Gaming': ['XG272', 'ViewSonic XG'],
  'Zowie XL2546X 24.5in': ['XL2546X', 'Zowie XL2546'],
  'Zowie XL2546X 24.5in eSports': ['XL2546X', 'Zowie XL2546'],
  'Zowie XL2566K 27in': ['XL2566K', 'Zowie XL2566'],
  'AirPods 4 ANC Deep': ['AirPods 4', 'Airpods 4'],
  'AirPods Pro 2 USB-C Deep': ['AirPods Pro 2', 'AirPods Pro'],
  'AMD Ryzen 9 7950X3D': ['7950X3D', 'Ryzen 9 7950'],
  'Gigabyte M32U 32in': ['M32U', 'Gigabyte M32'],
  'Gigabyte M27Q 27in': ['M27Q', 'Gigabyte M27'],
  'Corsair HS70': ['HS70', 'Corsair HS70'],
  'HyperX Cloud II': ['Cloud II', 'HyperX Cloud II'],
  'Samsung Odyssey Neo G9 34in': ['Odyssey Neo G9', 'Odyssey G9'],
  'ASUS ROG Swift PG27': ['PG27', 'ROG Swift PG'],
  'Logitech G Pro X Superlight 2': ['G Pro X Superlight', 'Superlight 2'],
  'Razer Viper V3 Pro': ['Viper V3', 'Razer Viper'],
  'SteelSeries Arctis Nova 7': ['Arctis Nova', 'SteelSeries Arctis'],
  'Elgato Stream Deck': ['Stream Deck', 'Elgato Stream'],
  'Keychron K2': ['Keychron K2', 'Keychron'],
  'G.Skill Trident Z5': ['Trident Z5', 'G.Skill Trident'],
  'WD Black SN850X': ['SN850X', 'WD Black'],
  'Crucial T705': ['T705', 'Crucial T7'],
  'DeepCool AK620': ['AK620', 'DeepCool AK'],
  'Arctic Liquid Freezer III': ['Liquid Freezer III', 'Arctic Liquid'],
  'Samsung Odyssey OLED G8': ['Odyssey OLED G8', 'Odyssey G8'],
};

async function main() {
  const out: Record<string, string[]> = {};
  for (const [model, prefixes] of Object.entries(PREFIXES)) {
    const seen = new Set<string>();
    const list: string[] = [];
    for (const p of prefixes) {
      for (const f of await prefix(p)) {
        if (seen.has(f)) continue;
        seen.add(f);
        list.push(f);
      }
    }
    if (!list.length) {
      for (const p of prefixes) {
        for (const f of await insource(`"${p}"`)) {
          if (seen.has(f)) continue;
          seen.add(f);
          list.push(f);
        }
      }
    }
    out[model] = list;
    console.log(`\n### ${model}  (${list.length})`);
    list.slice(0, 16).forEach((f) => console.log(`   ${f}`));
  }
  writeFileSync(
    resolve(process.cwd(), 'scripts/data/prefix-model-probe.json'),
    JSON.stringify(out, null, 2),
    'utf-8',
  );
}

void main();
