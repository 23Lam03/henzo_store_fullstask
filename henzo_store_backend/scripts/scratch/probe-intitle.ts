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
      desc: String(em.ImageDescription?.value ?? '').replace(/<[^>]+>/g, ' ').slice(0, 160),
    });
  }
  return out;
}

const QUERIES: Record<string, string[]> = {
  hyperx_hs: ['intitle:HyperX headset', 'intitle:HyperX headphones', 'intitle:HyperX Cloud', 'intitle:HyperX headset filetype:bitmap'],
  jbl_hs: ['intitle:JBL headset', 'intitle:JBL headphones', 'intitle:JBL Quantum'],
  steelseries_hs: ['intitle:SteelSeries headset', 'intitle:SteelSeries Arctis', 'intitle:Steelseries'],
  steelseries_kb: ['intitle:SteelSeries Apex', 'intitle:SteelSeries keyboard', 'intitle:SteelSeries Apex Pro'],
  steelseries_mouse: ['intitle:SteelSeries Rival', 'intitle:SteelSeries mouse', 'intitle:SteelSeries Aerox'],
  razer_monitor: ['intitle:Razer monitor', 'intitle:Razer Raptor'],
  razer_mic: ['intitle:Razer Seiren', 'intitle:Razer microphone'],
  razer_blade: ['intitle:Razer Blade'],
  endgame: ['intitle:Endgame Gear', 'intitle:XM2'],
  gigabyte_mon: ['intitle:Gigabyte M27Q', 'intitle:Gigabyte M32U', 'intitle:Gigabyte M34', 'intitle:Gigabyte monitor'],
  aoc_agon: ['intitle:AG274QZM', 'intitle:AOC AGON', 'intitle:CU34G2X', 'intitle:AOC curved'],
  kingston_ram: ['intitle:Kingston FURY', 'intitle:FURY Beast', 'intitle:FURY Renegade', 'intitle:Kingston DDR5'],
  kingston_ssd: ['intitle:Kingston NV2', 'intitle:Kingston SSD', 'intitle:Kingston Fury Renegade'],
  corsair_psu: ['intitle:Corsair RM', 'intitle:Corsair power supply', 'intitle:Corsair PSU'],
  corsair_ssd: ['intitle:Corsair MP700', 'intitle:Corsair SSD', 'intitle:Corsair MP600'],
  corsair_mouse: ['intitle:Corsair M75', 'intitle:Corsair mouse', 'intitle:Corsair Katar'],
  coolermaster_g200: ['intitle:MTT G200', 'intitle:Cooler Master G200', 'intitle:MTT'],
  deepcool_ak620: ['intitle:AK620', 'intitle:DeepCool AK', 'intitle:DeepCool cooler'],
  seagate_firecuda: ['intitle:FireCuda', 'intitle:Seagate NVMe', 'intitle:Seagate SSD'],
  wd_sn580: ['intitle:SN580', 'intitle:WD Blue', 'intitle:Western Digital NVMe'],
  gskill: ['intitle:Trident Z5', 'intitle:Ripjaws S5', 'intitle:G.Skill DDR5', 'intitle:Trident Z5 RGB'],
  elgato: ['intitle:Stream Deck', 'intitle:Elgato Wave'],
  keychron: ['intitle:Keychron'],
  asus_mouse: ['intitle:ROG Harpe', 'intitle:Harpe Ace', 'intitle:ASUS mouse'],
  asus_kb: ['intitle:ROG Azoth', 'intitle:Azoth Extreme', 'intitle:ROG keyboard'],
  lg_ultrawide: ['intitle:LG UltraWide', 'intitle:LG 34', 'intitle:LG monitor'],
  msi_monitor: ['intitle:MSI MAG', 'intitle:MSI MPG 271QRX', 'intitle:MSI 321UPX'],
  logitech_cam: ['intitle:Logitech StreamCam', 'intitle:Logitech Brio', 'intitle:Logitech C920'],
  xiaomi: ['intitle:Xiaomi 14', 'intitle:Redmi Note 13', 'intitle:Redmi Note 12'],
  pixel: ['intitle:Pixel 9'],
  surface: ['intitle:Surface Laptop', 'intitle:Microsoft Surface Laptop'],
  ipad: ['intitle:iPad Pro 13', 'intitle:IPad Air 11'],
  samsung_tab: ['intitle:Galaxy Tab S9'],
  asus_vivobook: ['intitle:VivoBook'],
  hyperx_ram: ['intitle:HyperX Fury', 'intitle:HyperX DDR'],
  razer_kb2: ['intitle:Razer Cynara', 'intitle:BlackWidow'],
  microsoft: ['intitle:Surface Laptop 7'],
};

async function main() {
  const out: Record<string, any[]> = {};
  for (const [k, qs] of Object.entries(QUERIES)) {
    const seen = new Set<string>();
    const list: any[] = [];
    for (const q of qs) {
      for (const c of await search(q)) {
        if (seen.has(c.title)) continue;
        seen.add(c.title);
        list.push(c);
      }
    }
    out[k] = list;
    console.log(`\n### ${k}  (${list.length})`);
    list.slice(0, 16).forEach((c) => console.log(`   ${c.title}\n      ${c.desc}`));
  }
  writeFileSync(resolve(process.cwd(), 'scripts/data/commons-intitle-probe.json'), JSON.stringify(out, null, 2), 'utf-8');
}

void main();
