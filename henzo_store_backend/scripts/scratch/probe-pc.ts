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
  custom_pc: [
    'intitle:Custom Computer', 'intitle:Custom PC', 'intitle:Custom build computer',
    'intitle:PC build', 'intitle:gaming PC', 'intitle:desktop computer build',
    'intitle:computer tower', 'intitle:PC tower',
  ],
  gpu_card: [
    'intitle:GeForce RTX 5090', 'intitle:GeForce RTX 5080', 'intitle:GeForce RTX 4090',
    'intitle:GeForce RTX 4080', 'intitle:GeForce RTX 4070', 'intitle:GeForce RTX 4060',
    'intitle:Palit GeForce', 'intitle:NVIDIA GeForce card',
  ],
  atx_case: [
    'intitle:ATX computer case', 'intitle:computer case', 'intitle:Lian Li case',
    'intitle:Cooler Master case', 'intitle:NZXT case',
  ],
  ssd_more: [
    'intitle:Samsung 990 PRO', 'intitle:Samsung 870', 'intitle:Crucial',
    'intitle:Kingston NV2', 'intitle:WD Black SN850X', 'intitle:Seagate FireCuda',
  ],
  cpu: ['intitle:Ryzen 9 7950X3D', 'intitle:Ryzen 7 7800X3D', 'intitle:Ryzen 5 7600X', 'intitle:Core i9-14900K'],
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
  writeFileSync(resolve(process.cwd(), 'scripts/data/commons-pc-probe.json'), JSON.stringify(out, null, 2), 'utf-8');
}

void main();
