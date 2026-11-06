import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { getJson } from './lib/commons-files';

const TYPE_CATS: Array<[string, RegExp]> = [
  ['HEADSET', /headset|headphone|earphone|earbud|head ?band/i],
  ['MONITOR', /monitor|display/i],
  ['MOUSE', /mouse|mice/i],
  ['KEYBOARD', /keyboard/i],
  ['MIC', /microphone|\bmic\b/i],
  ['WEBCAM', /web ?cam/i],
  ['LAPTOP', /laptop|notebook|netbook|macbook/i],
  ['TABLET', /tablet|\bipad\b/i],
  ['STORAGE', /ssd|nvme|hard ?disk|\bhdd\b|solid ?state|drive/i],
  ['RAM', /\bram\b|dimm|sdram|memory module|ddr[345]/i],
  ['COOLER', /cooler|heatsink|radiator/i],
  ['PSU', /power ?supply/i],
  ['GPU', /geforce|graphics ?card|\bgpu\b|radeon/i],
  ['CPU', /ryzen|core i[3579]|processor|\bcpu\b/i],
  ['PC_CASE', /computer ?case|\btower\b|chassis/i],
  ['ACCESSORY', /adapter|charger|hub|dock|power ?bank|accessor/i],
  ['PHONE', /smartphone|mobile phone|\biphone\b|galaxy [saz]|pixel/i],
];

const BAD_CAT = new RegExp(
  [
    'people|person|\\bman\\b|\\bwoman\\b|\\bboy\\b|\\bgirl\\b|player|gamer',
    'wearing|holding|hands ?on|\\bworn\\b',
    'booth|exhibit|\\bstands?\\b|showroom|exhibition|\\bexpo\\b|convention',
    'conference|tournament|esport|signage|\\bstages?\\b|crowd|audience',
    'games ?show|tokyo game show|tgs\\b|\\bwcg\\b|\\bmlg\\b|\\besl\\b|\\blcs\\b',
    'dreamhack|campus party|lan party|intel extreme|\\bvlog\\b',
    'gaming ?chair|\\bchairs?\\b|office ?chair',
    'logo|\\bicons?\\b|diagram|chart|screenshot|comparison|\\bmaps?\\b',
    'flag|coat of arms',
    'packaging|\\bbox\\b|manual|warranty|sticker|barcode|price ?tag',
    'teardown|disassembl|internals|component|\\bparts?\\b|\\bpcb\\b|circuit',
    'museum|collection|album|book ?cover|poster|painting|drawing|meme',
    'headquarters|office|building|store|shop|company|factory',
    'unboxing|review|tour|interior|\\bkeycaps?\\b|switches|\\bweight\\b',
    'scale|\\bweigh\\b|ruler|coin ?flip',
  ].join('|'),
  'i',
);

const BAD_DESC = new RegExp(
  [
    'booth|exhibit|stand|showroom|exhibition|\\bexpo\\b|convention',
    'conference|tournament|championship|esports|\\bmlg\\b|\\bwcg\\b',
    'tokyo game show|games ?com|computex|it ?month|dreamhack',
    'press ?conference|signage|stage|audience|crowd',
    'wearing|holding|player|gamer|\\bman\\b|\\bwoman\\b|\\bboy\\b|\\bgirl\\b',
    'unboxing|teardown|disassembl|interior|inside',
  ].join('|'),
  'i',
);

const BAD_FILE = new RegExp(
  [
    'booth|gamescom|computex|it ?month|tokyo ?game|showroom|exhibition',
    '\\bstand\\b|\\bstage\\b|crowd|audience|interview|press ?conference|signage',
    'person|people|\\bman\\b|\\bwoman\\b|gamer|player|\\bboy\\b|\\bgirl\\b',
    'unboxing|teardown|disassembl|internals|packaging|box ?content',
    'logo|\\bicon\\b|diagram|chart|screenshot|comparison',
    'review|\\bhands ?on\\b|holding|wearing|\\bworn\\b',
    'epstein|conspiracy|meme|politician|president',
  ].join('|'),
  'i',
);

