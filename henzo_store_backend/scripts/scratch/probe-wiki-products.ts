import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const UA = 'henzo-store/1.0 (model image resolver; dev@henzo.local)';

async function getJson(url: string): Promise<any> {
  for (let a = 0; a < 4; a++) {
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

const LANGS = ['en', 'de', 'fr', 'es', 'ja', 'zh', 'pl', 'ru', 'it', 'pt'];

async function wikiHit(model: string, lang: string) {
  const d = await getJson(
    `https://${lang}.wikipedia.org/w/api.php?action=query&format=json` +
      `&generator=search&gsrsearch=${encodeURIComponent(model)}&gsrlimit=6` +
      `&prop=pageimages|info&piprop=thumbnail|name&pithumbsize=1000&inprop=url`,
  );
  const out: Array<{ title: string; thumb: string | null; pageid: number }> = [];
  for (const p of Object.values<any>(d?.query?.pages ?? {})) {
    out.push({
      title: String(p.title),
      thumb: p?.thumbnail?.source ?? null,
      pageid: Number(p.pageid ?? 0),
    });
  }
  return out;
}

async function commonsFileFor(
  title: string,
  lang: string,
): Promise<{ file: string; url: string } | null> {
  const d = await getJson(
    `https://${lang}.wikipedia.org/w/api.php?action=query&format=json` +
      `&titles=${encodeURIComponent(title)}&prop=pageimages&piprop=name&redirects=1`,
  );
  const p = Object.values<any>(d?.query?.pages ?? {})[0];
  const name = p?.pageimage ?? null;
  if (!name) return null;

  const c = await getJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
      `&titles=${encodeURIComponent(`File:${name}`)}&prop=imageinfo&iiprop=url|mime&iiurlwidth=1000`,
  );
  const cp = Object.values<any>(c?.query?.pages ?? {})[0];
  const ii = (cp?.imageinfo ?? [])[0];
  if (!ii || !/^image\/(jpeg|png|webp|tiff)$/.test(String(ii.mime))) return null;
  return { file: String(cp.title).replace(/^File:/, ''), url: String(ii.thumburl ?? ii.url) };
}

const MODELS: string[] = [
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
  'HP Spectre x360 16-f2005TU',
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
  'AMD Ryzen 9 7950X3D',
  'AirPods 4 ANC Deep',
  'AirPods Pro 2 USB-C Deep',
  'HyperX Cloud Alpha Wireless',
  'Samsung Galaxy Tab S9',
];

function codeOf(model: string): string {
  const m = model.replace(/\s+\d+(\.\d+)?in\b/i, '').trim();
  const parts = m.split(/\s+/).filter((w) => !/^(wireless|rgb|usb|gaming|esports|carbon|qhd|oled|pro|plus|max|mini|deep|2k|tổng|hợp|in)$/i.test(w));
  return parts.join(' ').trim() || m;
}

async function main() {
  const out: Record<string, any> = {};
  const queue = [...MODELS];
  const workers = Array.from({ length: 5 }, async () => {
    while (queue.length) {
      const model = queue.shift()!;
      const code = codeOf(model);
      const hits: any[] = [];
      for (const lang of LANGS) {
        const pages = await wikiHit(code, lang);
        for (const p of pages) {
          if (!p.thumb) continue;

          const t = p.title.toLowerCase();
          const key = code
            .toLowerCase()
            .split(/\s+/)
            .filter((w) => w.length >= 3)
            .slice(-1)[0];
          if (!key || !t.includes(key)) continue;
          const cf = await commonsFileFor(p.title, lang);
          hits.push({ lang, title: p.title, file: cf?.file ?? null, url: cf?.url ?? p.thumb });
        }
        if (hits.length >= 3) break;
      }
      out[model] = hits;
      console.log(`\n### ${model}  (code="${code}") -> ${hits.length}`);
      for (const h of hits.slice(0, 8)) {
        console.log(`   [${h.lang}] ${h.title}  ::  ${h.file ?? h.url}`);
      }
    }
  });
  await Promise.all(workers);
  writeFileSync(
    resolve(process.cwd(), 'scripts/data/wiki-product-probe.json'),
    JSON.stringify(out, null, 2),
    'utf-8',
  );
  console.log('\n[done]');
}

void main();
