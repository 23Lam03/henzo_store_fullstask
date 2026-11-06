/**
 * THU THẬP FILE COMMONS THEO PREFIX TÊN + LỌC MÃ MODEL CỤC BỘ.
 *
 * `list=allpages&apnamespace=6&apprefix=<Brand>` trả về MỌI file bắt đầu bằng
 * tên thương hiệu (phân trang). Lọc local bằng mã model -> tìm được ảnh thật
 * của đúng model mà không bị nhiễu từ full-text search.
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const UA = 'henzo-store/1.0 (model image resolver; dev@henzo.local)';

async function getJson(url: string): Promise<any> {
  for (let a = 0; a < 5; a++) {
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

/** Thu thập mọi file Commons bắt đầu bằng prefix (có phân trang). */
export async function harvestPrefix(prefix: string, max = 900): Promise<string[]> {
  const out: string[] = [];
  let cont: string | undefined;
  while (out.length < max) {
    const d = await getJson(
      `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
        `&list=allpages&apnamespace=6&apprefix=${encodeURIComponent(prefix)}` +
        `&aplimit=500${cont ? `&apcontinue=${encodeURIComponent(cont)}` : ''}`,
    );
    const batch = d?.query?.allpages ?? [];
    for (const p of batch) out.push(String(p.title).replace(/^File:/, ''));
    cont = d?.continue?.apcontinue;
    if (!cont || !batch.length) break;
  }
  return out;
}

/** File trong 1 category (đệ quy 1 cấp subcategory). */
export async function harvestCategory(cat: string, deep = false): Promise<string[]> {
  const out: string[] = [];
  const subs: string[] = [];
  const d = await getJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
      `&generator=categorymembers&gcmtitle=Category:${encodeURIComponent(cat)}` +
      `&gcmtype=file|subcat&gcmlimit=500` +
      `&prop=imageinfo&iiprop=mime&iiurlwidth=1000`,
  );
  for (const p of Object.values<any>(d?.query?.pages ?? {})) {
    const title = String(p.title);
    if (title.startsWith('Category:')) {
      subs.push(title.replace(/^Category:/, ''));
      continue;
    }
    const ii = (p.imageinfo ?? [])[0];
    if (!ii?.mime || !/^image\/(jpeg|png|webp|tiff)$/.test(ii.mime)) continue;
    out.push(title.replace(/^File:/, ''));
  }
  if (deep) {
    for (const s of subs.slice(0, 12)) {
      out.push(...(await harvestCategory(s)));
    }
  }
  return out;
}

/** Từ khoá cần có trong tên file (không phân biệt hoa thường). */
const WANT: Record<string, string[]> = {
  'AOC CU34G2X 34in': ['CU34G2X', 'CU34G2'],
  'ASUS ROG Harpe Ace Aim Lab Edition': ['Harpe Ace', 'ROG Harpe', 'Harpe'],
  'Corsair HS60 Wireless': ['HS60', 'HS 60'],
  'Corsair HS60 Wireless Carbon': ['HS60', 'HS 60'],
  'Corsair HS80 RGB USB': ['HS80', 'HS 80'],
  'Corsair HS80 RGB USB Carbon': ['HS80', 'HS 80'],
  'Corsair Xeneon 27QHD240 27in': ['27QHD240', 'Xeneon'],
  'Endgame Gear XM2we Wireless': ['XM2we', 'XM2'],
  'Gigabyte M34WMU 34in': ['M34WMU'],
  'HP Omen 27qs 27in': ['27qs', '27qs-'],
  'HP Omen 27qs 27in QHD': ['27qs'],
  'HP Spectre x360 16-f2005TU': ['Spectre x360 16', 'x360 16', 'Spectre 16'],
  'HyperX Cloud Alpha Wireless Red': ['Cloud Alpha'],
  'HyperX Cloud Alpha Wireless': ['Cloud Alpha'],
  'HyperX Cloud III Wireless': ['Cloud III'],
  'HyperX Cloud III Wireless Red': ['Cloud III'],
  'JBL Quantum 910 Wireless': ['Quantum 910', 'Quantum 2'],
  'Kingston FURY Renegade': ['FURY Renegade', 'Renegade'],
  'Lenovo Legion R32fc-30 32in': ['R32fc', 'Legion R32'],
  'Lenovo Legion R32fc-30 32in FHD': ['R32fc', 'Legion R32'],
  'LG UltraGear 27GR95QE 27in': ['27GR95QE', 'GR95QE'],
  'LG UltraGear 27GR95QE 27in OLED': ['27GR95QE', 'GR95QE'],
  'LG UltraGear 32GP950 32in': ['32GP950', 'GP950'],
  'Razer Seiren V2 Pro': ['Seiren V2', 'Seiren'],
  'Razer Raptor 27in': ['Raptor 27', 'Razer Raptor'],
  'Razer Raptor 27in 2K Tổng hợp': ['Raptor 27', 'Razer Raptor'],
  'Samsung Galaxy Book4 Ultra 16in': ['Galaxy Book4', 'Book4'],
  'Samsung Odyssey G9 34in': ['Odyssey G9', 'Odyssey Neo G9', 'Odyssey OLED G9'],
  'Seagate FireCuda 530': ['FireCuda'],
  'ViewSonic ColorPro VP3200-3K 32in': ['VP3200', 'ColorPro'],
  'ViewSonic XG272-2K-OLED 27in': ['XG272'],
  'ViewSonic XG272-2K-OLED 27in Gaming': ['XG272'],
  'Zowie XL2546X 24.5in': ['XL2546', 'XL2546X'],
  'Zowie XL2546X 24.5in eSports': ['XL2546'],
  'Zowie XL2566K 27in': ['XL2566', 'XL2566K'],
  'AMD Ryzen 9 7950X3D': ['7950X3D'],
  'AirPods 4 ANC Deep': ['AirPods 4', 'Airpods 4'],
  'AirPods Pro 2 USB-C Deep': ['AirPods Pro 2', 'Airpods Pro 2'],
  'Samsung Galaxy Tab S9': ['Galaxy Tab S9', 'Tab S9'],
  'HyperX Cloud III Sumi USB': ['Cloud III'],
};

/** Prefix thương hiệu cần quét. */
const PREFIXES = [
  'AOC ', 'AOC-', 'AOC_', 'AGON ',
  'ROG ', 'ROG-', 'ASUS ROG ',
  'Corsair ', 'CORSAIR ', 'Corsair-',
  'Xeneon ',
  'Endgame ', 'ENDGAME ',
  'Gigabyte ', 'GIGABYTE ', 'M34',
  'OMEN ', 'Omen ',
  'Hp Spectre', 'HP Spectre', 'Spectre x360',
  'HyperX ', 'HYPERX ',
  'JBL ', 'JBL-',
  'Kingston ', 'KINGSTON ',
  'Lenovo ', 'LENOVO ', 'Legion ',
  'LG ', 'Lg ', 'UltraGear ',
  'Razer ', 'RAZER ',
  'Samsung ', 'SAMSUNG ', 'Odyssey ',
  'Seagate ', 'SEAGATE ',
  'ViewSonic ', 'VIEWSONIC ',
  'Zowie ', 'ZOWIE ',
  'Ryzen ', 'AMD Ryzen',
  'AirPods ', 'Airpods ',
  'Galaxy Tab',
];

/** Category Commons liên quan (có thể chứa đúng ảnh model). */
const CATEGORIES = [
  'AMD Ryzen 9 7950X3D',
  'AMD Ryzen 9',
  'Zowie monitors',
  'Zowie',
  'Razer Seiren',
  'Razer mice',
  'HyperX headsets',
  'HyperX Cloud',
  'Corsair headsets',
  'Corsair HS60',
  'Corsair HS80',
  'Samsung Odyssey monitors',
  'ViewSonic monitors',
  'LG UltraGear monitors',
  'AOC monitors',
  'Seagate FireCuda',
  'Kingston FURY',
  'Lenovo Legion monitors',
  'Samsung Galaxy Book',
  'Apple AirPods',
  'Samsung Galaxy Tab S9',
  'Asus ROG mice',
  'Endgame Gear',
  'ViewSonic XG series',
  'AOC AGON',
  'Gigabyte monitors',
];

function match(model: string, file: string): boolean {
  const t = file.toLowerCase();
  return (WANT[model] ?? []).some((k) => t.includes(k.toLowerCase()));
}

async function main() {
  const out: Record<string, string[]> = {};
  const files = new Set<string>();
  console.log('[1] Quét prefix...');
  for (const p of PREFIXES) {
    const list = await harvestPrefix(p);
    console.log(`   ${p.padEnd(16)} -> ${list.length}`);
    for (const f of list) files.add(f);
  }
  console.log(`   Tổng file theo prefix: ${files.size}`);

  console.log('[2] Quét category...');
  const catFiles = new Set<string>();
  for (const c of CATEGORIES) {
    const list = await harvestCategory(c, true);
    if (list.length) {
      console.log(`   ${c.padEnd(28)} -> ${list.length}`);
      for (const f of list) catFiles.add(f);
    }
  }
  console.log(`   Tổng file theo category: ${catFiles.size}`);

  const all = [...new Set([...files, ...catFiles])];
  for (const model of Object.keys(WANT)) {
    out[model] = all.filter((f) => match(model, f));
    console.log(`\n### ${model} -> ${out[model].length}`);
    out[model].slice(0, 15).forEach((f) => console.log(`   ${f}`));
  }
  writeFileSync(
    resolve(process.cwd(), 'scripts/data/prefix-harvest.json'),
    JSON.stringify({ out, allFiles: all }, null, 2),
    'utf-8',
  );
  console.log('\n[done]');
}

void main();
