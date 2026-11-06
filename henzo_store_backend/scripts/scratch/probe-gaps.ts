/**
 * Probe bổ sung cho các khoảng trống còn lại.
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

const QUERIES: Record<string, string[]> = {
  hyperx_hs: ['HyperX Cloud II', 'HyperX headset product', 'HyperX Cloud 2', 'HyperX gaming headphones product'],
  jbl_hs: ['JBL 600BT', 'JBL consumer headset', 'JBL headphones white', 'JBL Live 660BT'],
  razer_mic2: ['Razer microphone black', 'Razer studio microphone'],
  razer_monitor2: ['Razer 27 monitor', 'Razer display'],
  asus_mouse2: ['ROG mouse', 'ASUS ROG Harpe', 'ROG Pugio', 'ASUS mouse gaming'],
  asus_kb2: ['ROG keyboard', 'ASUS ROG Azoth keyboard', 'ROG Strix Scope'],
  steelseries2: ['SteelSeries Arctis 3', 'SteelSeries headset gaming', 'SteelSeries Apex 3', 'SteelSeries Apex Pro'],
  endgame2: ['Endgame Gear XM1', 'Endgame mouse'],
  gigabyte_mon2: ['Gigabyte M27Q', 'Gigabyte monitor 27', 'Gigabyte AORUS monitor product', 'Gigabyte G27F'],
  aoc_agon: ['AOC AGON gaming monitor product', 'AOC curved monitor 34', 'AOC monitor CU34'],
  corsair_ssd2: ['Corsair Force MP600', 'Corsair SSD NVMe product', 'Corsair MP700 PRO'],
  coolermaster2: ['Cooler Master V8', 'Cooler Master MTT G200'],
  deepcool2: ['DeepCool AK620', 'DeepCool cooler tower'],
  logitech_g502x: ['2026 G502 X PLUS'],
  msi_mon2: ['MSI MAG 321UPX', 'MSI monitor curved'],
  gigabyte_ram: ['G.Skill Trident Z5 DDR5', 'Trident Z5 RGB memory', 'G.Skill RAM module'],
  razer_kb: ['Razer Cynara', 'Razer keyboard blackwidow', 'Razer Huntsman'],
  razer_mouse2: ['Razer Viper', 'Razer DeathAdder', 'Razer mouse product'],
  steelseries_mouse: ['SteelSeries Rival mouse', 'SteelSeries Aerox mouse'],
  lg_ultrawide2: ['LG 34 inch ultrawide', 'LG monitor ultrawide'],
  hp_victus: ['HP Victus laptop', 'HP laptop gaming'],
  msi_laptop: ['MSI laptop gaming', 'MSI Raider'],
  asus_vivobook: ['ASUS VivoBook', 'ASUS ZenBook'],
  razer_blade: ['Razer Blade laptop'],
  google_pixel: ['Google Pixel 9', 'Pixel 9 Pro'],
  vivo: ['Vivo X200', 'Vivo phone camera'],
  honor: ['Honor Magic7', 'Honor phone'],
};

async function main() {
  const out: Record<string, any[]> = {};
  for (const [k, qs] of Object.entries(QUERIES)) {
    const seen = new Set<string>();
    const list: any[] = [];
    for (const q of qs) {
      for (const c of await commonsSearch(q)) {
        if (seen.has(c.title)) continue;
        seen.add(c.title);
        list.push(c);
      }
    }
    out[k] = list;
    console.log(`\n### ${k}  (${list.length})`);
    list.slice(0, 14).forEach((c) => console.log(`   ${c.title}`));
  }
  writeFileSync(resolve(process.cwd(), 'scripts/data/commons-gap-probe.json'), JSON.stringify(out, null, 2), 'utf-8');
}

void main();
