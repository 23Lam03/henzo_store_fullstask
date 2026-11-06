const UA = 'henzo-store/1.0 (model image resolver; dev@henzo.local)';

async function getJson(url: string): Promise<any> {
  for (let a = 0; a < 6; a++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA } });
      if (r.status === 429 || r.status >= 500) {
        await new Promise((s) => setTimeout(s, 1500 * (a + 1)));
        continue;
      }
      if (!r.ok) return null;
      return await r.json();
    } catch {
      await new Promise((s) => setTimeout(s, 800 * (a + 1)));
    }
  }
  return null;
}

function keyOf(url: string): string {
  const name = decodeURIComponent(url.split('?')[0]?.split('/').pop() ?? '');
  return name.replace(/^\d+px-/, '');
}

export async function resolveFiles(files: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const pending = [...new Set(files)];
  for (let i = 0; i < pending.length; i += 20) {
    const chunk = pending.slice(i, i + 20);
    const d = await getJson(
      `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
        `&titles=${encodeURIComponent(chunk.map((f) => `File:${f}`).join('|'))}` +
        `&prop=imageinfo&iiprop=url|mime&iiurlwidth=1000`,
    );
    if (!d?.query?.pages) {

      for (const f of chunk) {
        const one = await getJson(
          `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
            `&titles=${encodeURIComponent(`File:${f}`)}` +
            `&prop=imageinfo&iiprop=url|mime&iiurlwidth=1000`,
        );
        for (const p of Object.values<any>(one?.query?.pages ?? {})) {
          const ii = (p.imageinfo ?? [])[0];
          if (!ii || !/^image\/(jpeg|png|webp|tiff)$/.test(String(ii.mime))) continue;
          const u = String(ii.thumburl ?? ii.url);
          out.set(keyOf(u), u);
        }
      }
      continue;
    }
    for (const p of Object.values<any>(d.query.pages)) {
      const ii = (p.imageinfo ?? [])[0];
      if (!ii || !/^image\/(jpeg|png|webp|tiff)$/.test(String(ii.mime))) continue;
      const u = String(ii.thumburl ?? ii.url);
      out.set(keyOf(u), u);
    }
  }
  return out;
}

export { getJson };
