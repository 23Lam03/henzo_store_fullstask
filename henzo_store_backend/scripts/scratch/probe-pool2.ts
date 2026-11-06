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
      desc: String(em.ImageDescription?.value ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 110),
      cats: String(em.Categories?.value ?? '').split('|').slice(0, 4),
    });
  }
  return out;
}

const QUERIES: Record<string, string[]> = {
  monitor_more: [
    'intitle:ASUS monitor', 'intitle:BenQ monitor', 'intitle:ViewSonic monitor',
    'intitle:Philips monitor', 'intitle:Dell monitor', 'intitle:Samsung monitor',
    'intitle:LG monitor', 'intitle:MSI monitor', 'intitle:Acer monitor',
    'intitle:HP monitor', 'intitle:iiyama monitor', 'intitle:Samsung Odyssey',
    'intitle:ASUS ROG Swift', 'intitle:MSI Optix', 'intitle:MSI MAG',
  ],
  corsair_kb: ['intitle:Corsair K65', 'intitle:Corsair K60', 'intitle:Corsair K70', 'intitle:Corsair K100', 'intitle:Corsair keyboard'],
  corsair_mouse: ['intitle:Corsair mouse', 'intitle:Corsair Katar', 'intitle:Corsair Scimitar', 'intitle:Corsair M65', 'intitle:Corsair Nightspear'],
  pc_case: ['intitle:computer case', 'intitle:PC case', 'intitle:desktop computer case', 'intitle:mid tower case'],
  power_supply: ['intitle:computer power supply unit', 'intitle:PSU computer', 'intitle:ATX power supply'],
  mic_more: ['intitle:USB microphone', 'intitle:Blue Yeti', 'intitle:streaming microphone'],
  streamdeck_more: ['intitle:Stream Deck', 'intitle:Elgato'],
  logitech_webcam_more: ['intitle:Logitech webcam', 'intitle:Logitech Brio', 'intitle:Logitech StreamCam', 'intitle:Logitech C920'],
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
    list.slice(0, 40).forEach((c) => console.log(`   ${c.title}\n      ${c.desc}\n      ${c.cats.join(' | ')}`));
  }
  writeFileSync(resolve(process.cwd(), 'scripts/data/commons-pool2-probe.json'), JSON.stringify(out, null, 2), 'utf-8');
}

void main();
