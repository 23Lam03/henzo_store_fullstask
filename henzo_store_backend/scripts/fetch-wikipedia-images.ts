import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const UA = 'henzo-store/1.0 (product image resolver)';

interface Candidate {
  name: string;
  slug: string;
  categoryName: string;
  images: string[];
}

function wikiTitle(name: string): string {
  return name
    .replace(/\s+/g, ' ')
    .replace(/"/g, '')
    .trim();
}

function titleVariants(name: string): string[] {
  const base = wikiTitle(name);
  const variants = [base];

  const noCapacity = base.replace(/\s+\d+(?:\.\d+)?\s*(?:GB|TB|MB)\b/gi, '').trim();
  if (noCapacity && noCapacity !== base) variants.push(noCapacity);

  const noModel = noCapacity
    .replace(/\s+[A-Z]{2,5}[-]?\d{2,}[A-Z0-9]*\b/g, '')
    .trim();
  if (noModel && !variants.includes(noModel)) variants.push(noModel);

  return variants.filter(Boolean);
}

async function fetchThumb(title: string): Promise<string | null> {
  const url =
    `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages` +
    `&piprop=thumbnail&pithumbsize=800&redirects=1&titles=${encodeURIComponent(title)}`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) return null;
  const data: any = await res.json();
  const pages = data?.query?.pages ?? {};
  for (const p of Object.values<any>(pages)) {
    if (p?.thumbnail?.source) return p.thumbnail.source;
  }
  return null;
}

async function searchAndFetch(name: string): Promise<string | null> {
  const searchUrl =
    `https://en.wikipedia.org/w/api.php?action=query&format=json&list=search` +
    `&srsearch=${encodeURIComponent(name)}&srlimit=1`;
  const res = await fetch(searchUrl, { headers: { 'User-Agent': UA } });
  if (!res.ok) return null;
  const data: any = await res.json();
  const title = data?.query?.search?.[0]?.title;
  if (!title) return null;
  return fetchThumb(title);
}

async function main() {
  const mockPath = resolve(process.cwd(), 'scripts/data/frontend-mock.json');
  const mock = JSON.parse(readFileSync(mockPath, 'utf-8'));
  const products: Candidate[] = mock.products;

  const results: Record<string, string | null> = {};
  let found = 0;

  for (const p of products) {
    let thumb: string | null = null;
    let matchedTitle = '';

    for (const variant of titleVariants(p.name)) {
      thumb = await fetchThumb(variant);
      if (thumb) {
        matchedTitle = variant;
        break;
      }
    }
    if (!thumb) {
      for (const variant of titleVariants(p.name)) {
        thumb = await searchAndFetch(variant);
        if (thumb) {
          matchedTitle = `${variant} (search)`;
          break;
        }
      }
    }

    results[p.slug] = thumb;
    if (thumb) found++;
    console.log(
      `${thumb ? '✓' : '✗'} ${p.name.padEnd(42)} ${matchedTitle.padEnd(26)} ${thumb ? thumb.slice(0, 80) : ''}`,
    );
  }

  const out = resolve(process.cwd(), '/tmp/wikipedia-images.json');
  writeFileSync(out, JSON.stringify(results, null, 2), 'utf-8');
  console.log(
    `\n[wiki] Tìm được ${found}/${products.length} ảnh sản phẩm thật -> ${out}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