const ROOT_CATS: Array<{ cat: string; brand: string }> = [

  { cat: 'Corsair headsets', brand: 'Corsair' },
  { cat: 'HyperX headsets', brand: 'HyperX' },
  { cat: 'SteelSeries headsets', brand: 'SteelSeries' },
  { cat: 'Logitech headsets', brand: 'Logitech' },
  { cat: 'Logitech G headsets', brand: 'Logitech' },
  { cat: 'JBL headphones', brand: 'JBL' },
  { cat: 'Bose headphones', brand: 'Bose' },
  { cat: 'Bose headsets', brand: 'Bose' },
  { cat: 'Sennheiser headphones', brand: 'Sennheiser' },
  { cat: 'Sennheiser headsets', brand: 'Sennheiser' },

  { cat: 'BenQ monitors', brand: 'BenQ' },
  { cat: 'BenQ LCD monitors', brand: 'BenQ' },
  { cat: 'LG monitors', brand: 'LG' },
  { cat: 'LG Flatron', brand: 'LG' },
  { cat: 'ViewSonic monitors', brand: 'ViewSonic' },
  { cat: 'ViewSonic CRT monitors', brand: 'ViewSonic' },
  { cat: 'Philips monitors', brand: 'Philips' },
  { cat: 'Philips Brilliance', brand: 'Philips' },
  { cat: 'AOC monitors', brand: 'AOC' },
  { cat: 'AOC LCD monitors', brand: 'AOC' },
  { cat: 'Samsung monitors', brand: 'Samsung' },
  { cat: 'Samsung SyncMaster', brand: 'Samsung' },
  { cat: 'MSI monitors', brand: 'MSI' },
  { cat: 'Dell monitors', brand: 'Dell' },
  { cat: 'Dell UltraSharp', brand: 'Dell' },
  { cat: 'Acer monitors', brand: 'Acer' },
  { cat: 'Acer LCD computer monitors', brand: 'Acer' },
  { cat: 'Acer Predator monitors', brand: 'Acer' },
  { cat: 'ASUS monitors', brand: 'Asus' },
  { cat: 'HP L series monitors', brand: 'HP' },
  { cat: 'HP Compaq monitors', brand: 'HP' },
  { cat: 'HP Pavilion monitors', brand: 'HP' },
  { cat: 'Gigabyte monitors', brand: 'Gigabyte' },
  { cat: 'Razer monitors', brand: 'Razer' },

  { cat: 'Razer mice', brand: 'Razer' },
  { cat: 'Razer DeathAdder', brand: 'Razer' },
  { cat: 'Razer Basilisk V3', brand: 'Razer' },
  { cat: 'Corsair mice', brand: 'Corsair' },
  { cat: 'Logitech mice', brand: 'Logitech' },
  { cat: 'SteelSeries computer mice', brand: 'SteelSeries' },
  { cat: 'Gigabyte mice', brand: 'Gigabyte' },
  { cat: 'ASUS mice', brand: 'Asus' },

  { cat: 'Corsair keyboards', brand: 'Corsair' },
  { cat: 'Razer keyboards', brand: 'Razer' },
  { cat: 'Logitech keyboards', brand: 'Logitech' },
  { cat: 'SteelSeries computer keyboards', brand: 'SteelSeries' },
  { cat: 'ASUS keyboards', brand: 'Asus' },
  { cat: 'Gigabyte keyboards', brand: 'Gigabyte' },

  { cat: 'Sennheiser microphones', brand: 'Sennheiser' },
  { cat: 'Blue Microphones Yeti', brand: 'Blue' },

  { cat: 'Logitech webcams', brand: 'Logitech' },
  { cat: 'Logitech Brio 300', brand: 'Logitech' },
  { cat: 'Logitech StreamCam', brand: 'Logitech' },

  { cat: 'Gigabyte laptops', brand: 'Gigabyte' },
  { cat: 'Gigabyte M912', brand: 'Gigabyte' },
  { cat: 'Samsung laptops', brand: 'Samsung' },
  { cat: 'Samsung netbooks', brand: 'Samsung' },
  { cat: 'MSI laptops', brand: 'MSI' },
  { cat: 'MSI Bravo laptops', brand: 'MSI' },
  { cat: 'MSI Stealth 16', brand: 'MSI' },
  { cat: 'Acer laptops', brand: 'Acer' },
  { cat: 'Acer Aspire laptops', brand: 'Acer' },
  { cat: 'Acer Nitro laptops', brand: 'Acer' },
  { cat: 'Acer Predator laptops', brand: 'Acer' },
  { cat: 'Acer Predator Helios 16', brand: 'Acer' },
  { cat: 'Acer Predator Helios Neo 14', brand: 'Acer' },
  { cat: 'ASUS laptops', brand: 'Asus' },
  { cat: 'ASUS ROG laptops', brand: 'Asus' },
  { cat: 'ASUS ZenBook', brand: 'Asus' },
  { cat: 'Dell laptops', brand: 'Dell' },
  { cat: 'Dell XPS laptops', brand: 'Dell' },
  { cat: 'Dell Inspiron laptops', brand: 'Dell' },
  { cat: 'HP Omen laptops', brand: 'HP' },
  { cat: 'HP Envy laptops', brand: 'HP' },
  { cat: 'HP ProBook', brand: 'HP' },
  { cat: 'LG laptops', brand: 'LG' },
  { cat: 'Razer Blade laptops', brand: 'Razer' },

  { cat: 'Samsung Galaxy Tab', brand: 'Samsung' },
  { cat: 'Samsung Galaxy Tab S8', brand: 'Samsung' },
  { cat: 'Samsung Galaxy Tab S9', brand: 'Samsung' },
  { cat: 'Samsung Galaxy Tab S10', brand: 'Samsung' },
  { cat: 'Microsoft Surface tablets', brand: 'Microsoft' },
  { cat: 'IPad', brand: 'Apple' },
  { cat: 'IPad Air', brand: 'Apple' },
  { cat: 'IPad Pro', brand: 'Apple' },

  { cat: 'Samsung solid state drives', brand: 'Samsung' },
  { cat: 'Samsung 2.5" solid state drives', brand: 'Samsung' },
  { cat: 'Samsung M.2 solid state drives', brand: 'Samsung' },
  { cat: 'Samsung 870 QVO', brand: 'Samsung' },
  { cat: 'Samsung 990 PRO NVMe M.2 SSD', brand: 'Samsung' },
  { cat: 'Kingston solid-state drives', brand: 'Kingston' },
  { cat: 'Kingston Technology RAM DIMMs', brand: 'Kingston' },
  { cat: 'Kingston Technology RAM SO-DIMMs', brand: 'Kingston' },
  { cat: 'Kingston memory products', brand: 'Kingston' },
  { cat: 'Crucial solid state drives', brand: 'Crucial' },
  { cat: 'Seagate hard disks', brand: 'Seagate' },
  { cat: 'Seagate Barracuda', brand: 'Seagate' },
  { cat: 'Western Digital hard drives', brand: 'Western Digital' },
  { cat: 'Western Digital WD Blue hard disk drives', brand: 'Western Digital' },

  { cat: 'Corsair memory modules', brand: 'Corsair' },
  { cat: 'Corsair Vengeance memory', brand: 'Corsair' },
  { cat: 'G.Skill memory', brand: 'Kingston' },

  { cat: 'Noctua (company)', brand: 'Noctua' },
  { cat: 'Arctic (company)', brand: 'Arctic' },
  { cat: 'CPU coolers', brand: 'Corsair' },

  { cat: 'Computer power supplies', brand: 'Corsair' },
  { cat: 'Corsair power supplies', brand: 'Corsair' },

  { cat: 'ASUS graphics cards', brand: 'Asus' },
  { cat: 'ASUS NVIDIA GeForce cards', brand: 'Asus' },
  { cat: 'MSI graphics cards', brand: 'MSI' },
  { cat: 'Gigabyte graphics cards', brand: 'Gigabyte' },
  { cat: 'GeForce RTX 40 series', brand: 'Asus' },
  { cat: 'GeForce RTX 50 series', brand: 'Asus' },

  { cat: 'AMD Ryzen', brand: 'AMD' },
  { cat: 'AMD Ryzen 9000 series', brand: 'AMD' },
  { cat: 'AMD Ryzen 7000 series', brand: 'AMD' },
  { cat: 'AMD Ryzen 9 9950X3D', brand: 'AMD' },
  { cat: 'Intel Core', brand: 'Intel' },
  { cat: 'Intel Core i9', brand: 'Intel' },
  { cat: 'Intel Core i7', brand: 'Intel' },
  { cat: 'Intel Core i5', brand: 'Intel' },

  { cat: 'Computer cases', brand: 'Custom' },
  { cat: 'Corsair computer cases', brand: 'Corsair' },
  { cat: 'Lian Li computer cases', brand: 'Lian Li' },
  { cat: 'Cooler Master computer cases', brand: 'Cooler Master' },
  { cat: 'ASUS computer cases', brand: 'Asus' },

  { cat: 'Anker power banks', brand: 'Anker' },
  { cat: 'Belkin chargers', brand: 'Belkin' },
  { cat: 'Elgato products', brand: 'Elgato' },
  { cat: 'Elgato Stream Deck series', brand: 'Elgato' },
  { cat: 'Corsair accessories', brand: 'Corsair' },
  { cat: 'ASUS ROG Phone', brand: 'Asus' },

  { cat: 'Corsair products', brand: 'Corsair' },
  { cat: 'Corsair Power Supply Units', brand: 'Corsair' },
  { cat: 'Corsair computer cooling fans', brand: 'Corsair' },
  { cat: 'Corsair RAM DIMMs', brand: 'Corsair' },
  { cat: 'Corsair USB flash drives', brand: 'Corsair' },
  { cat: 'Products by SteelSeries', brand: 'SteelSeries' },
  { cat: 'SteelSeries computer mice', brand: 'SteelSeries' },
  { cat: 'SteelSeries computer keyboards', brand: 'SteelSeries' },
  { cat: 'SteelSeries Mousepads', brand: 'SteelSeries' },
  { cat: 'HyperX Fury HX432C16FB4AK2/32', brand: 'HyperX' },
  { cat: 'Samsung 2.5" solid state drives', brand: 'Samsung' },
  { cat: 'Samsung M.2 solid state drives', brand: 'Samsung' },
  { cat: 'Samsung MZ-V9P4T0', brand: 'Samsung' },
  { cat: 'Samsung 830', brand: 'Samsung' },
  { cat: 'Samsung 840', brand: 'Samsung' },
  { cat: 'G.Skill', brand: 'G.Skill' },
  { cat: 'Gigabyte Aorus', brand: 'Gigabyte' },
  { cat: 'ASUS ROG', brand: 'Asus' },
  { cat: 'ASUS Republic of Gamers', brand: 'Asus' },
  { cat: 'Gigabyte AORUS GeForce RTX 4080 16GB MASTER', brand: 'Gigabyte' },
  { cat: 'Razer DeathAdder Elite', brand: 'Razer' },
  { cat: 'Razer Naga', brand: 'Razer' },
  { cat: 'Alienware', brand: 'Dell' },
  { cat: 'Alienware Desktop computers', brand: 'Dell' },
  { cat: 'Acer Predator', brand: 'Acer' },
  { cat: 'Samsung Galaxy Tab S10', brand: 'Samsung' },
  { cat: 'BenQ PhotoVue', brand: 'BenQ' },
  { cat: 'Seagate EXOS X', brand: 'Seagate' },
  { cat: 'Western Digital WD Blue hard disk drives', brand: 'Western Digital' },
  { cat: 'Gigabyte Technology products', brand: 'Gigabyte' },
  { cat: 'ASUS ROG headsets', brand: 'Asus' },
  { cat: 'ASUS ROG Phone', brand: 'Asus' },
  { cat: 'Gigabyte video cards', brand: 'Gigabyte' },
  { cat: 'Gigabyte mobile phones', brand: 'Gigabyte' },
];

