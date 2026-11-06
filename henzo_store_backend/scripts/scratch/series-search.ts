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
      `&gsrlimit=30&prop=imageinfo&iiprop=url|mime|extmetadata&iiurlwidth=900`,
  );
  return Object.values<any>(d?.query?.pages ?? {})
    .filter((p) => {
      const ii = (p.imageinfo ?? [])[0];
      return ii?.mime && /^image\/(jpeg|png|webp)$/.test(ii.mime);
    })
    .map((p) => ({
      title: String(p.title),
      desc: String(
        (p.imageinfo ?? [])[0]?.extmetadata?.ImageDescription?.value ?? '',
      )
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .slice(0, 80),
    }));
}

async function main() {
  const QS = [
    'Corsair H80 headset',
    'Corsair H60 headset',
    'Corsair H70 headset',
    'Corsair Void Pro headset',
    'Corsair Void Elite',
    'Corsair headset 7.1',
    'intitle:Corsair headset',
    'Corsair gaming headset box',
    'Kingston HyperX headset',
    'Kingston Cloud headset',
    'HyperX gaming headset',
    'Endgame Gear',
    'Endgame XM2',
    'Crucial T500',
    'Crucial NVMe',
  ];
  const seen = new Set<string>();
  for (const q of QS) {
    const r = await search(q);
    const fresh = r.filter((x) => !seen.has(x.title));
    fresh.forEach((x) => seen.add(x.title));
    console.log(`\n--- "${q}" -> ${fresh.length}`);
    fresh.slice(0, 8).forEach((x) => console.log(`   ${x.title}\n      ${x.desc}`));
  }
}
void main();

export {};
