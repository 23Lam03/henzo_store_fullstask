/**
 * Probe ảnh Wikipedia (infobox sản phẩm) + Commons theo tên khác cho model thiếu.
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const UA = 'henzo-store/1.0 (model image resolver; dev@henzo.local)';

async function getJson(url: string): Promise<any> {
  for (let a = 0; a < 3; a++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA } });
      if (r.status === 429) {
        await new Promise((s) => setTimeout(s, 2000 * (a + 1)));
        continue;
      }
      if (!r.ok) return null;
      return await r.json();
    } catch {
      await new Promise((s) => setTimeout(s, 800));
    }
  }
  return null;
}

async function wikiMedia(page: string): Promise<any[]> {
  const d = await getJson(
    `https://en.wikipedia.org/api/rest_v1/page/media-list/${encodeURIComponent(page)}`,
  );
  const out: any[] = [];
  for (const it of d?.items ?? []) {
    if (it?.type !== 'image') continue;
    const title = String(it.title ?? '').replace(/^File:/, '');
    if (/vector|logo|icon|diagram|chart|\.svg$/i.test(title)) continue;
    const srcset = it?.srcset ?? [];
    const pick = srcset.find((s: any) => s.scale === 2) ?? srcset.find((s: any) => s.scale === 1) ?? srcset[0];
    if (!pick?.src) continue;
    out.push({ title, url: String(pick.src).startsWith('//') ? `https:${pick.src}` : String(pick.src) });
  }
  return out;
}

async function commonsSearch(query: string, limit = 20): Promise<any[]> {
  const d = await getJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
      `&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(query)}` +
      `&gsrlimit=${limit}&prop=imageinfo&iiprop=url|mime&iiurlwidth=900`,
  );
  const out: any[] = [];
  for (const p of Object.values<any>(d?.query?.pages ?? {})) {
    const ii = (p.imageinfo ?? [])[0];
    if (!ii?.mime || !/^image\/(jpeg|png|webp)$/.test(ii.mime)) continue;
    out.push({ title: String(p.title).replace(/^File:/, ''), url: String(ii.thumburl ?? ii.url) });
  }
  return out;
}

const TARGETS: Record<string, { wiki: string[]; q: string[] }> = {
  'JBL Quantum 910 Wireless': { wiki: ['JBL Quantum (headset)'], q: ['Quantum 910', 'JBL Quantum headset'] },
  'SteelSeries Arctis Nova 7': { wiki: ['SteelSeries Arctis Nova 7'], q: ['Arctis 7'] },
  'SteelSeries Arctis Nova Pro Wireless': { wiki: ['SteelSeries Arctis Nova Pro'], q: ['Arctis Nova'] },
  'HyperX Cloud III Wireless': { wiki: ['HyperX Cloud III'], q: ['HyperX Cloud 3'] },
  'HyperX Cloud Alpha Wireless': { wiki: ['HyperX Cloud Alpha'], q: ['HyperX Cloud Alpha S'] },
  'Endgame Gear XM2we Wireless': { wiki: ['Endgame Gear'], q: ['XM2we', 'XM2w'] },
  'Corsair M75 Wireless': { wiki: ['Corsair Mouse'], q: ['Corsair M75', 'M75 mouse'] },
  'Logitech G502 X Plus Lightspeed': { wiki: ['Logitech G502'], q: ['2026 G502 X PLUS (side view).jpg'] },
  'Keychron K3 Pro Low Profile': { wiki: ['Keychron'], q: ['Keychron K3', 'Keychron Q1'] },
  'Lenovo ThinkPad TrackPoint Keyboard II': { wiki: ['ThinkPad TrackPoint Keyboard'], q: ['Lenovo ThinkPad USB TrackPoint keyboard.jpg'] },
  'Razer Seiren V2 Pro': { wiki: ['Razer Seiren'], q: ['Razer Seiren V2'] },
  'Elgato Stream Deck XL': { wiki: ['Elgato Stream Deck'], q: ['Stream Deck XL', 'Elgato Stream Deck 32'] },
  'Corsair iCUE LINK System Hub': { wiki: ['Corsair Gaming'], q: ['Corsair iCUE LINK System Hub', 'iCUE LINK'] },
  'Razer Raptor 27in': { wiki: ['Razer Inc.'], q: ['Razer Raptor 27', 'Razer Raptor'] },
  'Gigabyte M27Q X 27in': { wiki: ['List of computer monitors'], q: ['M27Q X', 'Gigabyte M27Q'] },
  'Gigabyte M34WMU 34in': { wiki: [], q: ['M34WMU', 'Gigabyte M34'] },
  'Gigabyte M32UC 32in': { wiki: [], q: ['M32UC', 'Gigabyte M32U'] },
  'AOC AGON PRO AG274QZM 27in': { wiki: ['List of computer monitors'], q: ['AG274QZM', 'AGON PRO'] },
  'AOC CU34G2X 34in': { wiki: [], q: ['CU34G2X', 'AOC CU34G2X'] },
  'Kingston FURY Beast DDR5': { wiki: ['Kingston Technology'], q: ['Kingston FURY Beast DDR5', 'FURY Beast DDR5'] },
  'Kingston FURY Renegade': { wiki: [], q: ['Kingston FURY Renegade DDR5'] },
  'Corsair RM850x': { wiki: ['Corsair Gaming'], q: ['Corsair RM850x', 'RM850x'] },
  'Corsair RM750e': { wiki: [], q: ['Corsair RM750e', 'RM750e'] },
  'Corsair MP700 Pro SE': { wiki: [], q: ['Corsair MP700', 'MP700 PRO'] },
  'Cooler Master MTT G200 V2': { wiki: [], q: ['MTT G200 V2', 'Cooler Master MTT'] },
  'DeepCool AK620 Digital': { wiki: [], q: ['AK620 Digital', 'DeepCool AK620'] },
  'Seagate FireCuda 530': { wiki: ['Seagate Technology'], q: ['FireCuda 530', 'Seagate FireCuda'] },
  'Seagate Barracuda Compute': { wiki: [], q: ['BarraCuda Compute'] },
  'Western Digital Blue SN580': { wiki: ['Western Digital'], q: ['WD Blue SN580', 'WD Blue SN770'] },
  'G.Skill Trident Z5 RGB': { wiki: [], q: ['Trident Z5 RGB', 'G.Skill Trident Z5'] },
  'G.Skill Ripjaws S5': { wiki: [], q: ['Ripjaws S5', 'G.Skill Ripjaws V'] },
  'SteelSeries Rival 650 Wireless': { wiki: [], q: ['SteelSeries Rival 650', 'Rival 650'] },
  'AirPods 4 ANC': { wiki: ['AirPods'], q: ['AirPods 4', 'AirPods 4 ANC'] },
  'iPad Air M3 13in': { wiki: ['IPad Air 13-inch (M2)', 'IPad Air'], q: ['iPad Air M3', 'IPad Air 13-inch'] },
  'iPad Pro M4 13in': { wiki: ['IPad Pro 13-inch (M4)'], q: ['M4 iPad Pro series - 1.jpg'] },
};

async function main() {
  const out: Record<string, any[]> = {};
  for (const [model, t] of Object.entries(TARGETS)) {
    const seen = new Set<string>();
    const list: any[] = [];
    for (const w of t.wiki) {
      for (const c of await wikiMedia(w)) {
        if (seen.has(c.title)) continue;
        seen.add(c.title);
        list.push({ ...c, from: 'wiki:' + w });
      }
    }
    for (const q of t.q) {
      for (const c of await commonsSearch(q)) {
        if (seen.has(c.title)) continue;
        seen.add(c.title);
        list.push({ ...c, from: 'q:' + q });
      }
    }
    out[model] = list;
    console.log(`\n### ${model}`);
    list.slice(0, 10).forEach((c) => console.log(`   [${c.from}] ${c.title}`));
  }
  writeFileSync(resolve(process.cwd(), 'scripts/data/commons-probe.json'), JSON.stringify(out, null, 2), 'utf-8');
}

void main();
