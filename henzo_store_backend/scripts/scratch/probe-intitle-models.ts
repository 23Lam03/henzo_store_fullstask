/**
 * TÌM ẢNH SẢN PHẨM QUA intitle: SEARCH TRÊN COMMONS.
 *
 * Tìm file có TÊN chứa tên series/model (không phải category).
 * Đồng thời thử prefix (file bắt đầu bằng tên series).
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

async function search(q: string, limit = 40): Promise<string[]> {
  const d = await getJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
      `&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(q)}` +
      `&gsrlimit=${limit}&prop=imageinfo&iiprop=mime&iiurlwidth=1000`,
  );
  const out: string[] = [];
  for (const p of Object.values<any>(d?.query?.pages ?? {})) {
    const ii = (p.imageinfo ?? [])[0];
    if (!ii?.mime || !/^image\/(jpeg|png|webp)$/.test(ii.mime)) continue;
    out.push(String(p.title).replace(/^File:/, ''));
  }
  return out;
}

/** Tìm file bằng prefix (allpages prefixsearch). */
async function prefix(p: string): Promise<string[]> {
  const d = await getJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
      `&list=allpages&apnamespace=6&apprefix=${encodeURIComponent(p)}&aplimit=100`,
  );
  return (d?.query?.allpages ?? []).map((p: any) => p.title.replace(/^File:/, ''));
}

