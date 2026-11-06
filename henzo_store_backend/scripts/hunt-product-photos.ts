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
      `&gsrlimit=50&prop=imageinfo&iiprop=url|mime|extmetadata&iiurlwidth=900`,
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
        .slice(0, 110),
      cats: (p.categories ?? []).map((c: any) => String(c.title)).join(' | '),
    }));
}

async function main() {
  const QUERIES = [
    'Corsair Void headset',
    'Corsair ST100',
    'Corsair 7.1 headset',
    'Corsair H60 headset',
    'Corsair Headset Pro',
    'Corsair gaming headset product',
    'Corsair M65 M75 mouse',
    'Corsair M55 mouse',
    'Crucial NVMe SSD product',
    'Crucial SSD drive',
    'Endgame Gear mouse',
    'HyperX Cloud II headset',
    'HyperX headset product',
    'Kingston HyperX headset',
    'HyperX Cloud II',
  ];

  const seen = new Set<string>();
  for (const q of QUERIES) {
    const r = await search(q);
    const fresh = r.filter((x) => !seen.has(x.title));
    fresh.forEach((x) => seen.add(x.title));
    console.log(`\n--- "${q}" -> ${fresh.length} mới`);
    fresh.slice(0, 10).forEach((x) => {
      console.log(`   ${x.title}`);
      console.log(`      desc: ${x.desc}`);
      console.log(`      cats: ${x.cats.slice(0, 160)}`);
    });
  }
}
void main();

export {};
