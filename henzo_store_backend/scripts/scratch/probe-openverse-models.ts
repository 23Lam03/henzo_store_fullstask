import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const UA = 'henzo-store/1.0 (model image resolver; dev@henzo.local)';

async function getJson(url: string): Promise<any> {
  for (let a = 0; a < 3; a++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA } });
      if (r.status === 429 || r.status >= 500) {
        await new Promise((s) => setTimeout(s, 1200 * (a + 1)));
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

async function ov(query: string, pageSize = 20): Promise<any[]> {
  const d = await getJson(
    `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}` +
      `&page_size=${pageSize}&mature=false`,
  );
  return d?.results ?? [];
}

const STOP = new Set([
  'pro', 'plus', 'max', 'ultra', 'mini', 'air', 'gen', 'series', 'inch', 'in',
  'gaming', 'wireless', 'rgb', 'black', 'white', 'silver', 'grey', 'gray',
  'edition', 'combo', 'package', 'kit', 'deep', 'esports', 'tong', 'hop',
  'with', 'and', 'the', 'for', 'full', 'size', 'type', 'ready', 'silent',
  'build', 'streaming', 'workstation', 'budget', 'arena', 'starter',
]);

function tokens(model: string): string[] {
  return model
    .replace(/[()]/g, ' ')
    .split(/[^A-Za-z0-9.+-]+/)
    .filter((t) => t.length >= 3 && !STOP.has(t.toLowerCase()))
    .sort((a, b) => b.length - a.length);
}

function norm(s: string): string {
  return s.toLowerCase().replace(/[_.()]/g, ' ').replace(/\s+/g, ' ');
}

const MODELS = [
  'AOC CU34G2X 34in',
  'ASUS ROG Harpe Ace Aim Lab Edition',
  'Corsair HS60 Wireless',
  'Corsair HS60 Wireless Carbon',
  'Corsair HS80 RGB USB',
  'Corsair HS80 RGB USB Carbon',
  'Corsair Xeneon 27QHD240 27in',
  'Endgame Gear XM2we Wireless',
  'Gigabyte M34WMU 34in',
  'HP Omen 27qs 27in',
  'HP Omen 27qs 27in QHD',
  'HyperX Cloud Alpha Wireless Red',
  'HyperX Cloud III Wireless',
  'HyperX Cloud III Wireless Red',
  'JBL Quantum 910 Wireless',
  'Kingston FURY Renegade',
  'Lenovo Legion R32fc-30 32in',
  'Lenovo Legion R32fc-30 32in FHD',
  'LG UltraGear 27GR95QE 27in',
  'LG UltraGear 27GR95QE 27in OLED',
  'LG UltraGear 32GP950 32in',
  'Razer Seiren V2 Pro',
  'Razer Raptor 27in',
  'Razer Raptor 27in 2K Tổng hợp',
  'Samsung Galaxy Book4 Ultra 16in',
  'Samsung Odyssey G9 34in',
  'Seagate FireCuda 530',
  'ViewSonic ColorPro VP3200-3K 32in',
  'ViewSonic XG272-2K-OLED 27in',
  'ViewSonic XG272-2K-OLED 27in Gaming',
  'Zowie XL2546X 24.5in',
  'Zowie XL2546X 24.5in eSports',
  'Zowie XL2566K 27in',
  'Gigabyte M32U 32in',
  'Samsung Odyssey Neo G9 34in',
  'ASUS ROG Swift PG27 27in',
  'Razer Viper V3 Pro',
  'SteelSeries Arctis Nova 7',
  'Keychron K2 Pro',
  'G.Skill Trident Z5 RGB',
  'WD Black SN850X',
  'Crucial T705',
  'DeepCool AK620',
  'Arctic Liquid Freezer III',
  'HyperX Cloud II',
  'Corsair HS70',
];

async function probe(model: string): Promise<any[]> {
  const toks = tokens(model);
  const queries = [model, toks[0], toks[1]].filter(Boolean) as string[];
  const seen = new Set<string>();
  const hits: any[] = [];
  const results = await Promise.all(queries.map((q) => ov(q, 20)));
  for (const list of results) {
    for (const r of list) {
      const key = r.id ?? r.url;
      if (seen.has(key)) continue;
      seen.add(key);
      const hay = norm(`${r.title ?? ''} ${r.url ?? ''}`);
      const matched = toks.filter((t) => hay.includes(norm(t)));
      if (!matched.length) continue;
      hits.push({
        title: r.title,
        url: r.url,
        thumb: r.thumbnail ?? r.url,
        creator: r.creator,
        license: `${r.license} ${r.license_version ?? ''}`.trim(),
        source: r.source,
        landing: r.foreign_landing_url,
        matched,
      });
    }
  }
  return hits;
}

async function main() {
  const out: Record<string, any[]> = {};

  const queue = [...MODELS];
  const workers = Array.from({ length: 5 }, async () => {
    while (queue.length) {
      const m = queue.shift()!;
      const hits = await probe(m);
      out[m] = hits;
      console.log(`\n### ${m}  (${hits.length})`);
      hits.slice(0, 10).forEach((h) => console.log(`   [${h.source}] ${h.title}  (${h.matched.join(',')})`));
    }
  });
  await Promise.all(workers);
  writeFileSync(
    resolve(process.cwd(), 'scripts/data/openverse-model-probe.json'),
    JSON.stringify(out, null, 2),
    'utf-8',
  );
  console.log(`\n[done] ${Object.keys(out).length} model`);
}

void main();
