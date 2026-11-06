/**
 * Tra cứu thông tin 1 file Commons (mô tả, category, nguồn).
 *
 * Chạy: npx tsx scripts/commons-file.ts "ST100VoidPro.jpg"
 */
const UA = 'henzo-store/1.0 (model image resolver; dev@henzo.local)';

async function getJson(url: string): Promise<any> {
  for (let a = 0; a < 3; a++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA } });
      if (r.status === 429) {
        await new Promise((s) => setTimeout(s, 1500 * (a + 1)));
        continue;
      }
      if (!r.ok) return null;
      return await r.json();
    } catch {
      await new Promise((s) => setTimeout(s, 600));
    }
  }
  return null;
}

async function main() {
  const files = process.argv.slice(2);
  for (const f of files) {
    const d = await getJson(
      `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
        `&titles=${encodeURIComponent(`File:${f}`)}` +
        `&prop=imageinfo|categories&cllimit=20&iiprop=url|size|mime|extmetadata`,
    );
    const p = Object.values<any>(d?.query?.pages ?? {})[0];
    if (!p || p.missing) {
      console.log(`\n### ${f}: KHÔNG TỒN TẠI`);
      continue;
    }
    const ii = (p.imageinfo ?? [])[0];
    console.log(`\n### ${f}`);
    console.log('  mime:', ii?.mime, ' size:', ii?.width, 'x', ii?.height);
    console.log('  url :', ii?.url);
    console.log('  thumb:', ii?.thumburl);
    console.log('  cats:', (p.categories ?? []).map((c: any) => String(c.title)).join(', '));
    const desc = ii?.extmetadata?.ImageDescription?.value;
    if (desc) console.log('  desc:', String(desc).replace(/<[^>]+>/g, '').slice(0, 300));
  }
}
void main();

export {};