const MODEL_CATS: Array<{ cat: string; brand: string; type: string }> = [
  { cat: 'Samsung 870 QVO', brand: 'Samsung', type: 'STORAGE' },
  { cat: 'Samsung 990 PRO NVMe M.2 SSD', brand: 'Samsung', type: 'STORAGE' },
  { cat: 'Samsung Galaxy Tab S9', brand: 'Samsung', type: 'TABLET' },
  { cat: 'Samsung Galaxy Tab S8', brand: 'Samsung', type: 'TABLET' },
  { cat: 'ASUS ROG Phone', brand: 'Asus', type: 'PHONE' },
  { cat: 'ASUS ROG Ally', brand: 'Asus', type: 'PHONE' },
  { cat: 'Acer Predator Helios 16', brand: 'Acer', type: 'LAPTOP' },
  { cat: 'Acer Predator Helios Neo 14', brand: 'Acer', type: 'LAPTOP' },
  { cat: 'Acer Predator monitors', brand: 'Acer', type: 'MONITOR' },
  { cat: 'MSI MPG 272URX QD-OLED', brand: 'MSI', type: 'MONITOR' },
  { cat: 'Logitech G435', brand: 'Logitech', type: 'HEADSET' },
  { cat: 'Logitech G502', brand: 'Logitech', type: 'MOUSE' },
  { cat: 'Logitech StreamCam', brand: 'Logitech', type: 'WEBCAM' },
  { cat: 'Logitech Brio 300', brand: 'Logitech', type: 'WEBCAM' },
  { cat: 'Samsung M.2 solid state drives', brand: 'Samsung', type: 'STORAGE' },
  { cat: 'AMD Ryzen 9 9950X3D', brand: 'AMD', type: 'CPU' },
  { cat: 'Intel Core i9', brand: 'Intel', type: 'CPU' },
  { cat: 'Intel Core i7', brand: 'Intel', type: 'CPU' },
  { cat: 'Samsung 2.5" solid state drives', brand: 'Samsung', type: 'STORAGE' },
  { cat: 'Gigabyte M912', brand: 'Gigabyte', type: 'LAPTOP' },
  { cat: 'Acer Nitro laptops', brand: 'Acer', type: 'LAPTOP' },
  { cat: 'Samsung Galaxy Tab S10', brand: 'Samsung', type: 'TABLET' },
  { cat: 'BenQ PhotoVue', brand: 'BenQ', type: 'MONITOR' },
  { cat: 'Seagate EXOS X', brand: 'Seagate', type: 'STORAGE' },
  { cat: 'Western Digital WD Blue hard disk drives', brand: 'Western Digital', type: 'STORAGE' },
];

