/**
 * PROBE Commons cho các model đang có ảnh chính SAI.
 *
 * Chiến lược: prefix (allpages) + CirrusSearch full-text + prefix dạng thương
 * hiệu (vd "XL2546" -> "BenQ XL2546").
 *
 * Chạy: npx tsx scripts/probe-wrong-primary.ts
 */
import { getJson } from '../lib/commons-files';

interface Probe {
  model: string;
  /** Tiền tố thử trên Commons (File namespace). */
  prefixes: string[];
  /** Từ khoá full-text. */
  queries: string[];
}

const PROBES: Probe[] = [
  {
    model: 'Corsair HS60 Wireless',
    prefixes: ['Corsair HS', 'HS60', 'Corsair HS60', 'Corsair headset'],
    queries: ['Corsair HS60', 'Corsair headset'],
  },
  {
    model: 'Corsair HS80 RGB USB',
    prefixes: ['Corsair HS8', 'Corsair headset', 'Corsair VOID', 'Corsair'],
    queries: ['Corsair HS80', 'Corsair headset gaming'],
  },
  {
    model: 'Corsair HS80 RGB USB Carbon',
    prefixes: ['Corsair HS8', 'Corsair headset'],
    queries: ['Corsair HS80'],
  },
  {
    model: 'Corsair Xeneon 27QHD240 27in',
    prefixes: ['Corsair Xeneon', 'Xeneon', 'XENEON'],
    queries: ['Corsair Xeneon monitor'],
  },
  {
    model: 'Endgame Gear XM2we Wireless',
    prefixes: ['Endgame Gear XM', 'XM2we', 'Endgame Gear', 'Endgame'],
    queries: ['Endgame Gear mouse'],
  },
  {
    model: 'Gigabyte M27Q X 27in',
    prefixes: ['M27Q', 'Gigabyte M27', 'Gigabyte monitor', 'M32UC'],
    queries: ['Gigabyte M27Q monitor'],
  },
  {
    model: 'Gigabyte M32UC 32in',
    prefixes: ['M32UC', 'Gigabyte M32', 'Gigabyte monitor'],
    queries: ['Gigabyte M32UC monitor'],
  },
  {
    model: 'HP Omen 27qs 27in',
    prefixes: ['HP Omen', 'Omen 27', 'OMEN 27', 'Omen'],
    queries: ['HP Omen monitor'],
  },
  {
    model: 'HP Omen 27qs 27in QHD',
    prefixes: ['HP Omen', 'Omen 27', 'OMEN 27'],
    queries: ['HP Omen 27 monitor'],
  },
  {
    model: 'HyperX Cloud Alpha Wireless',
    prefixes: ['HyperX Cloud', 'Cloud Alpha', 'HyperX headset'],
    queries: ['HyperX Cloud Alpha headset'],
  },
  {
    model: 'HyperX Cloud III Wireless',
    prefixes: ['HyperX Cloud', 'Cloud III', 'HyperX headset'],
    queries: ['HyperX Cloud III headset'],
  },
  {
    model: 'HyperX Cloud III Wireless Red',
    prefixes: ['HyperX Cloud', 'Cloud III'],
    queries: ['HyperX Cloud III headset red'],
  },
  {
    model: 'Kingston FURY Renegade',
    prefixes: ['Kingston FURY', 'FURY Renegade', 'Kingston SSD'],
    queries: ['Kingston Fury Renegade SSD'],
  },
  {
    model: 'LG UltraGear 27GR95QE 27in',
    prefixes: ['UltraGear', 'Ultra Wide', 'LG UltraGear', 'GR95QE'],
    queries: ['LG UltraGear monitor', 'LG GR95QE'],
  },
  {
    model: 'LG UltraGear 27GR95QE 27in OLED',
    prefixes: ['UltraGear', 'LG UltraGear'],
    queries: ['LG UltraGear OLED monitor'],
  },
  {
    model: 'LG UltraGear 32GP950 32in',
    prefixes: ['UltraGear', 'LG UltraGear', 'GP950'],
    queries: ['LG UltraGear 32GP950'],
  },
  {
    model: 'Razer Seiren V2 Pro',
    prefixes: ['Razer Seiren', 'Seiren', 'Razer mic'],
    queries: ['Razer Seiren V2 microphone'],
  },
  {
    model: 'ViewSonic ColorPro VP3200-3K 32in',
    prefixes: ['ViewSonic VP', 'VP3200', 'ViewSonic ColorPro', 'ViewSonic monitor'],
    queries: ['ViewSonic ColorPro VP3200'],
  },
  {
    model: 'ViewSonic XG272-2K-OLED 27in',
    prefixes: ['ViewSonic XG', 'XG272', 'ViewSonic monitor'],
    queries: ['ViewSonic XG272 OLED'],
  },
  {
    model: 'ViewSonic XG272-2K-OLED 27in Gaming',
    prefixes: ['ViewSonic XG', 'XG272'],
    queries: ['ViewSonic XG272'],
  },
  {
    model: 'Zowie XL2546X 24.5in',
    prefixes: ['Zowie XL', 'XL2546', 'BenQ XL', 'Benq Zowie'],
    queries: ['Zowie XL2546X monitor'],
  },
  {
    model: 'Zowie XL2546X 24.5in eSports',
    prefixes: ['Zowie XL', 'XL2546'],
    queries: ['Zowie XL2546X'],
  },
  {
    model: 'Zowie XL2566K 27in',
    prefixes: ['Zowie XL', 'XL2566', 'BenQ XL'],
    queries: ['Zowie XL2566K'],
  },
  {
    model: 'Zowie XL2566K eSports Monitor',
    prefixes: ['Zowie XL', 'XL2566'],
    queries: ['Zowie XL2566K'],
  },
  {
    model: 'Razer Raptor 27in',
    prefixes: ['Razer Raptor', 'Raptor 27'],
    queries: ['Razer Raptor 27 monitor'],
  },
  {
    model: 'Razer Raptor 27in 2K Tổng hợp',
    prefixes: ['Razer Raptor'],
    queries: ['Razer Raptor 27 monitor'],
  },
  {
    model: 'Samsung 870 EVO',
    prefixes: ['Samsung 870', '870 EVO', '870 QVO', 'SAMSUNG SATA SSD 870'],
    queries: ['Samsung 870 EVO SSD'],
  },
  {
    model: 'Samsung 870 EVO SSD',
    prefixes: ['Samsung 870', '870 EVO', '870 QVO'],
    queries: ['Samsung 870 EVO SSD'],
  },
  {
    model: 'Samsung 990 PRO',
    prefixes: ['Samsung 990', '990 PRO', 'SAMSUNG M.2 NVMe SSD 990'],
    queries: ['Samsung 990 PRO'],
  },
  {
    model: 'Samsung 990 PRO SSD',
    prefixes: ['Samsung 990', '990 PRO'],
    queries: ['Samsung 990 PRO SSD'],
  },
];

async function prefix(p: string): Promise<string[]> {
  const d = await getJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
      `&list=allpages&apnamespace=6&apprefix=${encodeURIComponent(p)}&aplimit=100`,
  );
  return (d?.query?.allpages ?? []).map((x: any) =>
    String(x.title).replace(/^File:/, ''),
  );
}

async function search(q: string): Promise<string[]> {
  const d = await getJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
      `&list=search&srnamespace=6&srlimit=30&srsearch=${encodeURIComponent(q)}`,
  );
  return (d?.query?.search ?? []).map((x: any) =>
    String(x.title).replace(/^File:/, ''),
  );
}

async function main() {
  for (const p of PROBES) {
    const found = new Set<string>();
    for (const pre of p.prefixes) {
      for (const t of await prefix(pre)) found.add(t);
    }
    for (const q of p.queries) {
      for (const t of await search(q)) found.add(t);
    }
    console.log(`\n== ${p.model} (${found.size})`);
    for (const t of [...found].slice(0, 40)) console.log(`   ${t}`);
    await new Promise((s) => setTimeout(s, 250));
  }
}

void main();