/** model -> các từ khoá tìm kiếm (ưu tiên cụ thể trước). */
const QUERIES: Record<string, string[]> = {
  'AOC CU34G2X 34in': ['intitle:"CU34G2X"', 'intitle:"AOC" intitle:"G2"', 'intitle:"AOC" intitle:"34"'],
  'ASUS ROG Harpe Ace Aim Lab Edition': ['intitle:"Harpe Ace"', 'intitle:"Harpe"', 'intitle:"ROG Harpe"'],
  'Corsair HS60 Wireless': ['intitle:"HS60"', 'intitle:"Corsair" intitle:"HS"'],
  'Corsair HS60 Wireless Carbon': ['intitle:"HS60"', 'intitle:"Corsair" intitle:"HS"'],
  'Corsair HS80 RGB USB': ['intitle:"HS80"', 'intitle:"Corsair" intitle:"HS"'],
  'Corsair HS80 RGB USB Carbon': ['intitle:"HS80"', 'intitle:"Corsair" intitle:"HS"'],
  'Corsair Xeneon 27QHD240 27in': ['intitle:"Xeneon"', 'intitle:"27QHD240"'],
  'Endgame Gear XM2we Wireless': ['intitle:"XM2"', 'intitle:"Endgame Gear"'],
  'Gigabyte M34WMU 34in': ['intitle:"M34WMU"', 'intitle:"M34W"', 'intitle:"Gigabyte" intitle:"M34"'],
  'HP Omen 27qs 27in': ['intitle:"OMEN" intitle:"27"', 'intitle:"Omen 27"'],
  'HP Omen 27qs 27in QHD': ['intitle:"OMEN" intitle:"27"', 'intitle:"Omen 27"'],
  'HP Spectre x360 16-f2005TU': ['intitle:"Spectre x360"', 'intitle:"Spectre" intitle:"16"'],
  'HyperX Cloud Alpha Wireless Red': ['intitle:"Cloud Alpha"', 'intitle:"HyperX" intitle:"Cloud"'],
  'HyperX Cloud III Wireless': ['intitle:"Cloud III"', 'intitle:"HyperX" intitle:"Cloud"'],
  'HyperX Cloud III Wireless Red': ['intitle:"Cloud III"', 'intitle:"HyperX" intitle:"Cloud"'],
  'JBL Quantum 910 Wireless': ['intitle:"Quantum 910"', 'intitle:"JBL" intitle:"Quantum"'],
  'Kingston FURY Renegade': ['intitle:"FURY Renegade"', 'intitle:"Kingston" intitle:"FURY"'],
  'Lenovo Legion R32fc-30 32in': ['intitle:"Legion" intitle:"R32"', 'intitle:"Legion R32"'],
  'Lenovo Legion R32fc-30 32in FHD': ['intitle:"Legion" intitle:"R32"', 'intitle:"Legion R32"'],
  'LG UltraGear 27GR95QE 27in': ['intitle:"27GR95QE"', 'intitle:"UltraGear" intitle:"27"', 'intitle:"GR95QE"'],
  'LG UltraGear 27GR95QE 27in OLED': ['intitle:"27GR95QE"', 'intitle:"UltraGear" intitle:"27"', 'intitle:"GR95QE"'],
  'LG UltraGear 32GP950 32in': ['intitle:"32GP950"', 'intitle:"UltraGear" intitle:"32"', 'intitle:"GP950"'],
  'Razer Seiren V2 Pro': ['intitle:"Seiren"', 'intitle:"Razer" intitle:"Seiren"'],
  'Razer Raptor 27in': ['intitle:"Razer" intitle:"Raptor"', 'intitle:"Razer" intitle:"monitor"'],
  'Razer Raptor 27in 2K Tổng hợp': ['intitle:"Razer" intitle:"Raptor"', 'intitle:"Razer" intitle:"monitor"'],
  'Samsung Galaxy Book4 Ultra 16in': ['intitle:"Galaxy Book4"', 'intitle:"Galaxy Book"'],
  'Samsung Odyssey G9 34in': ['intitle:"Odyssey G9"', 'intitle:"Odyssey" intitle:"G9"'],
  'Seagate FireCuda 530': ['intitle:"FireCuda"', 'intitle:"Seagate" intitle:"SSD"'],
  'ViewSonic ColorPro VP3200-3K 32in': ['intitle:"VP3200"', 'intitle:"ColorPro"'],
  'ViewSonic XG272-2K-OLED 27in': ['intitle:"XG272"', 'intitle:"ViewSonic" intitle:"OLED"'],
  'ViewSonic XG272-2K-OLED 27in Gaming': ['intitle:"XG272"', 'intitle:"ViewSonic" intitle:"OLED"'],
  'Zowie XL2546X 24.5in': ['intitle:"XL2546X"', 'intitle:"XL2546"'],
  'Zowie XL2546X 24.5in eSports': ['intitle:"XL2546X"', 'intitle:"XL2546"'],
  'Zowie XL2566K 27in': ['intitle:"XL2566K"', 'intitle:"XL2566"'],
  'AMD Ryzen 9 7950X3D': ['intitle:"7950X3D"', 'intitle:"Ryzen 9" intitle:"AM5"'],
  'AirPods 4 ANC Deep': ['intitle:"AirPods 4"', 'intitle:"AirPods 4"'],
  'AirPods Pro 2 USB-C Deep': ['intitle:"AirPods Pro 2"', 'intitle:"AirPods Pro"'],
};

async function main() {
  const out: Record<string, string[]> = {};
  for (const [model, qs] of Object.entries(QUERIES)) {
    const seen = new Set<string>();
    const list: string[] = [];
    for (const q of qs) {
      for (const f of await search(q)) {
        if (seen.has(f)) continue;
        seen.add(f);
        list.push(f);
      }
    }
    // Thêm prefix search theo từ khoá đầu.
    for (const q of qs) {
      const core = q.replace(/^intitle:"?/, '').replace(/"?$/, '').split('"')[0];
      for (const f of await prefix(core)) {
        if (seen.has(f)) continue;
        seen.add(f);
        list.push(f);
      }
    }
    out[model] = list;
    console.log(`\n### ${model}  (${list.length})`);
    list.slice(0, 20).forEach((f) => console.log(`   ${f}`));
  }
  writeFileSync(
    resolve(process.cwd(), 'scripts/data/intitle-model-probe.json'),
    JSON.stringify(out, null, 2),
    'utf-8',
  );
}

void main();