async function catMembers(cat: string): Promise<{ files: string[]; subcats: string[] }> {
  const files: string[] = [];
  const subcats: string[] = [];
  let cont = '';
  for (let i = 0; i < 6; i++) {
    const d = await getJson(
      `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
        `&list=categorymembers&cmtitle=${encodeURIComponent(`Category:${cat}`)}` +
        `&cmtype=file|subcat&cmlimit=500${cont ? `&cmcontinue=${cont}` : ''}`,
    );
    for (const m of d?.query?.categorymembers ?? []) {
      if (m.ns === 6) files.push(String(m.title).replace(/^File:/, ''));
      else if (m.ns === 14) subcats.push(String(m.title).replace(/^Category:/, ''));
    }
    cont = d?.continue?.cmcontinue ?? '';
    if (!cont) break;
  }
  return { files, subcats };
}

async function fileCats(
  files: string[],
): Promise<Map<string, { cats: string[]; desc: string }>> {
  const out = new Map<string, { cats: string[]; desc: string }>();
  for (let i = 0; i < files.length; i += 40) {
    const chunk = files.slice(i, i + 40);
    const d = await getJson(
      `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
        `&prop=categories|imageinfo&cllimit=200&iiprop=extmetadata` +
        `&titles=${encodeURIComponent(
          chunk.map((f) => `File:${f}`).join('|'),
        )}`,
    );
    for (const p of Object.values<any>(d?.query?.pages ?? {})) {
      const t = String(p.title ?? '').replace(/^File:/, '');
      const meta = (p.imageinfo ?? [])[0]?.extmetadata ?? {};
      const rawDesc =
        meta.ImageDescription?.value ?? meta.ObjectName?.value ?? '';
      out.set(t, {
        cats: (p.categories ?? []).map((c: any) =>
          c.title.replace(/^Category:/, ''),
        ),
        desc: String(rawDesc).replace(/<[^>]+>/g, ' '),
      });
    }
  }
  return out;
}

