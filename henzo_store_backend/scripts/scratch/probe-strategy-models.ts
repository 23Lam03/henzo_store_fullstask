/**
 * DÒ ẢNH THẬT — NHIỀU CHIẾN LƯỢC cho các model còn thiếu.
 *
 * Chiến lược:
 *   1. full-text search kèm `filemime:image/*` + từ khoá mã model.
 *   2. search theo "Brand + loại sản phẩm" rồi lọc tên file có mã/series.
 *   3. category search theo tên series.
 * Lọc nhiễu: loại file có dấu hiệu sự kiện / booth / teardown / người.
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const UA = 'henzo-store/1.0 (model image resolver; dev@henzo.local)';
let last = 0;

async function getJson(url: string): Promise<any> {
  for (let a = 0; a < 5; a++) {
    const gap = Date.now() - last;
    if (gap < 280) await new Promise((s) => setTimeout(s, 280 - gap));
    last = Date.now();
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA } });
      if (r.status === 429 || r.status >= 500) {
        await new Promise((s) => setTimeout(s, 2000 * (a + 1)));
        continue;
      }
      if (!r.ok) {
        await new Promise((s) => setTimeout(s, 1500));
        continue;
      }
      return await r.json();
    } catch {
      await new Promise((s) => setTimeout(s, 1200));
    }
  }
  return null;
}

/** Tìm file Commons (bitmap) theo full-text. */
async function files(q: string, limit = 50): Promise<string[]> {
  const d = await getJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
      `&list=search&srsearch=${encodeURIComponent(q + ' filetype:bitmap')}` +
      `&srnamespace=6&srlimit=${limit}`,
  );
  return (d?.query?.search ?? [])
    .map((s: any) => String(s.title).replace(/^File:/, ''))
    .filter((t: string) => !/\.(pdf|djvu|txt|webm|ogv|ogg|svg|stl|zip|gif|tif)$/i.test(t));
}

/** Tìm category. */
async function cats(q: string, limit = 20): Promise<string[]> {
  const d = await getJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
      `&list=search&srsearch=${encodeURIComponent(q)}&srnamespace=14&srlimit=${limit}`,
  );
  return (d?.query?.search ?? []).map((s: any) => String(s.title).replace(/^Category:/, ''));
}

