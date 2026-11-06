import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const load = (p: string, fallback: any = {}) => {
  try {
    return JSON.parse(readFileSync(resolve(process.cwd(), p), 'utf-8'));
  } catch {
    return fallback;
  }
};

const imagePools = load('scripts/data/image-pools.json', {});
const expanded = load('scripts/data/expanded-pools.json', {});
const brandPools = load('scripts/data/brand-type-pools.json', {});
const typeFiles = load('scripts/data/type-category-files.json', { __all: [] });
const tree = load('scripts/data/brand-tree.json', { cats: [], files: [] });
const prefix = load('scripts/data/prefix-harvest.json', { allFiles: [] });
const strategy = load('scripts/data/strategy-probe.json', {});

const EXACT: Record<string, string[]> = {
  'AirPods 4 ANC Deep': ['AirPods 4 ANC and case.jpg', 'Airpods 4.jpg', 'AirPods 4 and AirPods Pro 2.jpg'],
  'AirPods Pro 2 USB-C Deep': ['AirPods Pro 2.jpg', 'Airpods Pro 2 in dunkelblau.jpg', 'AirPods Pro 2 in dunkelblauem Case.jpg'],
  'Samsung Galaxy Tab S9': ['Samsung Galaxy Tab S9.png'],
  'HP Spectre x360 16-f2005TU': ['Hp Spectre x360.jpg', 'HP Spectre x360 2016 (31538364704).jpg'],
  'AMD Ryzen 9 7950X3D': ['AMD Ryzen 9 9950X3D2 installed in socket.jpg', 'AMD Ryzen 9 9950X3D - DOVRESTI COMPRARLO¿ (1920p 30fps VP9 LQ-128kbit AAC)-00.01.02.300.png'],
};

const CODES: Record<string, string[]> = {
  'AOC CU34G2X 34in': ['CU34G2X', 'CU34G2', 'CU34'],
  'ASUS ROG Harpe Ace Aim Lab Edition': ['Harpe Ace', 'ROG Harpe', 'Harpe'],
  'Corsair HS60 Wireless': ['HS60'],
  'Corsair HS60 Wireless Carbon': ['HS60'],
  'Corsair HS80 RGB USB': ['HS80'],
  'Corsair HS80 RGB USB Carbon': ['HS80'],
  'Corsair Xeneon 27QHD240 27in': ['27QHD240', 'Xeneon'],
  'Endgame Gear XM2we Wireless': ['XM2we', 'XM2'],
  'Gigabyte M34WMU 34in': ['M34WMU', 'M34'],
  'HP Omen 27qs 27in': ['27qs', 'OMEN 27', 'Omen 27'],
  'HP Omen 27qs 27in QHD': ['27qs', 'OMEN 27', 'Omen 27'],
  'HP Spectre x360 16-f2005TU': ['Spectre x360', 'x360'],
  'HyperX Cloud Alpha Wireless': ['Cloud Alpha'],
  'HyperX Cloud Alpha Wireless Red': ['Cloud Alpha'],
  'HyperX Cloud III Wireless': ['Cloud III', 'Cloud II'],
  'HyperX Cloud III Wireless Red': ['Cloud III', 'Cloud II'],
  'HyperX Cloud III Sumi USB': ['Cloud III', 'Cloud II'],
  'JBL Quantum 910 Wireless': ['Quantum 910', 'Quantum'],
  'Kingston FURY Renegade': ['FURY Renegade', 'Renegade', 'FURY'],
  'Lenovo Legion R32fc-30 32in': ['R32fc', 'Legion R32', 'Legion'],
  'Lenovo Legion R32fc-30 32in FHD': ['R32fc', 'Legion R32', 'Legion'],
  'LG UltraGear 27GR95QE 27in': ['27GR95QE', 'GR95QE', 'UltraGear'],
  'LG UltraGear 27GR95QE 27in OLED': ['27GR95QE', 'GR95QE', 'UltraGear'],
  'LG UltraGear 32GP950 32in': ['32GP950', 'GP950', 'UltraGear'],
  'Razer Seiren V2 Pro': ['Seiren V2', 'Seiren'],
  'Razer Raptor 27in': ['Raptor'],
  'Razer Raptor 27in 2K Tổng hợp': ['Raptor'],
  'Samsung Galaxy Book4 Ultra 16in': ['Galaxy Book4', 'Book4', 'Galaxy Book'],
  'Samsung Odyssey G9 34in': ['Odyssey G9', 'Odyssey Neo G9', 'Odyssey'],
  'Seagate FireCuda 530': ['FireCuda'],
  'ViewSonic ColorPro VP3200-3K 32in': ['VP3200', 'ColorPro'],
  'ViewSonic XG272-2K-OLED 27in': ['XG272'],
  'ViewSonic XG272-2K-OLED 27in Gaming': ['XG272'],
  'Zowie XL2546X 24.5in': ['XL2546', 'XL2566', 'XL24', 'XL25'],
  'Zowie XL2546X 24.5in eSports': ['XL2546', 'XL2566', 'XL24', 'XL25'],
  'Zowie XL2566K 27in': ['XL2566', 'XL2546', 'XL25'],
  'AMD Ryzen 9 7950X3D': ['7950X3D', '9950X3D', 'Ryzen 9'],
  'AirPods 4 ANC Deep': ['AirPods 4'],
  'AirPods Pro 2 USB-C Deep': ['AirPods Pro 2'],
  'Samsung Galaxy Tab S9': ['Galaxy Tab S9', 'Tab S9'],
};

