/**
 * Tìm ảnh sản phẩm THẬT theo tên từ Wikipedia (pageimages).
 *
 * Wikipedia có ảnh chính xác của từng model sản phẩm (iPhone 16 Pro Max,
 * MacBook Pro, Corsair RM850x...) — khác với ảnh stock Unsplash dùng chung.
 *
 * Chạy: npx tsx scripts/fetch-wikipedia-images.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const UA = 'henzo-store/1.0 (product image resolver)';

interface Candidate {
  name: string;
  slug: string;
  categoryName: string;
  images: string[];
}

/** Chuẩn hoá tên để dò trên Wikipedia. */
function wikiTitle(name: string): string {
  return name
    .replace(/\s+/g, ' ')
    .replace(/"/g, '')
    .trim();
}

/**
 * Tạo các biến thể tên để dò trên Wikipedia.
 *
 * Tên sản phẩm có dung lượng ("iPhone 16 Pro Max 256GB") hiếm khi tồn tại
 * trên Wikipedia — cần thử bản không dung lượng trước.
 */
function titleVariants(name: string): string[] {
  const base = wikiTitle(name);
  const variants = [base];

  // Bỏ dung lượng: "256GB", "512GB", "1TB", "16GB"...
  const noCapacity = base.replace(/\s+\d+(?:\.\d+)?\s*(?:GB|TB|MB)\b/gi, '').trim();
  if (noCapacity && noCapacity !== base) variants.push(noCapacity);

  // Bỏ mã model phía sau: "G614JIR", "14VIG", "FW-0003"
  const noModel = noCapacity
    .replace(/\s+[A-Z]{2,5}[-]?\d{2,}[A-Z0-9]*\b/g, '')
    .trim();
  if (noModel && !variants.includes(noModel)) variants.push(noModel);

  return variants.filter(Boolean);
}

/** Tìm ảnh chính qua API pageimages (có redirect). */
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

/** Tìm ảnh qua search + pageimages (khi tên khóa không trùng chính xác). */
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
