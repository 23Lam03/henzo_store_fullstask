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

async function main() {
  for (const cat of process.argv.slice(2)) {
    console.log(`\n########## Category:${cat}`);
    const d = await getJson(
      `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
        `&list=categorymembers&cmtitle=${encodeURIComponent(`Category:${cat}`)}` +
        `&cmtype=file&cmlimit=200`,
    );
    const files = (d?.query?.categorymembers ?? [])
      .map((x: any) => String(x.title))
      .filter((t: string) => /\.(jpe?g|png|webp)$/i.test(t) && !/\.svg$/i.test(t));
    console.log(`  (${files.length} file)`);
    if (!files.length) continue;
    const info = await getJson(
      `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
        `&titles=${encodeURIComponent(files.join('|'))}` +
        `&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=900`,
    );
    for (const p of Object.values<any>(info?.query?.pages ?? {})) {
      const ii = (p.imageinfo ?? [])[0];
      const desc = String(ii?.extmetadata?.ImageDescription?.value ?? '')
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .slice(0, 120);
      console.log(`  ${String(p.title)}\n     ${desc}`);
    }
  }
}
void main();

export {};