/** File trong category. */
async function catFiles(cat: string, limit = 100): Promise<string[]> {
  const out: string[] = [];
  let cont: string | undefined;
  do {
    const d = await getJson(
      `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
        `&generator=categorymembers&gcmtitle=Category:${encodeURIComponent(cat)}` +
        `&gcmtype=file&gcmlimit=50` +
        `${cont ? `&gcmcontinue=${encodeURIComponent(cont)}` : ''}` +
        `&prop=imageinfo&iiprop=mime&iiurlwidth=1000`,
    );
    for (const p of Object.values<any>(d?.query?.pages ?? {})) {
      const ii = (p.imageinfo ?? [])[0];
      if (!ii?.mime || !/^image\/(jpeg|png|webp|tiff)$/.test(ii.mime)) continue;
      out.push(String(p.title).replace(/^File:/, ''));
    }
    cont = d?.continue?.gcmcontinue;
  } while (cont && out.length < limit);
  return out;
}

/** Dấu hiệu nhiễu: sự kiện, booth, teardown, người, bản vẽ. */
const NOISE =
  /(booth|gamescom|computex|taigi|expo|show |fair|convention|press conference|award|circus|teardown|disassembl|teardown|inside|opened|circuit board|PCB|schematic|diagram|logo|store|shop|shelf|box|packaging|package|people|person|man |woman |hand |hands|team |player |player|esports|event|stage|crowd|portrait|drawing|sketch|illustration|poster|cover)/i;

/** Mã/series đặc trưng của model. */
const SERIES: Record<string, RegExp> = {
  'AOC CU34G2X 34in': /CU34G2|CU34|AGON/i,
  'ASUS ROG Harpe Ace Aim Lab Edition': /harpe|aim ?lab/i,
  'Corsair HS60 Wireless': /HS60|HS ?60/i,
  'Corsair HS60 Wireless Carbon': /HS60|HS ?60/i,
  'Corsair HS80 RGB USB': /HS80|HS ?80/i,
  'Corsair HS80 RGB USB Carbon': /HS80|HS ?80/i,
  'Corsair Xeneon 27QHD240 27in': /27QHD240|Xeneon/i,
  'Endgame Gear XM2we Wireless': /XM2/i,
  'Gigabyte M34WMU 34in': /M34WMU|M34/i,
  'HP Omen 27qs 27in': /OMEN ?27|27qs/i,
  'HP Omen 27qs 27in QHD': /OMEN ?27|27qs/i,
  'HP Spectre x360 16-f2005TU': /spectre|x360/i,
  'HyperX Cloud Alpha Wireless': /cloud ?alpha/i,
  'HyperX Cloud Alpha Wireless Red': /cloud ?alpha/i,
  'HyperX Cloud III Wireless': /cloud ?(ii|iii)/i,
  'HyperX Cloud III Wireless Red': /cloud ?(ii|iii)/i,
  'HyperX Cloud III Sumi USB': /cloud ?(ii|iii)/i,
  'JBL Quantum 910 Wireless': /quantum/i,
  'Kingston FURY Renegade': /renegade|fury/i,
  'Lenovo Legion R32fc-30 32in': /R32fc|Legion.*R32|R32/i,
  'Lenovo Legion R32fc-30 32in FHD': /R32fc|Legion.*R32|R32/i,
  'LG UltraGear 27GR95QE 27in': /27GR95QE|GR95QE|ultragear/i,
  'LG UltraGear 27GR95QE 27in OLED': /27GR95QE|GR95QE|ultragear/i,
  'LG UltraGear 32GP950 32in': /32GP950|GP950|ultragear/i,
  'Razer Seiren V2 Pro': /seiren/i,
  'Razer Raptor 27in': /raptor/i,
  'Razer Raptor 27in 2K Tổng hợp': /raptor/i,
  'Samsung Galaxy Book4 Ultra 16in': /galaxy ?book|book ?4/i,
  'Samsung Odyssey G9 34in': /odyssey/i,
  'Seagate FireCuda 530': /firecuda/i,
  'ViewSonic ColorPro VP3200-3K 32in': /VP3200|colorpro/i,
  'ViewSonic XG272-2K-OLED 27in': /XG272/i,
  'ViewSonic XG272-2K-OLED 27in Gaming': /XG272/i,
  'Zowie XL2546X 24.5in': /XL25|Zowie/i,
  'Zowie XL2546X 24.5in eSports': /XL25|Zowie/i,
  'Zowie XL2566K 27in': /XL25|Zowie/i,
  'AMD Ryzen 9 7950X3D': /7950X3D|Ryzen 9/i,
  'AirPods 4 ANC Deep': /airpods ?4/i,
  'AirPods Pro 2 USB-C Deep': /airpods ?pro ?2/i,
  'Samsung Galaxy Tab S9': /galaxy ?tab ?s9|tab ?s9/i,
};

/** Truy vấn tìm kiếm cho mỗi model (ưu tiên mã cụ thể trước). */
const QUERIES: Record<string, string[]> = {
  'AOC CU34G2X 34in': ['CU34G2X monitor', 'AOC AGON ultrawide monitor', 'AOC gaming monitor'],
  'ASUS ROG Harpe Ace Aim Lab Edition': ['ROG Harpe Ace mouse', 'Asus ROG mouse', 'Harpe Ace Aim Lab'],
  'Corsair HS60 Wireless': ['Corsair HS60 headset', 'Corsair gaming headset', 'Corsair headset'],
  'Corsair HS60 Wireless Carbon': ['Corsair HS60 headset', 'Corsair headset'],
  'Corsair HS80 RGB USB': ['Corsair HS80 headset', 'Corsair gaming headset'],
  'Corsair HS80 RGB USB Carbon': ['Corsair HS80 headset'],
  'Corsair Xeneon 27QHD240 27in': ['Corsair Xeneon monitor', 'Xeneon 27QHD240'],
  'Endgame Gear XM2we Wireless': ['Endgame Gear mouse', 'XM2we'],
  'Gigabyte M34WMU 34in': ['M34WMU monitor', 'Gigabyte ultrawide monitor', 'AORUS ultrawide monitor'],
  'HP Omen 27qs 27in': ['HP Omen 27 monitor', 'OMEN 27qs monitor'],
  'HP Omen 27qs 27in QHD': ['HP Omen 27 monitor'],
  'HP Spectre x360 16-f2005TU': ['HP Spectre x360 16 laptop', 'Spectre x360'],
  'HyperX Cloud Alpha Wireless': ['HyperX Cloud Alpha headset', 'HyperX Cloud headset'],
  'HyperX Cloud Alpha Wireless Red': ['HyperX Cloud Alpha headset'],
  'HyperX Cloud III Wireless': ['HyperX Cloud III headset', 'HyperX Cloud headset'],
  'HyperX Cloud III Wireless Red': ['HyperX Cloud III headset'],
  'HyperX Cloud III Sumi USB': ['HyperX Cloud III headset'],
  'JBL Quantum 910 Wireless': ['JBL Quantum headset', 'JBL gaming headset'],
  'Kingston FURY Renegade': ['Kingston FURY Renegade SSD', 'Kingston FURY SSD', 'FURY Renegade'],
  'Lenovo Legion R32fc-30 32in': ['Legion R32fc-30 monitor', 'Lenovo Legion monitor'],
  'Lenovo Legion R32fc-30 32in FHD': ['Legion R32fc-30 monitor'],
  'LG UltraGear 27GR95QE 27in': ['LG UltraGear 27GR95QE', 'LG UltraGear OLED monitor', 'LG gaming monitor'],
  'LG UltraGear 27GR95QE 27in OLED': ['LG UltraGear 27GR95QE', 'LG UltraGear OLED monitor'],
  'LG UltraGear 32GP950 32in': ['LG UltraGear 32GP950', 'LG UltraGear 32 monitor'],
  'Razer Seiren V2 Pro': ['Razer Seiren V2 microphone', 'Razer microphone'],
  'Razer Raptor 27in': ['Razer Raptor 27 monitor', 'Razer gaming monitor'],
  'Razer Raptor 27in 2K Tổng hợp': ['Razer Raptor 27 monitor'],
  'Samsung Galaxy Book4 Ultra 16in': ['Samsung Galaxy Book4 Ultra laptop', 'Galaxy Book4'],
  'Samsung Odyssey G9 34in': ['Samsung Odyssey G9 monitor', 'Samsung Odyssey monitor'],
  'Seagate FireCuda 530': ['Seagate FireCuda 530 SSD', 'Seagate NVMe SSD', 'Seagate SSD'],
  'ViewSonic ColorPro VP3200-3K 32in': ['ViewSonic VP3200 monitor', 'ViewSonic ColorPro'],
  'ViewSonic XG272-2K-OLED 27in': ['ViewSonic XG272 monitor', 'ViewSonic OLED gaming monitor'],
  'ViewSonic XG272-2K-OLED 27in Gaming': ['ViewSonic XG272 monitor'],
  'Zowie XL2546X 24.5in': ['Zowie XL2546X monitor', 'Zowie esports monitor', 'BenQ Zowie monitor'],
  'Zowie XL2546X 24.5in eSports': ['Zowie XL2546X monitor', 'Zowie esports monitor'],
  'Zowie XL2566K 27in': ['Zowie XL2566K monitor', 'Zowie monitor'],
  'AMD Ryzen 9 7950X3D': ['AMD Ryzen 9 7950X3D', 'Ryzen 9 CPU processor', 'Ryzen 9 X3D'],
  'AirPods 4 ANC Deep': ['AirPods 4', 'AirPods 4 ANC'],
  'AirPods Pro 2 USB-C Deep': ['AirPods Pro 2'],
  'Samsung Galaxy Tab S9': ['Samsung Galaxy Tab S9', 'Galaxy Tab S9 tablet'],
};

async function main() {
  const out: Record<string, { files: string[]; cats: string[] }> = {};
  const queue = Object.entries(QUERIES);
  const workers = Array.from({ length: 4 }, async () => {
    while (queue.length) {
      const [model, qs] = queue.shift()!;
      const re = SERIES[model];
      const found = new Set<string>();
      const catFound = new Set<string>();
      for (const q of qs) {
        for (const f of await files(q, 40)) {
          if (NOISE.test(f)) continue;
          if (!re.test(f)) continue;
          found.add(f);
        }
        for (const c of await cats(q, 12)) {
          if (NOISE.test(c)) continue;
          if (!re.test(c)) continue;
          catFound.add(c);
        }
      }
      // Mở rộng qua category.
      for (const c of [...catFound].slice(0, 10)) {
        for (const f of await catFiles(c)) {
          if (NOISE.test(f)) continue;
          if (!re.test(f)) continue;
          found.add(f);
        }
      }
      out[model] = { files: [...found], cats: [...catFound] };
      console.log(`\n### ${model} -> files=${found.size} cats=${catFound.size}`);
      [...found].slice(0, 15).forEach((f) => console.log(`   F ${f}`));
      [...catFound].slice(0, 6).forEach((c) => console.log(`   C ${c}`));
    }
  });
  await Promise.all(workers);
  writeFileSync(
    resolve(process.cwd(), 'scripts/data/strategy-probe.json'),
    JSON.stringify(out, null, 2),
    'utf-8',
  );
  console.log('\n[done]');
}

void main();