function typeFromCat(cat: string): string {
  for (const [t, re] of TYPE_CATS) if (re.test(cat)) return t;
  return '';
}

const TYPE_OVERRIDES: Record<string, string> = {
  'Corsair products': 'PC_CASE',
  'Corsair Power Supply Units': 'PSU',
  'Corsair computer cooling fans': 'COOLER',
  'Corsair RAM DIMMs': 'RAM',
  'Corsair USB flash drives': 'STORAGE',
  'Products by SteelSeries': 'HEADSET',
  'SteelSeries computer mice': 'MOUSE',
  'SteelSeries computer keyboards': 'KEYBOARD',
  'SteelSeries Mousepads': 'ACCESSORY',
  'HyperX Fury HX432C16FB4AK2/32': 'RAM',
  'Samsung 2.5" solid state drives': 'STORAGE',
  'Samsung M.2 solid state drives': 'STORAGE',
  'Samsung MZ-V9P4T0': 'STORAGE',
  'Samsung 830': 'STORAGE',
  'Samsung 840': 'STORAGE',
  'G.Skill': 'RAM',
  'Gigabyte Aorus': 'MONITOR',
  'ASUS ROG': 'MOUSE',
  'ASUS Republic of Gamers': 'MOUSE',
  'Gigabyte AORUS GeForce RTX 4080 16GB MASTER': 'GPU',
  'Razer DeathAdder Elite': 'MOUSE',
  'Razer Naga': 'MOUSE',
  Alienware: 'MONITOR',
  'Alienware Desktop computers': 'PC_CASE',
  'Acer Predator': 'MONITOR',
  'Gigabyte Technology products': 'MONITOR',
  'ASUS ROG headsets': 'HEADSET',
  'Gigabyte video cards': 'GPU',
  'Gigabyte mobile phones': 'PHONE',
};

