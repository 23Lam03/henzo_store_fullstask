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

async function catFiles(cat: string, limit = 500): Promise<string[]> {
  const out: string[] = [];
  let cont: string | undefined;
  do {
    const d = await getJson(
      `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
        `&generator=categorymembers&gcmtitle=Category:${encodeURIComponent(cat)}` +
        `&gcmtype=file&gcmlimit=200` +
        `${cont ? `&gcmcontinue=${encodeURIComponent(cont)}` : ''}`,
    );
    for (const p of Object.values<any>(d?.query?.pages ?? {})) {
      out.push(String(p.title).replace(/^File:/, ''));
    }
    cont = d?.continue?.gcmcontinue;
  } while (cont && out.length < limit);
  return out;
}

async function subCats(cat: string): Promise<string[]> {
  const d = await getJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
      `&list=categorymembers&cmtitle=Category:${encodeURIComponent(cat)}` +
      `&cmtype=subcat&cmlimit=100`,
  );
  return (d?.query?.categorymembers ?? []).map((c: any) => c.title.replace(/^Category:/, ''));
}

const TYPE_CATS: Record<string, string[]> = {
  HEADSET: ['Headsets', 'Gaming headsets', 'Headsets by brand', 'Headphones'],
  MONITOR: ['Computer monitors', 'LCD monitors', 'Gaming monitors'],
  MOUSE: ['Computer mice', 'Gaming mice', 'Mouse (computing)'],
  KEYBOARD: ['Computer keyboards', 'Gaming keyboards'],
  MIC: ['Microphones'],
  WEBCAM: ['Webcams'],
  STORAGE: ['Solid-state drives', 'Computer storage', 'Hard disk drives'],
  RAM: ['Computer memory', 'DDR SDRAM', 'SO-DIMM', 'DIMM'],
  COOLER: ['Computer cooling', 'CPU coolers'],
  PSU: ['Computer power supply units'],
  GPU: ['Graphics processing units', 'Nvidia graphics cards'],
  PC_CASE: ['Computer cases'],
  LAPTOP: ['Laptops', 'Computer laptops'],
  TABLET: ['Tablet computers'],
  PHONE: ['Smartphones', 'Mobile phones'],
  ACCESSORY: ['Computer mice', 'Computer keyboards', 'USB hubs'],
};

const BRANDS: Record<string, string[]> = {
  HEADSET: ['hyperx', 'corsair', 'jbl', 'steelseries', 'razer', 'logitech', 'sony', 'bose', 'astro', 'sennheiser', 'edifier', 'fantek', 'trust', 'qcy', 'edifier'],
  MONITOR: ['lg', 'aoc', 'asus', 'viewsonic', 'samsung', 'gigabyte', 'lenovo', 'hp', 'benq', 'zowie', 'dell', 'msi', 'corsair', 'razer', 'acer', 'philips', 'xiaomi', 'huawei', 'apple'],
  MOUSE: ['razer', 'logitech', 'pulsar', 'asus', 'steelseries', 'corsair', 'endgame', 'roccat', 'gigabyte', 'mouplus', 'cougar', 'trust', 'nacon', 'glorious', 'zowie', 'logitech'],
  KEYBOARD: ['razer', 'logitech', 'corsair', 'steelseries', 'hyperx', 'keychron', 'asus', 'gigabyte', 'microsoft', 'roccat', 'ducky', 'glorious', 'trust', 'cougar', 'zowie'],
  MIC: ['razer', 'hyperx', 'steelseries', 'logitech', 'corsair', 'elgato', 'blue', 'sennheiser', 'trust', 'fifine', 'audio-technica'],
  WEBCAM: ['logitech', 'razer', 'elgato', 'corsair', 'hp', 'apple', 'sony'],
  STORAGE: ['seagate', 'crucial', 'western digital', 'wd ', 'samsung', 'kingston', 'sabrent', 'corsair', 'solidigm', 'micron'],
  RAM: ['kingston', 'g.skill', 'corsair', 'crucial', 'gigabyte', 'teamgroup', 'samsung', 'adata', 'sillicon', 'lexar'],
  COOLER: ['deepcool', 'arctic', 'noctua', 'thermalright', 'cooler master', 'be quiet', 'nzxt', 'lian li', 'asus', 'corsair'],
  PSU: ['corsair', 'seasonic', 'coolermaster', 'msi', 'super flower', 'be quiet', 'cougar', 'evga', 'asus'],
  GPU: ['nvidia', 'asus', 'msi', 'gigabyte', 'evga', 'zotac', 'sapphire', 'palit', 'gainward', 'asus strix'],
  PC_CASE: ['coolermaster', 'lian li', 'antec', 'aerocool', 'corsair', 'thermaltake', 'fractal', 'nzxt', 'phanteks', 'deepcool', 'system76', 'acer', 'gigabyte'],
  LAPTOP: ['apple', 'samsung', 'asus', 'lenovo', 'acer', 'hp', 'dell', 'microsoft', 'xiaomi', 'huawei', 'lg', 'honor', 'razer', 'framework'],
  TABLET: ['apple', 'samsung', 'lenovo', 'xiaomi', 'huawei', 'microsoft', 'google'],
  PHONE: ['apple', 'samsung', 'xiaomi', 'huawei', 'oppo', 'vivo', 'oneplus', 'honor', 'realme', 'google', 'motorola', 'nokia'],
  ACCESSORY: ['logitech', 'razer', 'corsair', 'elgato', 'anker', 'belkin', 'apple', 'samsung'],
};

const REJECT = new RegExp(
  [
    'wcg', 'grand ?final', 'esport', 'tournament', 'championship', 'booth',
    '\\bperson\\b', '\\bpeople\\b', '\\bman\\b', '\\bwoman\\b', '\\bboy\\b',
    '\\bgirl\\b', 'gamer', 'holding', 'broken', 'cracked', 'damaged', 'poster',
    'advert', 'disassembl', 'teardown', 'pcb', 'chipset', 'raspberry',
    'microbit', 'arduino', 'zipper', 'storage bag', 'palm ?top', '8088',
    'columbia data', 'logo', 'icon', 'diagram', 'chart', 'box',
    'packaging', 'booth', 'stage', 'crowd', 'interview', 'conference',
    'signage', 'wall', 'shelf', 'store front', 'shop front',
  ].join('|'),
  'i',
);

const TYPE_HINT: Record<string, RegExp> = {
  HEADSET: /headset|headphone|earphone|head ?band|headset|micro ?phone/i,
  MONITOR: /monitor|display|screen|flat ?panel/i,
  MOUSE: /\bmouse\b|computer ?mouse|mouse ?(1|2|3)\b/i,
  KEYBOARD: /keyboard|key ?board|tkl|tenkeyless/i,
  MIC: /microphone|\bmic\b|micro ?phone/i,
  WEBCAM: /web ?cam|camera/i,
  STORAGE: /\bssd\b|nvme|m\.2|hard ?disk|hdd|storage|flash ?drive/i,
  RAM: /\bram\b|dimm|sdram|memory|ddr[345]|fury|trident|ripjaws/i,
  COOLER: /cooler|cooling|heatsink|fan |radiator|ak\d|arctic/i,
  PSU: /power ?supply|\bpsu\b|watt|modular/i,
  GPU: /\brtx\b|geforce|graphics ?card|gpu|radeon|quadro/i,
  PC_CASE: /case|tower|chassis|midi|mini ?itx|\bpc\b|computer/i,
  LAPTOP: /laptop|notebook|macbook|thinkpad|ideapad|zenbook|chromebook/i,
  TABLET: /tablet|ipad|galaxy ?tab/i,
  PHONE: /iphone|galaxy|pixel|huawei|xiaomi|redmi|one ?plus|oppo|vivo|honor|mobile ?phone|smartphone/i,
  ACCESSORY: /hub|adapter|charger|dock|cable|mouse|keyboard/i,
};

async function main() {
  const out: Record<string, Record<string, string[]>> = {};
  for (const [type, cats] of Object.entries(TYPE_CATS)) {
    const brands = BRANDS[type] ?? [];
    const pool: Record<string, string[]> = {};
    const allFiles = new Set<string>();
    for (const c of cats) {
      for (const f of await catFiles(c, 800)) allFiles.add(f);
      for (const sc of await subCats(c)) {
        for (const f of await catFiles(sc, 200)) allFiles.add(f);
      }
    }
    const hint = TYPE_HINT[type];
    for (const f of allFiles) {
      if (REJECT.test(f)) continue;
      if (hint && !hint.test(f)) continue;
      const lower = f.toLowerCase();
      for (const b of brands) {
        if (!lower.includes(b)) continue;
        const key = b.trim();
        (pool[key] ??= []).push(f);
        break;
      }
    }
    out[type] = pool;
    console.log(`\n### ${type} (${allFiles.size} file -> ${Object.keys(pool).length} brand)`);
    for (const [b, files] of Object.entries(pool)) {
      console.log(`  ${b}: ${files.length}`);
      files.slice(0, 6).forEach((f) => console.log(`      ${f}`));
    }
  }
  writeFileSync(
    resolve(process.cwd(), 'scripts/data/type-brand-pools.json'),
    JSON.stringify(out, null, 2),
    'utf-8',
  );
}

void main();
