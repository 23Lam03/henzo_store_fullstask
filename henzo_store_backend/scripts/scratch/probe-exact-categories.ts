import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const UA = 'henzo-store/1.0 (model image resolver; dev@henzo.local)';

async function getJson(url: string): Promise<any> {
  for (let a = 0; a < 4; a++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA } });
      if (r.status === 429 || r.status >= 500) {
        await new Promise((s) => setTimeout(s, 1500 * (a + 1)));
        continue;
      }
      if (!r.ok) return null;
      return await r.json();
    } catch {
      await new Promise((s) => setTimeout(s, 900));
    }
  }
  return null;
}

async function catFiles(cat: string): Promise<string[]> {
  const d = await getJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
      `&generator=categorymembers&gcmtitle=Category:${encodeURIComponent(cat)}` +
      `&gcmtype=file&gcmlimit=100` +
      `&prop=imageinfo&iiprop=url|mime&iiurlwidth=1000`,
  );
  const out: string[] = [];
  for (const p of Object.values<any>(d?.query?.pages ?? {})) {
    const ii = (p.imageinfo ?? [])[0];
    if (!ii?.mime || !/^image\/(jpeg|png|webp)$/.test(ii.mime)) continue;
    out.push(String(p.title).replace(/^File:/, ''));
  }
  return out;
}

async function catExists(cat: string): Promise<boolean> {
  const d = await getJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
      `&titles=${encodeURIComponent(`Category:${cat}`)}&prop=categoryinfo`,
  );
  const p = Object.values<any>(d?.query?.pages ?? {})[0];
  return !!p && !('missing' in p);
}

function variants(model: string): string[] {
  const v = new Set<string>();
  const base = model.trim();
  v.add(base);

  v.add(base.replace(/\s+(Deep|Esports?)$/i, ''));
  v.add(base.replace(/\s+\d+(\.\d+)?in.*$/i, ''));
  v.add(base.replace(/\s+.*$/, ''));

  for (const s of [...v]) {
    v.add(
      s.normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim(),
    );
  }
  return [...v].filter(Boolean);
}

const MODELS = [
  'AMD Ryzen 9 7950X3D', 'AMD Ryzen 7 7800X3D', 'AMD Ryzen 5 7600X',
  'AirPods 4', 'AirPods Pro 2',
  'AOC CU34G2X', 'AOC AGON',
  'ASUS ROG Harpe Ace', 'ROG Harpe Ace',
  'Corsair HS60', 'Corsair HS80', 'Corsair Void', 'Corsair Xeneon',
  'Endgame Gear XM2', 'Endgame Gear',
  'Gigabyte M34WMU', 'Gigabyte M32U', 'Gigabyte M27Q', 'Gigabyte AORUS',
  'HP Omen 27', 'HP Omen 32', 'HP Omen', 'HP Spectre x360 16', 'HP Spectre x360',
  'HyperX Cloud Alpha', 'HyperX Cloud III', 'HyperX Cloud II', 'HyperX Cloud',
  'JBL Quantum 910', 'JBL Quantum', 'JBL',
  'Kingston Fury Renegade', 'Kingston Fury Beast', 'Kingston Fury',
  'Lenovo Legion R32', 'Lenovo Legion 32', 'Lenovo Legion',
  'LG UltraGear 27GR95QE', 'LG UltraGear 32GP950', 'LG UltraGear', 'UltraGear',
  'Razer Seiren V2', 'Razer Seiren', 'Razer Raptor',
  'Samsung Odyssey G9', 'Samsung Odyssey Neo G9', 'Samsung Odyssey',
  'Samsung Galaxy Book4 Ultra', 'Samsung Galaxy Book',
  'Seagate FireCuda 530', 'Seagate FireCuda', 'FireCuda',
  'ViewSonic XG272', 'ViewSonic ColorPro', 'ViewSonic VP3200', 'ViewSonic',
  'Zowie XL2546X', 'Zowie XL2566K', 'Zowie XL', 'Zowie',
];

async function main() {
  const out: Record<string, string[]> = {};
  for (const m of MODELS) {
    let files: string[] = [];
    let usedCat = '';
    for (const v of variants(m)) {
      if (!(await catExists(v))) continue;
      const f = await catFiles(v);
      if (f.length > files.length) {
        files = f;
        usedCat = v;
      }
    }
    if (files.length) {
      out[m] = files;
      console.log(`${m}  [${usedCat}] -> ${files.length}`);
      files.slice(0, 12).forEach((f) => console.log(`    ${f}`));
    }
  }
  writeFileSync(
    resolve(process.cwd(), 'scripts/data/exact-model-categories.json'),
    JSON.stringify(out, null, 2),
    'utf-8',
  );
  console.log(`\n[done] ${Object.keys(out).length}/${MODELS.length} model có category`);
}

void main();