async function main() {
  const outPath = resolve(process.cwd(), 'scripts/data/product-cat-files.json');
  const result: Record<string, Record<string, string[]>> = {};
  const seen = new Set<string>();

  const add = (type: string, brand: string, files: string[]) => {
    result[type] ??= {};
    result[type][brand] = [...new Set([...(result[type][brand] ?? []), ...files])];
  };

  const processCat = async (
    cat: string,
    brand: string,
    type: string,
    depth = 0,
  ): Promise<void> => {
    const { files, subcats } = await catMembers(cat);
    const direct = files.filter((f) => !BAD_FILE.test(f));

    const goodSubs = subcats.filter((s) => !BAD_CAT.test(s));
    const pool = [...direct];
    if (depth < 2) {
      for (const sub of goodSubs.slice(0, 12)) {
        const info = await catMembers(sub);
        pool.push(...info.files.filter((f) => !BAD_FILE.test(f)));
        await new Promise((s) => setTimeout(s, 100));
      }
    }

    const uniq = [...new Set(pool)];
    const info = await fileCats(uniq.slice(0, 900));
    const clean = uniq.filter((f) => {
      const meta = info.get(f);
      if (!meta) return false;
      if (!meta.cats.length) return false;
      if (meta.cats.some((c) => BAD_CAT.test(c))) return false;
      if (BAD_DESC.test(meta.desc)) return false;
      return true;
    });

    add(type, brand, clean);
    const fresh = clean.filter((f) => !seen.has(f));
    fresh.forEach((f) => seen.add(f));

    console.log(
      `[cat] ${type}/${brand} <- "${cat}": ${files.length}f/${subcats.length}s ` +
        `-> ${clean.length} clean (+${fresh.length})`,
    );
    await new Promise((s) => setTimeout(s, 150));
  };

  for (const r of ROOT_CATS) {
    const type = TYPE_OVERRIDES[r.cat] ?? typeFromCat(r.cat);
    if (!type) {
      console.log(`[cat] BỎ qua "${r.cat}" (không đoán được loại)`);
      continue;
    }
    await processCat(r.cat, r.brand, type);
  }

  for (const m of MODEL_CATS) {
    await processCat(m.cat, m.brand, m.type);
  }

  writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf-8');
  console.log(`\n[cat] Đã lưu ${outPath}`);
  for (const [t, brands] of Object.entries(result)) {
    const total = Object.values(brands).reduce((a, v) => a + v.length, 0);
    console.log(
      `  ${t}: ${total} (${Object.keys(brands).length} brand) -> ` +
        Object.entries(brands)
          .sort((a, b) => b[1].length - a[1].length)
          .map(([b, v]) => `${b}:${v.length}`)
          .join(', '),
    );
  }
}

void main();
