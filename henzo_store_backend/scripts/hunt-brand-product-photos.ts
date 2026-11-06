import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { getJson } from './lib/commons-files';

interface Hunt {
  brand: string;
  type: string;
    queries: string[];
    must: string[];
    not?: string[];
}

const PRODUCT_CAT = new RegExp(
  [
    'headset|headphone|earphone|earbud',
    'monitor|display|screens?',
    'mouse|mice',
    'keyboard',
    'microphone|\\bmic\\b',
    'web ?cam',
    'laptop|notebook|netbook',
    'tablet',
    'ssd|nvme|hard ?disk|drive',
    'ram|dimm|memory',
    'cooler|heatsink',
    'power ?supply',
    'graphics ?card|geforce',
    'processor|ryzen',
    'computer ?case|tower',
    'smartphone|mobile',
  ].join('|'),
  'i',
);

const BAD_CAT = new RegExp(
  [
    'people|person|\\bman\\b|\\bwoman\\b|player|gamer|wearing|holding',
    'booth|exhibit|\\bstands?\\b|showroom|exhibition|convention|conference',
    'tournament|esport|games ?show|tokyo game show|\\bwcg\\b|\\bmlg\\b',
    'gaming ?chair|\\bchairs?\\b',
    'logo|\\bicon\\b|diagram|chart|screenshot|comparison|\\bmaps?\\b',
    'packaging|\\bbox\\b|manual|warranty|sticker|barcode',
    'teardown|disassembl|internals|component|\\bparts?\\b|\\bpcb\\b|circuit',
    'museum|collection|album|poster|painting|meme',
    'headquarters|office|building|store|shop|company|factory',
    'unboxing|review|interior',
  ].join('|'),
  'i',
);

const BAD_DESC = new RegExp(
  [
    'booth|exhibit|stand|showroom|exhibition|convention',
    'conference|tournament|championship|games ?com|computex|tokyo game show',
    'press ?conference|stage|audience|crowd|wearing|holding|gamer|player',
    'unboxing|teardown|disassembl|interior',
  ].join('|'),
  'i',
);

