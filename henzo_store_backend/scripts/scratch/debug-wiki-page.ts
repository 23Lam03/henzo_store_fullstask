/**
 * Liệt kê ảnh trong media-list của trang Wikipedia.
 *
 * Chạy: npx tsx scripts/debug-wiki-page.ts "Corsair Gaming"
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

async function main() {
  const page = process.argv[2] ?? 'Corsair Gaming';
  console.log('PAGE:', page);
  const d = await getJson(
    `https://en.wikipedia.org/api/rest_v1/page/media-list/${encodeURIComponent(page)}`,
  );
  if (!d) {
    console.log('  (không tải được)');
  } else {
    (d.items ?? []).forEach((it: any) => {
      if (it.type !== 'image') return;
      console.log('  ', it.title);
    });
    console.log(`(${(d.items ?? []).length} item)`);
  }

  // Tìm trang wiki liên quan.
  const s = await getJson(
    `https://en.wikipedia.org/w/api.php?action=query&format=json&list=search` +
      `&srsearch=${encodeURIComponent(page)}&srlimit=10`,
  );
  console.log('\n--- trang wiki gợi ý:');
  (s?.query?.search ?? []).forEach((x: any) => console.log('  ', String(x.title)));
}
void main();

export {};