const BRAND_TYPE: Record<string, [string, string]> = {
  'AOC CU34G2X 34in': ['AOC', 'MONITOR'],
  'ASUS ROG Harpe Ace Aim Lab Edition': ['Asus', 'MOUSE'],
  'Corsair HS60 Wireless': ['Corsair', 'HEADSET'],
  'Corsair HS60 Wireless Carbon': ['Corsair', 'HEADSET'],
  'Corsair HS80 RGB USB': ['Corsair', 'HEADSET'],
  'Corsair HS80 RGB USB Carbon': ['Corsair', 'HEADSET'],
  'Corsair Xeneon 27QHD240 27in': ['Corsair', 'MONITOR'],
  'Endgame Gear XM2we Wireless': ['Endgame Gear', 'MOUSE'],
  'Gigabyte M34WMU 34in': ['Gigabyte', 'MONITOR'],
  'HP Omen 27qs 27in': ['HP', 'MONITOR'],
  'HP Omen 27qs 27in QHD': ['HP', 'MONITOR'],
  'HP Spectre x360 16-f2005TU': ['HP', 'LAPTOP'],
  'HyperX Cloud Alpha Wireless': ['HyperX', 'HEADSET'],
  'HyperX Cloud Alpha Wireless Red': ['HyperX', 'HEADSET'],
  'HyperX Cloud III Wireless': ['HyperX', 'HEADSET'],
  'HyperX Cloud III Wireless Red': ['HyperX', 'HEADSET'],
  'HyperX Cloud III Sumi USB': ['HyperX', 'HEADSET'],
  'JBL Quantum 910 Wireless': ['JBL', 'HEADSET'],
  'Kingston FURY Renegade': ['Kingston', 'STORAGE'],
  'Lenovo Legion R32fc-30 32in': ['Lenovo', 'MONITOR'],
  'Lenovo Legion R32fc-30 32in FHD': ['Lenovo', 'MONITOR'],
  'LG UltraGear 27GR95QE 27in': ['LG', 'MONITOR'],
  'LG UltraGear 27GR95QE 27in OLED': ['LG', 'MONITOR'],
  'LG UltraGear 32GP950 32in': ['LG', 'MONITOR'],
  'Razer Seiren V2 Pro': ['Razer', 'MIC'],
  'Razer Raptor 27in': ['Razer', 'MONITOR'],
  'Razer Raptor 27in 2K Tổng hợp': ['Razer', 'MONITOR'],
  'Samsung Galaxy Book4 Ultra 16in': ['Samsung', 'LAPTOP'],
  'Samsung Odyssey G9 34in': ['Samsung', 'MONITOR'],
  'Seagate FireCuda 530': ['Seagate', 'STORAGE'],
  'ViewSonic ColorPro VP3200-3K 32in': ['ViewSonic', 'MONITOR'],
  'ViewSonic XG272-2K-OLED 27in': ['ViewSonic', 'MONITOR'],
  'ViewSonic XG272-2K-OLED 27in Gaming': ['ViewSonic', 'MONITOR'],
  'Zowie XL2546X 24.5in': ['BenQ', 'MONITOR'],
  'Zowie XL2546X 24.5in eSports': ['BenQ', 'MONITOR'],
  'Zowie XL2566K 27in': ['BenQ', 'MONITOR'],
  'AMD Ryzen 9 7950X3D': ['AMD', 'CPU'],
  'AirPods 4 ANC Deep': ['Apple', 'HEADSET'],
  'AirPods Pro 2 USB-C Deep': ['Apple', 'HEADSET'],
  'Samsung Galaxy Tab S9': ['Samsung', 'TABLET'],
};

