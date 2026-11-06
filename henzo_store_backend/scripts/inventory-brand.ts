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

async function walk(cat: string, depth: number, acc: Set<string>): Promise<void> {
  if (depth < 0 || acc.size > 400) return;
  const d = await getJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
      `&list=categorymembers&cmtitle=${encodeURIComponent(`Category:${cat}`)}` +
      `&cmtype=file|subcat&cmlimit=200`,
  );
  const items = d?.query?.categorymembers ?? [];
  const subs = items
    .filter((x: any) => x.ns === 14)
    .map((x: any) => String(x.title).replace(/^Category:/i, ''));
  const files = items
    .filter((x: any) => x.ns === 6)
    .map((x: any) => String(x.title))
    .filter((t: string) => /\.(jpe?g|png|webp)$/i.test(t) && !/\.svg$/i.test(t));
  for (const f of files) acc.add(f);
  for (const s of subs) await walk(s, depth - 1, acc);
}

async function main() {
  const brand = process.argv[2] ?? 'Corsair';
  const acc = new Set<string>();

  const s = await getJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
      `&list=search&srnamespace=14&srsearch=${encodeURIComponent(brand)}&srlimit=20`,
  );
  const cands = new Set<string>([brand, `${brand} (brand)`]);
  for (const x of s?.query?.search ?? []) {
    const n = String(x.title).replace(/^Category:/i, '');

    if (new RegExp(`^${brand}\\b`, 'i').test(n)) cands.add(n);
  }
  console.log('Categories thử:', [...cands].join(', '));

  for (const c of cands) await walk(c, 2, acc);

  console.log(`\n=== ${acc.size} bitmap trong category của "${brand}" ===`);
  [...acc].sort().forEach((t) => console.log('  ', t));

  for (const kw of ['headset', 'headphones', 'mouse', 'keyboard', 'ssd', 'monitor']) {
    const d = await getJson(
      `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
        `&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(
          `${brand} ${kw}`,
        )}&gsrlimit=50&prop=imageinfo&iiprop=url|mime`,
    );
    const rows = Object.values<any>(d?.query?.pages ?? {}).filter((p) => {
      const ii = (p.imageinfo ?? [])[0];
      return ii?.mime && /^image\/(jpeg|png|webp)$/.test(ii.mime);
    });
    console.log(`\n--- search "${brand} ${kw}" -> ${rows.length}`);
    rows.forEach((p) => console.log('  ', String(p.title)));
  }
}
void main();

export {};
