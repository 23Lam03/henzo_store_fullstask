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

async function search(query: string, limit = 30): Promise<any[]> {
  const d = await getJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
      `&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(query)}` +
      `&gsrlimit=${limit}&prop=imageinfo&iiprop=url|mime|extmetadata&iiurlwidth=1000`,
  );
  const out: any[] = [];
  for (const p of Object.values<any>(d?.query?.pages ?? {})) {
    const ii = (p.imageinfo ?? [])[0];
    if (!ii?.mime || !/^image\/(jpeg|png|webp)$/.test(ii.mime)) continue;
    const em = ii.extmetadata ?? {};
    out.push({
      title: String(p.title).replace(/^File:/, ''),
      url: String(ii.thumburl ?? ii.url),
      desc: String(em.ImageDescription?.value ?? '').replace(/<[^>]+>/g, ' ').slice(0, 140),
    });
  }
  return out;
}

async function catFiles(cat: string): Promise<string[]> {
  const out: string[] = [];
  let cont: string | undefined;
  do {
    const d = await getJson(
      `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
        `&generator=categorymembers&gcmtitle=Category:${encodeURIComponent(cat)}` +
        `&gcmtype=file&gcmlimit=100${cont ? `&gcmcontinue=${encodeURIComponent(cont)}` : ''}` +
        `&prop=imageinfo&iiprop=url|mime&iiurlwidth=1000`,
    );
    for (const p of Object.values<any>(d?.query?.pages ?? {})) {
      const ii = (p.imageinfo ?? [])[0];
      if (!ii?.mime || !/^image\/(jpeg|png|webp)$/.test(ii.mime)) continue;
      out.push(String(p.title).replace(/^File:/, ''));
    }
    cont = d?.continue?.gcmcontinue;
  } while (cont && out.length < 400);
  return out;
}

const TARGETS: Record<string, string[]> = {
  'AirPods 4 ANC Deep': ['AirPods 4', 'AirPods 4 ANC'],
  'AirPods Pro 2 USB-C Deep': ['AirPods Pro 2', 'AirPods Pro'],
  'AMD Ryzen 9 7950X3D': ['Ryzen 9 7950X3D', '7950X3D', 'AMD Ryzen 9'],
  'AOC CU34G2X 34in': ['CU34G2X', 'AOC CU34G2X', 'AGON CU34G2X'],
  'ASUS ROG Harpe Ace Aim Lab Edition': ['ROG Harpe Ace', 'Harpe Ace', 'ROG Harpe'],
  'Corsair HS60 Wireless': ['HS60', 'Corsair HS'],
  'Corsair HS60 Wireless Carbon': ['HS60 Carbon', 'HS60'],
  'Corsair HS80 RGB USB': ['HS80', 'Corsair HS80'],
  'Corsair HS80 RGB USB Carbon': ['HS80 Carbon', 'HS80'],
  'Corsair Xeneon 27QHD240 27in': ['Xeneon 27QHD240', 'Xeneon', '27QHD240'],
  'Endgame Gear XM2we Wireless': ['Endgame Gear XM2', 'XM2we', 'XM2'],
  'Gigabyte M34WMU 34in': ['M34WMU', 'M34W', 'Gigabyte M34'],
  'HP Omen 27qs 27in': ['OMEN 27', 'Omen 27qs', 'HP Omen'],
  'HP Omen 27qs 27in QHD': ['OMEN 27', 'HP Omen'],
  'HP Spectre x360 16-f2005TU': ['Spectre x360 16', 'HP Spectre x360', 'Spectre x360'],
  'HyperX Cloud Alpha Wireless Red': ['HyperX Cloud Alpha', 'Cloud Alpha'],
  'HyperX Cloud III Wireless': ['HyperX Cloud III', 'Cloud III'],
  'HyperX Cloud III Wireless Red': ['HyperX Cloud III', 'Cloud III'],
  'JBL Quantum 910 Wireless': ['JBL Quantum 910', 'Quantum 910', 'JBL Quantum'],
  'Kingston FURY Renegade': ['FURY Renegade', 'Kingston Fury', 'Kingston FURY'],
  'Lenovo Legion R32fc-30 32in': ['Legion R32', 'R32fc', 'Legion 32'],
  'Lenovo Legion R32fc-30 32in FHD': ['Legion R32', 'R32fc', 'Legion 32'],
  'LG UltraGear 27GR95QE 27in': ['27GR95QE', 'UltraGear 27', 'GR95QE'],
  'LG UltraGear 27GR95QE 27in OLED': ['27GR95QE', 'UltraGear 27', 'GR95QE'],
  'LG UltraGear 32GP950 32in': ['32GP950', 'GP950', 'UltraGear 32'],
  'PC Budget Gaming RTX 3060 Starter': ['RTX 3060', 'GeForce RTX 3060'],
  'PC Esports Arena RTX 4060 Ti Tournament': ['RTX 4060 Ti', 'GeForce RTX 4060'],
  'PC Gaming RTX 4060 Ti GamingX': ['RTX 4060 Ti', 'GeForce RTX 4060'],
  'PC Gaming RTX 4070 SUPER Midnight': ['RTX 4070 SUPER', 'GeForce RTX 4070'],
  'PC Gaming RTX 4070 Ti SUPER PowerKing': ['RTX 4070 Ti', 'GeForce RTX 4070'],
  'PC Gaming RTX 4080 SUPER Phantom': ['RTX 4080', 'GeForce RTX 4080'],
  'PC Gaming RTX 4090 Phantom Pro': ['RTX 4090', 'GeForce RTX 4090'],
  'PC Gaming RTX 5080 Pro Gamer': ['RTX 5080', 'GeForce RTX 50'],
  'PC Gaming RTX 5090 Supreme': ['RTX 5090', 'GeForce RTX 5090'],
  'PC Mini ITX RTX 4070 Ghost': ['Mini-ITX case', 'Mini ITX computer'],
  'PC Silent Build RTX 4070 Whisper': ['Silent PC', 'Silent computer case', 'Acoustic PC'],
  'PC Streaming Pro RTX 4080 + Dual PC Setup': ['Dual PC setup', 'Streaming setup computer'],
  'PC Streaming RTX 4070 OBS Studio': ['Streaming PC', 'OBS setup'],
  'PC VR Ready RTX 4070 Ti Metaverse': ['VR ready PC', 'VR gaming setup'],
  'PC Workstation RTX 4090 Creator': ['Workstation computer', 'PC workstation'],
  'Razer Raptor 27in': ['Razer Raptor', 'Razer monitor'],
  'Razer Raptor 27in 2K Tổng hợp': ['Razer Raptor', 'Razer 27'],
  'Razer Seiren V2 Pro': ['Seiren V2', 'Razer Seiren'],
  'Samsung Galaxy Book4 Ultra 16in': ['Galaxy Book4 Ultra', 'Galaxy Book4'],
  'Samsung Odyssey G9 34in': ['Odyssey G9', 'Samsung Odyssey G9', 'Odyssey Neo G9'],
  'Seagate FireCuda 530': ['FireCuda 530', 'FireCuda', 'Seagate FireCuda'],
  'ViewSonic ColorPro VP3200-3K 32in': ['VP3200', 'ColorPro', 'ViewSonic ColorPro'],
  'ViewSonic XG272-2K-OLED 27in': ['XG272', 'ViewSonic XG', 'ViewSonic OLED'],
  'ViewSonic XG272-2K-OLED 27in Gaming': ['XG272', 'ViewSonic XG', 'ViewSonic OLED'],
  'Zowie XL2546X 24.5in': ['XL2546X', 'Zowie XL', 'BenQ XL'],
  'Zowie XL2546X 24.5in eSports': ['XL2546X', 'Zowie XL', 'BenQ XL'],
  'Zowie XL2566K 27in': ['XL2566K', 'Zowie XL', 'BenQ XL'],
};

async function main() {
  const out: Record<string, any[]> = {};
  for (const [model, tokens] of Object.entries(TARGETS)) {
    const seen = new Set<string>();
    const list: any[] = [];
    for (const t of tokens) {
      for (const q of [`intitle:${t}`, `${t} intitle:`]) {
        for (const c of await search(q)) {
          if (seen.has(c.title)) continue;
          seen.add(c.title);
          list.push(c);
        }
      }
    }
    out[model] = list;
    console.log(`\n### ${model}  (${list.length})`);
    list.slice(0, 10).forEach((c) => console.log(`   ${c.title}`));
  }
  writeFileSync(
    resolve(process.cwd(), 'scripts/data/missing-model-probe.json'),
    JSON.stringify(out, null, 2),
    'utf-8',
  );
}

void main();
