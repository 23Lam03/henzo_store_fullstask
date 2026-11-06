const UA = 'henzo-store/1.0 (model image resolver; dev@henzo.local)';

async function getJson(url: string): Promise<any> {
  for (let a = 0; a < 2; a++) {
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

async function search(q: string) {
  const d = await getJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
      `&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(q)}` +
      `&gsrlimit=40&prop=imageinfo&iiprop=url|mime|extmetadata&iiurlwidth=900`,
  );
  return Object.values<any>(d?.query?.pages ?? {})
    .filter((p) => {
      const ii = (p.imageinfo ?? [])[0];
      return ii?.mime && /^image\/(jpeg|png|webp)$/.test(ii.mime);
    })
    .map((p) => ({
      title: String(p.title),
      desc: String((p.imageinfo ?? [])[0]?.extmetadata?.ImageDescription?.value ?? '')
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .slice(0, 110),
    }));
}

async function main() {
  const QS = process.argv.slice(2);
  for (const q of QS) {
    const r = await search(`insource:"${q}"`);
    console.log(`\n--- insource:"${q}" -> ${r.length}`);
    r.forEach((x) => console.log(`   ${x.title}\n      ${x.desc}`));
  }
}
void main();

export {};
