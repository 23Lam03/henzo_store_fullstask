/**
 * Tìm ảnh tai nghe/chuột/SSD của hãng qua nhiều truy vấn rộng.
 *
 * Chạy: npx tsx scripts/wide-search.ts Corsair "headset"
 */
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
      await new Promise((s) => setTimeout(s, 700));
    }
  }
  return null;
}

async function search(q: string) {
  const d = await getJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
      `&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(q)}` +
      `&gsrlimit=50&prop=imageinfo&iiprop=url|mime&iiurlwidth=900`,
  );
  return Object.values<any>(d?.query?.pages ?? {})
    .filter((p) => {
      const ii = (p.imageinfo ?? [])[0];
      return ii?.mime && /^image\/(jpeg|png|webp)$/.test(ii.mime);
    })
    .map((p) => ({
      title: String(p.title),
      url: String((p.imageinfo ?? [])[0]?.thumburl ?? ''),
    }));
}

async function main() {
  const brand = process.argv[2] ?? 'Corsair';
  const terms = (process.argv[3] ?? 'headset').split(',');

  const queries: string[] = [];
  for (const t of terms) {
    queries.push(`${brand} ${t}`);
    queries.push(`${brand} ${t} product`);
    queries.push(`intitle:${brand} ${t}`);
    queries.push(`${brand.toLowerCase()} ${t}`);
  }
  // Tên model cụ thể của Corsair headset.
  queries.push(
    'Corsair Void headset',
    'Corsair Void Pro',
    'Corsair 7.1 headset',
    'Corsair headset wireless',
    'Corsair HS',
    'Corsair ST100',
    'HyperX Cloud headset',
    'HyperX Cloud Alpha',
    'HyperX Cloud II',
    'Crucial T500 SSD',
    'Crucial NVMe SSD',
  );

  const seen = new Map<string, string>();
  for (const q of queries) {
    const r = await search(q);
    for (const x of r) if (!seen.has(x.title)) seen.set(x.title, x.url);
  }
  console.log(`\n=== ${seen.size} bitmap unique ===`);
  for (const [t, u] of seen) {
    console.log(`${t}\n   ${u}`);
  }
}
void main();

export {};