const NOISE =
  /(booth|gamescom|computex|taigi|expo|show|fair|conference|award|circus|teardown|disassembl|opened|circuit|PCB|schematic|diagram|logo|store|shop|shelf|packaging|package|people|person|\bman\b|\bwoman\b|hand|hands|team|player|esports|event|stage|crowd|portrait|drawing|sketch|illustration|poster|cover|book|church|temple|museum|aircraft|car |bike|train|ship|street|building|park|forest|mountain|beach|festival|concert|sign|street|statue|painting|anime|manga|celebrity|singer|actor|politician|military|regiment|battalion|troops|war |battle|warship|tank|plane|helicopter|ship|railway|locomotive|suv|rally|rugby|football|basketball|baseball|hockey|formula|grand prix)/i;

const WEAK = /(spec tag|box contents|ports |back panel|rear view|stand base|cable|adapter|manual|packaging|warning|label|sticker|close ?up|macro|detail)/i;

const all = new Set<string>();
for (const v of Object.values<any>(imagePools)) if (Array.isArray(v)) v.forEach((f) => all.add(f));
for (const v of Object.values<any>(expanded)) if (Array.isArray(v)) v.forEach((f) => all.add(f));
for (const t of Object.values<any>(brandPools)) {
  for (const v of Object.values<any>(t)) if (Array.isArray(v)) v.forEach((f) => all.add(f));
}
for (const f of typeFiles.__all ?? []) all.add(f);
for (const f of tree.files ?? []) all.add(f);
for (const f of prefix.allFiles ?? []) all.add(f);
for (const v of Object.values<any>(strategy)) {
  for (const f of v?.files ?? []) all.add(f);
  for (const c of v?.cats ?? []) void c;
}

function score(model: string, file: string): number {
  const [brand, type] = BRAND_TYPE[model] ?? ['', ''];
  const t = file.toLowerCase();
  if (NOISE.test(t) || WEAK.test(t)) return -1;
  let s = 0;
  const codes = CODES[model] ?? [];
  for (const c of codes) {
    if (t.includes(c.toLowerCase())) {
      s += 120 - codes.indexOf(c) * 10;
      break;
    }
  }
  if (brand && t.includes(brand.toLowerCase())) s += 45;

  const pool = brandPools[type]?.[brand] ?? [];
  if (pool.includes(file)) s += 30;
  const typePool = (imagePools as any)[type] ?? [];
  if (typePool.includes(file)) s += 18;
  if (s <= 0) return -1;

  s -= Math.min(12, file.length / 12);
  return s;
}

const out: Record<string, Array<{ file: string; score: number }>> = {};
for (const model of Object.keys(BRAND_TYPE)) {
  const scored = [...all]
    .map((f) => ({ file: f, score: score(model, f) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  const exact = (EXACT[model] ?? []).map((f) => ({ file: f, score: 999 }));
  out[model] = [...exact, ...scored.filter((x) => !exact.some((e) => e.file === x.file))].slice(0, 14);
  console.log(`\n### ${model}`);
  out[model].forEach((x) => console.log(`   ${String(x.score).padStart(4)}  ${x.file}`));
}

writeFileSync(
  resolve(process.cwd(), 'scripts/data/best-candidates.json'),
  JSON.stringify(out, null, 2),
  'utf-8',
);
console.log(`\n[done] corpus=${all.size}`);
