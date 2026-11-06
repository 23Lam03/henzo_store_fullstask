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

async function search(query: string, limit = 25): Promise<any[]> {
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
      desc: String(em.ImageDescription?.value ?? '').replace(/<[^>]+>/g, ' ').slice(0, 140),
    });
  }
  return out;
}

const QUERIES: Record<string, string[]> = {
  headset: ['intitle:headset', 'intitle:headphones gaming', 'intitle:gaming headset'],
  mouse: ['intitle:gaming mouse', 'intitle:computer mouse wireless', 'intitle:mouse gaming'],
  keyboard: ['intitle:mechanical keyboard', 'intitle:computer keyboard', 'intitle:gaming keyboard'],
  monitor: ['intitle:computer monitor', 'intitle:gaming monitor', 'intitle:ultrawide monitor'],
  mic: ['intitle:condenser microphone', 'intitle:USB microphone', 'intitle:dynamic microphone'],
  webcam: ['intitle:webcam', 'intitle:web camera'],
  ssd: ['intitle:SSD', 'intitle:solid state drive', 'intitle:NVMe'],
  ram: ['intitle:DDR4 memory module', 'intitle:DDR5', 'intitle:computer memory module'],
  psu: ['intitle:computer power supply', 'intitle:ATX power supply'],
  cooler: ['intitle:CPU cooler', 'intitle:computer cooler heatsink'],
  streamdeck: ['intitle:Stream Deck'],
  laptop: ['intitle:gaming laptop', 'intitle:notebook computer'],
  tablet: ['intitle:tablet computer', 'intitle:iPad'],
  phone: ['intitle:smartphone', 'intitle:mobile phone'],
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
    list.slice(0, 20).forEach((c) => console.log(`   ${c.title}\n      ${c.desc}`));
  }
  writeFileSync(resolve(process.cwd(), 'scripts/data/commons-pool-probe.json'), JSON.stringify(out, null, 2), 'utf-8');
}

void main();