const HUNTS: Hunt[] = [

  {
    brand: 'Gigabyte',
    type: 'MONITOR',
    queries: [
      'Gigabyte monitor -booth -logo -booth',
      'Gigabyte gaming monitor filetype:bitmap',
      'AORUS monitor filetype:bitmap',
      'M32U OR M27Q OR M34WMU OR M28Q',
      'Gigabyte M32U',
      'Gigabyte M27Q',
    ],
    must: ['gigabyte', 'aorus'],
    not: ['booth', 'logo', 'mainboard', 'motherboard', 'unboxed'],
  },
  {
    brand: 'Gigabyte',
    type: 'LAPTOP',
    queries: ['Gigabyte laptop filetype:bitmap -booth', 'AORUS laptop filetype:bitmap'],
    must: ['gigabyte', 'aorus'],
    not: ['booth', 'logo'],
  },

  {
    brand: 'Razer',
    type: 'MONITOR',
    queries: ['Razer monitor filetype:bitmap', 'Razer Raptor 27', 'Razer display filetype:bitmap'],
    must: ['razer'],
    not: ['booth', 'logo', 'blade', 'edge', 'forge', 'onza', 'controller', 'naga', 'deathadder', 'mouse', 'keyboard'],
  },

  {
    brand: 'HyperX',
    type: 'HEADSET',
    queries: [
      'HyperX headset filetype:bitmap -booth',
      'HyperX Cloud filetype:bitmap',
      'HyperX gaming headset',
      'Cloud II headset filetype:bitmap',
    ],
    must: ['hyperx'],
    not: ['booth', 'logo', 'chair', 'fury', 'ram', 'predator', 'ssd', 'hx4'],
  },

  {
    brand: 'Corsair',
    type: 'HEADSET',
    queries: ['Corsair headset filetype:bitmap -booth', 'Corsair VOID headset', 'Corsair gaming headset filetype:bitmap'],
    must: ['corsair'],
    not: ['booth', 'logo', 'aircraft', 'airship', 'cruise', 'speed racer', 'car', 'ship', 'boat', 'museum', 'painting'],
  },
  {
    brand: 'Corsair',
    type: 'MOUSE',
    queries: ['Corsair mouse filetype:bitmap -booth', 'Corsair M75 OR Katar OR Scimitar OR Nightsword'],
    must: ['corsair'],
    not: ['booth', 'logo', 'aircraft', 'ship', 'boat', 'car'],
  },
  {
    brand: 'Corsair',
    type: 'KEYBOARD',
    queries: ['Corsair keyboard filetype:bitmap -booth', 'Corsair K60 OR K65 OR K70 OR K100'],
    must: ['corsair'],
    not: ['booth', 'logo', 'aircraft', 'ship', 'car'],
  },

  {
    brand: 'SteelSeries',
    type: 'HEADSET',
    queries: ['SteelSeries headset filetype:bitmap -booth', 'Arctis headset filetype:bitmap'],
    must: ['steelseries', 'arctis'],
    not: ['booth', 'logo', 'apex', 'rival'],
  },
  {
    brand: 'SteelSeries',
    type: 'MOUSE',
    queries: ['SteelSeries mouse filetype:bitmap -booth', 'Rival mouse SteelSeries'],
    must: ['steelseries', 'rival'],
    not: ['booth', 'logo', 'faceit'],
  },
  {
    brand: 'SteelSeries',
    type: 'KEYBOARD',
    queries: ['SteelSeries keyboard filetype:bitmap -booth', 'Apex keyboard SteelSeries'],
    must: ['steelseries', 'apex'],
    not: ['booth', 'logo', 'hebrew', 'faceit'],
  },

  {
    brand: 'Endgame Gear',
    type: 'MOUSE',
    queries: ['Endgame Gear mouse filetype:bitmap', 'XM2we', 'Endgame Gear XM'],
    must: ['endgame'],
    not: ['avengers', 'logo', 'endgame ('],
  },

  {
    brand: 'G.Skill',
    type: 'RAM',
    queries: ['G.Skill memory filetype:bitmap -booth', 'G.Skill Trident Z RGB', 'G.Skill Ripjaws'],
    must: ['g.skill', 'trident', 'ripjaws', 'tridentz'],
    not: ['booth', 'logo', 'promotional', 'computex'],
  },

  {
    brand: 'BenQ',
    type: 'MONITOR',
    queries: ['BenQ gaming monitor filetype:bitmap -booth', 'BenQ XL series monitor', 'Zowie XL monitor filetype:bitmap'],
    must: ['benq'],
    not: ['booth', 'logo', 'projector', 'camera', 'printer'],
  },

  {
    brand: 'LG',
    type: 'MONITOR',
    queries: ['LG UltraGear monitor filetype:bitmap', 'LG gaming monitor filetype:bitmap -booth'],
    must: ['lg'],
    not: ['booth', 'logo', 'gram', 'tv', 'phone', 'laptop'],
  },

  {
    brand: 'ViewSonic',
    type: 'MONITOR',
    queries: ['ViewSonic monitor filetype:bitmap -booth', 'ViewSonic ColorPro', 'ViewSonic gaming monitor'],
    must: ['viewsonic'],
    not: ['booth', 'logo', 'stage', 'station', 'gaming show'],
  },

  {
    brand: 'Philips',
    type: 'MONITOR',
    queries: ['Philips monitor filetype:bitmap -booth', 'Philips Brilliance monitor'],
    must: ['philips'],
    not: ['booth', 'logo', 'ambilight', 'wolips', 'television'],
  },

  {
    brand: 'HP',
    type: 'MONITOR',
    queries: ['HP Omen monitor filetype:bitmap', 'OMEN 27 monitor', 'HP gaming monitor filetype:bitmap'],
    must: ['hp', 'omen'],
    not: ['booth', 'logo', 'laptop', 'notebook', 'omen 15'],
  },

  {
    brand: 'Samsung',
    type: 'MONITOR',
    queries: ['Samsung Odyssey monitor filetype:bitmap', 'Samsung gaming monitor filetype:bitmap -booth'],
    must: ['samsung', 'odyssey'],
    not: ['booth', 'logo', 'phone', 'tablet', 'ssd', 'laptop'],
  },

  {
    brand: 'Dell',
    type: 'MONITOR',
    queries: ['Alienware monitor filetype:bitmap', 'AW3225QF', 'Dell gaming monitor filetype:bitmap'],
    must: ['alienware', 'dell'],
    not: ['booth', 'logo', 'desktop', 'laptop', 'area-51'],
  },

  {
    brand: 'MSI',
    type: 'MONITOR',
    queries: ['MSI MAG monitor filetype:bitmap', 'MSI gaming monitor filetype:bitmap -booth'],
    must: ['msi'],
    not: ['booth', 'logo', 'laptop', 'notebook', 'raider', 'katana', 'stealth', 'gaming'],
  },

  {
    brand: 'Asus',
    type: 'MOUSE',
    queries: ['ASUS ROG mouse filetype:bitmap', 'ROG Harpe mouse', 'Asus gaming mouse filetype:bitmap -booth'],
    must: ['asus', 'rog'],
    not: ['booth', 'logo', 'phone', 'ally', 'keyboard', 'laptop'],
  },

  {
    brand: 'Razer',
    type: 'ACCESSORY',
    queries: ['Razer headset filetype:bitmap -booth', 'Razer microphone filetype:bitmap'],
    must: ['razer'],
    not: ['booth', 'logo', 'mouse', 'keyboard', 'blade', 'naga', 'deathadder'],
  },
];

