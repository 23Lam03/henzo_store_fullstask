/**
 * Tìm ảnh Commons cho 1 model: thử nhiều chiến lược.
 *
 * Chạy: npx tsx scripts/debug-find.ts "Corsair HS60 Wireless"
 */
const UA = 'henzo-store/1.0 (model image resolver; dev@henzo.local)';

async function getJson(url: string): Promise<any> {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA } });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

async function search(query: string, ns = 6) {
  const d = await getJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
      `&generator=search&gsrnamespace=${ns}&gsrsearch=${encodeURIComponent(query)}` +
      `&gsrlimit=20&prop=imageinfo&iiprop=url|mime&iiurlwidth=900`,
  );
  return Object.values<any>(d?.query?.pages ?? {}).map((p) => String(p.title));
}

async function cats(query: string) {
  const d = await getJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
      `&list=search&srnamespace=14&srsearch=${encodeURIComponent(query)}&srlimit=15`,
  );
  return (d?.query?.search ?? []).map((x: any): string => String(x.title));
}

async function wikiSearch(q: string) {
  const d = await getJson(
    `https://en.wikipedia.org/w/api.php?action=query&format=json&list=search` +
      `&srsearch=${encodeURIComponent(q)}&srlimit=10`,
  );
  return (d?.query?.search ?? []).map((x: any): string => String(x.title));
}

async function main() {
  const m = process.argv[2] ?? 'Corsair HS60 Wireless';
  console.log('MODEL:', m);

  const brand = m.split(' ')[0];
  const codes = m.match(/[A-Za-z]+\d+|\d{3,}/g) ?? [];

  for (const q of [
    `intitle:${codes[0] ?? m}`,
    `${brand} ${codes[0] ?? ''}`.trim(),
    `${brand} headset`,
    `${brand} mouse`,
    `${brand} keyboard`,
    m,
  ]) {
    const r = await search(q);
    console.log(`\n--- commons "${q}" (${r.length})`);
    r.slice(0, 12).forEach((t) => console.log('   ', t));
  }

  console.log('\n=== CATEGORY gợi ý ===');
  for (const q of [m, brand, codes[0] ?? '']) {
    const r = await cats(q);
    console.log(`--- "${q}"`);
    r.slice(0, 15).forEach((t: string) => console.log('   ', t));
  }

  console.log('\n=== WIKIPEDIA gợi ý ===');
  for (const q of [m, `${brand} ${codes[0] ?? ''}`.trim()]) {
    const r = await wikiSearch(q);
    console.log(`--- "${q}"`);
    r.forEach((t: string) => console.log('   ', t));
  }
}
void main();

export {};
