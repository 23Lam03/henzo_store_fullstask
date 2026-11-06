/**
 * Tìm ảnh Commons bằng full-text search với cụm từ đặc thù (có dấu nháy).
 * Cũng thử search trên nhiều wiki (de, zh, ja, fr) rồi lấy file Commons
 * được dùng trong bài viết đó.
 */
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

/** Commons fulltext, namespace 6, từ khoá có dấu nháy. */
async function commonsPhrase(q: string): Promise<string[]> {
  const d = await getJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
      `&list=search&srsearch=${encodeURIComponent(`"${q}"`)}&srnamespace=6&srlimit=25`,
  );
  return (d?.query?.search ?? []).map((s: any) => s.title.replace(/^File:/, ''));
}

/** Commons fulltext, namespace 14 (category). */
async function commonsCatPhrase(q: string): Promise<string[]> {
  const d = await getJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
      `&list=search&srsearch=${encodeURIComponent(`"${q}"`)}&srnamespace=14&srlimit=15`,
  );
  return (d?.query?.search ?? []).map((s: any) => s.title.replace(/^Category:/, ''));
}

/** File Commons dùng trong bài viết của wiki khác. */
async function wikiFiles(lang: string, title: string): Promise<string[]> {
  const d = await getJson(
    `https://${lang}.wikipedia.org/w/api.php?action=query&format=json&titles=${encodeURIComponent(title)}` +
      `&prop=images&imlimit=60`,
  );
  const out: string[] = [];
  for (const p of Object.values<any>(d?.query?.pages ?? {})) {
    for (const im of p.images ?? []) {
      const t = String(im.title);
      if (/^File:/i.test(t)) out.push(t.replace(/^File:/, ''));
    }
  }
  return out;
}

async function wikiSearch(lang: string, q: string): Promise<string[]> {
  const d = await getJson(
    `https://${lang}.wikipedia.org/w/api.php?action=query&format=json&list=search` +
      `&srsearch=${encodeURIComponent(q)}&srlimit=5&srnamespace=0`,
  );
  return (d?.query?.search ?? []).map((s: any) => s.title);
}

const PHRASES = [
  'HyperX Cloud Alpha', 'HyperX Cloud III', 'HyperX Cloud II',
  'Corsair HS60', 'Corsair HS80', 'Corsair Void', 'Corsair Xeneon',
  'Zowie XL2546X', 'Zowie XL2566K', 'Zowie XL',
  'LG UltraGear', 'UltraGear 27GR95QE', 'UltraGear 32GP950',
  'Samsung Odyssey G9', 'Odyssey Neo G9', 'Samsung Odyssey',
  'Seagate FireCuda', 'FireCuda 530',
  'Kingston Fury Renegade', 'Fury Renegade',
  'AOC CU34G2X', 'AOC AGON', 'AOC CU34G3',
  'Gigabyte M34WMU', 'Gigabyte M32U', 'Gigabyte M27Q',
  'Lenovo Legion R32', 'Lenovo Legion 32',
  'Razer Seiren', 'Razer Raptor',
  'ViewSonic XG272', 'ViewSonic VP3200', 'ViewSonic ColorPro',
  'ROG Harpe Ace', 'Endgame Gear XM2', 'JBL Quantum 910',
  'HP Omen 27', 'HP Omen 32', 'Galaxy Book4 Ultra',
  'AMD Ryzen 9 7950X3D', 'Ryzen 7 7800X3D',
  'AirPods 4', 'AirPods Pro 2',
];

const LANGS = ['de', 'zh', 'ja', 'fr', 'pl', 'es', 'it', 'ru'];

async function main() {
  const out: Record<string, any> = {};
  for (const q of PHRASES) {
    const rec: any = { commons: [], cats: [], wiki: {} };
    rec.commons = await commonsPhrase(q);
    rec.cats = await commonsCatPhrase(q);
    for (const lang of LANGS) {
      const titles = await wikiSearch(lang, q);
      if (!titles.length) continue;
      const files = new Set<string>();
      for (const t of titles.slice(0, 3)) {
        for (const f of await wikiFiles(lang, t)) files.add(f);
      }
      if (files.size) rec.wiki[lang] = [...files].slice(0, 30);
    }
    out[q] = rec;
    console.log(
      `\n### ${q}  commons=${rec.commons.length} cats=${rec.cats.length} wiki=${Object.keys(rec.wiki).length}`,
    );
    rec.commons.slice(0, 6).forEach((f: string) => console.log(`   C ${f}`));
    rec.cats.slice(0, 4).forEach((c: string) => console.log(`   K ${c}`));
    for (const [lang, files] of Object.entries<any>(rec.wiki)) {
      console.log(`   ${lang}: ${files.slice(0, 8).join(' | ')}`);
    }
  }
  writeFileSync(
    resolve(process.cwd(), 'scripts/data/phrase-model-probe.json'),
    JSON.stringify(out, null, 2),
    'utf-8',
  );
}

void main();