async function search(q: string): Promise<string[]> {
  const d = await getJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
      `&list=search&srnamespace=6&srlimit=50&srsearch=${encodeURIComponent(q)}`,
  );
  return (d?.query?.search ?? []).map((x: any) =>
    String(x.title).replace(/^File:/, ''),
  );
}

async function fileInfo(
  files: string[],
): Promise<Map<string, { cats: string[]; desc: string }>> {
  const out = new Map<string, { cats: string[]; desc: string }>();
  for (let i = 0; i < files.length; i += 40) {
    const chunk = files.slice(i, i + 40);
    const d = await getJson(
      `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
        `&prop=categories|imageinfo&cllimit=200&iiprop=extmetadata` +
        `&titles=${encodeURIComponent(chunk.map((f) => `File:${f}`).join('|'))}`,
    );
    for (const p of Object.values<any>(d?.query?.pages ?? {})) {
      const t = String(p.title ?? '').replace(/^File:/, '');
      const meta = (p.imageinfo ?? [])[0]?.extmetadata ?? {};
      out.set(t, {
        cats: (p.categories ?? []).map((c: any) =>
          c.title.replace(/^Category:/, ''),
        ),
        desc: String(meta.ImageDescription?.value ?? '').replace(/<[^>]+>/g, ' '),
      });
    }
  }
  return out;
}

async function main() {
  const result: Record<string, Record<string, string[]>> = {};
  const seen = new Set<string>();

  for (const h of HUNTS) {
    const cands = new Set<string>();
    for (const q of h.queries) {
      for (const t of await search(q)) cands.add(t);
      await new Promise((s) => setTimeout(s, 120));
    }

    const byName = [...cands].filter((f) => {
      const n = f.toLowerCase();
      if (!h.must.some((m) => n.includes(m))) return false;
      if (h.not?.some((x) => n.includes(x.toLowerCase()))) return false;
      return true;
    });

    const info = await fileInfo(byName.slice(0, 400));
    const clean = byName.filter((f) => {
      const m = info.get(f);
      if (!m) return false;
      if (!m.cats.length) return false;
      if (m.cats.some((c) => BAD_CAT.test(c))) return false;
      if (BAD_DESC.test(m.desc)) return false;
      if (!m.cats.some((c) => PRODUCT_CAT.test(c))) return false;
      return true;
    });

    const fresh = clean.filter((f) => !seen.has(f));
    fresh.forEach((f) => seen.add(f));

    result[h.type] ??= {};
    result[h.type][h.brand] = [
      ...new Set([...(result[h.type][h.brand] ?? []), ...fresh]),
    ];

    console.log(
      `[hunt] ${h.type}/${h.brand}: ${cands.size} cand -> ${byName.length} byName ` +
        `-> ${clean.length} clean (+${fresh.length})`,
    );
    for (const f of clean.slice(0, 10)) console.log(`     ${f}`);
  }

  const outPath = resolve(process.cwd(), 'scripts/data/brand-hunt-files.json');
  writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf-8');
  console.log(`\n[hunt] Đã lưu ${outPath}`);
}

void main();
