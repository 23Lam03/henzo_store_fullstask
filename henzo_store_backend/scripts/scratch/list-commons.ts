/**
 * Liệt kê TẤT CẢ ảnh Commons có chứa 1 từ khóa (bitmap, có tên hãng).
 *
 * Chạy: npx tsx scripts/list-commons.ts "Corsair headset"
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

async function main() {
  const q = process.argv[2] ?? 'Corsair headset';
  console.log('QUERY:', q);
  for (const extra of ['', ' filetype:bitmap']) {
    const d = await getJson(
      `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
        `&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(q + extra)}` +
        `&gsrlimit=50&prop=imageinfo&iiprop=url|mime&iiurlwidth=900`,
    );
    const rows = Object.values<any>(d?.query?.pages ?? {}).map((p) => {
      const ii = (p.imageinfo ?? [])[0];
      return { t: String(p.title), mime: String(ii?.mime ?? ''), url: String(ii?.thumburl ?? '') };
    });
    const bitmaps = rows.filter((r) => /^image\/(jpeg|png|webp)$/.test(r.mime));
    console.log(`\n--- "${q + extra}" -> ${bitmaps.length} bitmap / ${rows.length} total`);
    bitmaps.forEach((r) => console.log('   ', r.t));
  }
}
void main();

export {};
