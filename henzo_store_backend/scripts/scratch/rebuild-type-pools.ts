import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { getJson } from '../../lib/commons-files';

const TYPE_KEYWORD: Record<string, string[]> = {
  'Điện thoại': ['iphone', 'galaxy s', 'pixel', 'phone', 'smartphone', 'redmi', 'oneplus', 'fone'],
  Tablet: ['ipad', 'galaxy tab', 'tablet'],
  Laptop: ['macbook', 'notebook', 'laptop', 'thinkpad', 'ideapad', 'zenbook', 'vivobook', 'pavilion', 'omen', 'predator', 'nitro', 'swift', 'legion', 'surface laptop', 'matebook', 'gram', 'aorus', 'blade', 'alienware'],
  'Màn hình': ['monitor', 'display', 'ultragear', 'odyssey'],
  'PC Gaming': ['tower', 'desktop', 'graphics card', 'gpu', 'motherboard', 'power supply', 'memory module', 'ssd', 'nvme'],
  Chuột: ['mouse'],
  'Bàn phím': ['keyboard'],
  'Tai nghe': ['headset', 'headphone', 'headphones', 'airpods', 'earphone'],
  'Phụ kiện': ['webcam', 'microphone', 'charger', 'power adapter', 'usb-c cable', 'dock', 'hub', 'cable'],
};

const BAD = /\b(shop|store|mall|market|street|banner|poster|logo|chart|graph|diagram|map|comparison|people|person|hand|hands|woman|man\b|boy|girl|protest|meeting|conference|booth|package|unboxing|manual|instruction|advertis|crowd|building|room|office|cat|dog|animal|flower|plant|landscape|mountain|food|fruit|car\b|vehicle|train|building|church|temple|statue|painting|drawing|animation|cartoon|comic|screenshot|chart)\b/i;

const NOT_TYPE: Record<string, string[]> = {
  Chuột: ['keyboard', 'headset', 'headphone', 'monitor', 'laptop', 'phone'],
  'Bàn phím': ['mouse', 'headset', 'headphone', 'monitor', 'laptop', 'phone'],
  'Tai nghe': ['mouse', 'keyboard', 'monitor', 'laptop', 'phone', 'webcam'],
  'Phụ kiện': ['mouse', 'keyboard', 'headset', 'headphone', 'monitor', 'laptop', 'phone'],
  'Màn hình': ['mouse', 'keyboard', 'headset', 'headphone', 'laptop', 'phone', 'webcam'],
  'Điện thoại': ['mouse', 'keyboard', 'headset', 'headphone', 'monitor', 'laptop', 'webcam'],
  Tablet: ['mouse', 'keyboard', 'headset', 'headphone', 'monitor', 'laptop', 'webcam'],
  Laptop: ['mouse', 'keyboard', 'headset', 'headphone', 'monitor', 'phone', 'webcam'],
  'PC Gaming': ['mouse', 'keyboard', 'headset', 'headphone', 'monitor', 'phone', 'webcam'],
};

const norm = (s: string): string =>
  s
    .replace(/^File:/, '')
    .replace(/\.(jpe?g|png|webp)$/i, '')
    .replace(/[_.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

async function probe(type: string, keyword: string, limit = 20): Promise<string[]> {
  const q = `intitle:"${keyword}" filetype:bitmap`;
  const d = await getJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
      `&generator=search&gsrnamespace=6&gsrlimit=${limit}` +
      `&gsrsearch=${encodeURIComponent(q)}` +
      `&prop=imageinfo&iiprop=url|mime&iiurlwidth=1000`,
  );
  const out: { file: string; url: string; score: number }[] = [];
  const seen = new Set<string>();
  for (const p of Object.values<any>(d?.query?.pages ?? {})) {
    const ii = (p.imageinfo ?? [])[0];
    if (!ii || !/^image\/(jpeg|png|webp)$/.test(String(ii.mime))) continue;
    const title = String(p.title ?? '').replace(/^File:/, '');
    if (BAD.test(title)) continue;
    const n = norm(title);
    if (!n.includes(keyword)) continue;
    if ((NOT_TYPE[type] ?? []).some((k) => n.includes(k))) continue;
    const file = (String(ii.url ?? '').split('/').pop() ?? title).replace(/^\d+px-/, '');
    if (seen.has(file)) continue;
    seen.add(file);

    const words = n.split(' ').filter(Boolean).length;
    let score = 10;
    if (words <= 4) score += 5;
    else if (words > 12) score -= 5;
    out.push({ file, url: String(ii.thumburl ?? ii.url), score });
  }
  return out.sort((a, b) => b.score - a.score).slice(0, 30).map((x) => x.url);
}

const pools: Record<string, string[]> = {};

for (const [type, keywords] of Object.entries(TYPE_KEYWORD)) {
  const urls: string[] = [];
  for (const kw of keywords) {
    const got = await probe(type, kw);
    urls.push(...got);
    await new Promise((s) => setTimeout(s, 220));
  }
  const unique = [...new Set(urls)];
  pools[type] = unique;
  console.log(`${type}: ${unique.length} ảnh`);
}

const outPath = resolve(process.cwd(), 'scripts/data/type-image-pools.json');
const old = JSON.parse(readFileSync(outPath, 'utf-8'));

const merged = { ...old, ...pools };
writeFileSync(outPath, JSON.stringify(merged, null, 2), 'utf-8');
console.log(`\nĐã ghi ${outPath}`);
