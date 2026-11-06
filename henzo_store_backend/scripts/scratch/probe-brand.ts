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

async function commonsSearch(query: string, limit = 25): Promise<any[]> {
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
  steelseries: ['SteelSeries headset', 'SteelSeries Arctis', 'SteelSeries keyboard', 'SteelSeries mouse', 'Steelseries Aerox', 'SteelSeries Apex'],
  hyperx: ['HyperX headset headphones', 'HyperX Cloud Alpha', 'HyperX gaming headset'],
  jbl: ['JBL headset', 'JBL headphones consumer', 'JBL Tour One'],
  endgame: ['Endgame Gear', 'Endgame Gear mouse XM'],
  keychron: ['Keychron keyboard', 'Keychron K2', 'Keychron low profile keyboard'],
  razer_mic: ['Razer microphone', 'Razer Seiren', 'Razer streamer microphone'],
  razer_monitor: ['Razer monitor gaming', 'Razer Raptor 27', 'Razer 27 inch'],
  elgato: ['Elgato Stream Deck', 'Elgato Wave microphone', 'Elgato capture card'],
  gigabyte_monitor: ['Gigabyte monitor', 'Gigabyte AORUS monitor', 'Gigabyte M32U'],
  aoc_monitor: ['AOC monitor', 'AOC gaming monitor AGON', 'AOC ultrawide'],
  kingston_ram: ['Kingston FURY RAM DDR5', 'Kingston FURY Beast', 'Kingston memory module DDR5'],
  kingston_ssd: ['Kingston NVMe SSD', 'Kingston SSD Fury Renegade'],
  corsair_psu: ['Corsair power supply unit', 'Corsair PSU', 'Corsair RM series'],
  corsair_ssd: ['Corsair SSD MP600', 'Corsair SSD MP700', 'Corsair Force MP'],
  cooler_master: ['Cooler Master CPU cooler', 'Cooler Master Hyper 212', 'Cooler Master heatsink'],
  deepcool: ['DeepCool CPU cooler', 'DeepCool AK400', 'DeepCool AK620'],
  seagate_ssd: ['Seagate FireCuda SSD', 'Seagate NVMe SSD', 'Seagate BarraCuda'],
  wd_ssd: ['WD Blue SN580', 'WD Black SN850X', 'Western Digital NVMe SSD'],
  gskill: ['G.Skill Trident Z5', 'G.Skill Ripjaws DDR5', 'G.Skill memory RGB'],
  xiaomi_phone: ['Xiaomi Redmi phone', 'Xiaomi 14', 'Xiaomi Poco'],
  msft_surface: ['Microsoft Surface Laptop', 'Surface Pro'],
  lg_monitor: ['LG UltraWide monitor', 'LG 34 inch monitor'],
  msi_monitor: ['MSI monitor gaming', 'MSI MAG monitor'],
  logitech_webcam: ['Logitech StreamCam', 'Logitech Brio webcam', 'Logitech C920'],
  elgato_wave: ['Elgato Wave:3', 'Elgato Wave microphone'],
  samsung_tablet: ['Samsung Galaxy Tab S9', 'Galaxy Tab S Ultra'],
  ipad: ['iPad Pro 13-inch M4', 'IPad Air 11-inch (M3)', 'IPad Air M3'],
  roccat: ['ROCCAT keyboard', 'ROCCAT mouse', 'ROCCAT Kone'],
  asus_mouse: ['ASUS ROG Harpe', 'ROG Harpe Ace mouse'],
  asus_keyboard: ['ASUS ROG Azoth', 'ROG Azoth Extreme keyboard'],
  jbl_tour: ['JBL Tour One M2'],
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
    list.slice(0, 18).forEach((c) => console.log(`   ${c.title}`));
  }
  writeFileSync(resolve(process.cwd(), 'scripts/data/commons-brand-probe.json'), JSON.stringify(out, null, 2), 'utf-8');
}

void main();
