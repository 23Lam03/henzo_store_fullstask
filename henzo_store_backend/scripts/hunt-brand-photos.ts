/**
 * SĂN ẢNH SẢN PHẨM: intitle:"<Brand> <Type>" với limit cao + lọc theo model.
 *
 * Mục tiêu: file có tên chứa brand + loại sản phẩm (vd "HyperX headset",
 * "Corsair headset", "Zowie monitor", "UltraGear monitor").
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

async function search(q: string, limit = 100): Promise<string[]> {
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

/** Từ khoá -> cụm intitle thử. */
const HUNT: Record<string, string[]> = {
  headset: [
    'intitle:"HyperX" intitle:headset',
    'intitle:"HyperX Cloud"',
    'intitle:"HyperX" intitle:headphone',
    'intitle:"Corsair" intitle:headset',
    'intitle:"Corsair Void"',
    'intitle:"JBL" intitle:headset',
    'intitle:"SteelSeries" intitle:headset',
    'intitle:"Logitech" intitle:headset',
    'intitle:"Razer" intitle:headset',
    'intitle:"Endgame" intitle:mouse',
    'intitle:"ROG" intitle:mouse',
    'intitle:"Pulsar" intitle:mouse',
    'intitle:"Finalmouse"',
  ],
  monitor: [
    'intitle:"Zowie"',
    'intitle:"UltraGear"',
    'intitle:"Odyssey" intitle:monitor',
    'intitle:"Odyssey G9"',
    'intitle:"Odyssey Neo"',
    'intitle:"AGON"',
    'intitle:"M34WMU"',
    'intitle:"M32U"',
    'intitle:"R32" intitle:Lenovo',
    'intitle:"Xeneon"',
    'intitle:"VP3200"',
    'intitle:"XG27"',
    'intitle:"Omen" intitle:monitor',
  ],
  storage: [
    'intitle:"FireCuda"',
    'intitle:"Renegade" intitle:memory',
    'intitle:"FURY" intitle:memory',
    'intitle:"SN850X"',
    'intitle:"T705"',
  ],
  laptop: [
    'intitle:"Spectre x360"',
    'intitle:"Galaxy Book"',
    'intitle:"Omen" intitle:laptop',
  ],
  other: [
    'intitle:"Harpe" intitle:ASUS',
    'intitle:"ROG Harpe"',
    'intitle:"XM2" intitle:mouse',
    'intitle:"Seiren"',
    'intitle:"7950X3D"',
    'intitle:"AirPods 4"',
    'intitle:"AirPods Pro 2"',
  ],
};

async function main() {
  const out: Record<string, string[]> = {};
  for (const [group, queries] of Object.entries(HUNT)) {
    const seen = new Set<string>();
    const list: string[] = [];
    for (const q of queries) {
      for (const f of await search(q, 100)) {
        if (seen.has(f)) continue;
        seen.add(f);
        list.push(f);
      }
    }
    out[group] = list;
    console.log(`\n### ${group}  (${list.length})`);
    list.forEach((f) => console.log(`   ${f}`));
  }
  writeFileSync(
    resolve(process.cwd(), 'scripts/data/brand-hunt.json'),
    JSON.stringify(out, null, 2),
    'utf-8',
  );
}

void main();
