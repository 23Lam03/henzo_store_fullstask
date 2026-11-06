/**
 * Probe bù cho các model còn lại + verify các file dự kiến dùng.
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

async function search(query: string, limit = 20): Promise<any[]> {
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
      desc: String(em.ImageDescription?.value ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120),
      cats: String(em.Categories?.value ?? '').split('|').slice(0, 4),
    });
  }
  return out;
}

const QUERIES: Record<string, string[]> = {
  logitech_c920: ['intitle:C920', 'Logitech C920 webcam'],
  samsung_adapter: ['intitle:Samsung charger', 'intitle:Samsung power adapter', 'Samsung 45W charger'],
  samsung_tablet2: ['intitle:Galaxy Tab S9'],
  gigabyte_mon2: ['intitle:Gigabyte monitor', 'intitle:GS27F', 'intitle:GE27U', 'intitle:G32U'],
  asus_tuf2: ['intitle:TUF Gaming', 'intitle:VG32AQL3A', 'intitle:ASUS VG32'],
  razer_kb3: ['intitle:Razer Cynara', 'intitle:Razer Huntsman V3'],
  razer_mic3: ['intitle:Razer Seiren', 'intitle:Razer microphone'],
  msi_mon3: ['intitle:MSI Optix', 'intitle:MSI MAG 321UPX', 'intitle:MSI MPG 271QRX'],
  lg_ultrawide3: ['intitle:LG 34GP950', 'intitle:LG UltraGear'],
  corsair_more: ['intitle:Corsair RM850x', 'intitle:Corsair MP700', 'intitle:Corsair K100'],
  roccat_more: ['intitle:ROCCAT', 'intitle:Kone XP', 'intitle:Vulcan II'],
  asus_mouse3: ['intitle:ROG Harpe', 'intitle:Harpe Ace', 'intitle:ASUS mouse'],
  asus_kb3: ['intitle:ROG Azoth', 'intitle:Azoth Extreme'],
  steam_link: ['intitle:Stream Deck XL'],
  keychron_k3: ['intitle:Keychron K3', 'intitle:Keychron K1 v2', 'intitle:Keychron Q1'],
  seagate_ssd2: ['intitle:FireCuda', 'intitle:Seagate SSD'],
  wd_ssd2: ['intitle:WD Blue SN580', 'intitle:SN770', 'intitle:SN850X'],
  gigabyte_ram2: ['intitle:Trident Z5', 'intitle:Ripjaws S5'],
  cooler2: ['intitle:Cooler Master Hyper', 'intitle:MTT G200'],
  deepcool2: ['intitle:DeepCool AK620', 'intitle:DeepCool AK400', 'intitle:DeepCool cooler'],
  jbl2: ['intitle:JBL', 'intitle:JBL Quantum', 'intitle:JBL Tour'],
  hyperx_hs2: ['intitle:HyperX'],
  steel_hs2: ['intitle:SteelSeries'],
  endgame2: ['intitle:Endgame'],
  razer_mon2: ['intitle:Razer'],
  logitech_g502x2: ['intitle:G502'],
  lg_um4: ['intitle:LG monitor'],
};

async function main() {
  const out: Record<string, any[]> = {};
  const seen = new Set<string>();
  for (const [k, qs] of Object.entries(QUERIES)) {
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
    list.slice(0, 25).forEach((c) => console.log(`   ${c.title}\n      ${c.desc}\n      ${c.cats.join(' | ')}`));
  }
  writeFileSync(resolve(process.cwd(), 'scripts/data/commons-last-probe.json'), JSON.stringify(out, null, 2), 'utf-8');
}

void main();
