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

async function commons(q: string) {
  const d = await getJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
      `&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(q)}` +
      `&gsrlimit=30&prop=imageinfo&iiprop=url|mime&iiurlwidth=900`,
  );
  return Object.values<any>(d?.query?.pages ?? {})
    .filter((p) => {
      const ii = (p.imageinfo ?? [])[0];
      return ii?.mime && /^image\/(jpeg|png|webp)$/.test(ii.mime);
    })
    .map((p) => String(p.title));
}

async function catFiles(cat: string) {
  const d = await getJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
      `&list=categorymembers&cmtitle=${encodeURIComponent(`Category:${cat}`)}` +
      `&cmtype=file&cmlimit=100`,
  );
  return (d?.query?.categorymembers ?? [])
    .map((x: any) => String(x.title))
    .filter((t: string) => /\.(jpe?g|png|webp)$/i.test(t) && !/\.svg$/i.test(t));
}

async function main() {
  const targets: Array<{ model: string; brand: string; type: string }> = [
    { model: 'Corsair HS60 Wireless', brand: 'Corsair', type: 'headset' },
    { model: 'Corsair HS80 RGB USB', brand: 'Corsair', type: 'headset' },
    { model: 'Corsair M75 Wireless', brand: 'Corsair', type: 'mouse' },
    { model: 'Crucial T500', brand: 'Crucial', type: 'SSD' },
    { model: 'Endgame Gear XM2we Wireless', brand: 'Endgame Gear', type: 'mouse' },
    { model: 'HyperX Cloud Alpha Wireless', brand: 'HyperX', type: 'headset' },
    { model: 'HyperX Cloud III Wireless', brand: 'HyperX', type: 'headset' },
  ];

  const TYPE_CATS: Record<string, string[]> = {
    headset: ['Corsair headsets', 'HyperX headsets', 'Gaming headsets', 'Headsets'],
    mouse: ['Corsair mice', 'Computer mice', 'Gaming mice', 'Video gaming mice'],
    SSD: ['SSDs', 'NVM Express', 'Solid-state drives', 'Crucial (brand)'],
  };

  for (const t of targets) {
    console.log(`\n########## ${t.model}`);

    const code = (t.model.match(/[A-Za-z]{1,4}[-]?\d{2,4}[A-Za-z]*/g) ?? []).filter(
      (c) => c.length >= 3,
    );
    const queries = [
      ...code.map((c) => `intitle:${c}`),
      `${t.brand} ${code[0] ?? ''}`.trim(),
      t.model,
      t.model.replace(/ Wireless$/, ''),
    ];
    for (const q of queries) {
      const r = await commons(q);
      if (r.length) console.log(`  Q "${q}" -> ${r.slice(0, 5).join(' | ')}`);
    }

    console.log(`  -- category theo loại:`);
    for (const c of TYPE_CATS[t.type] ?? []) {
      const f = await catFiles(c);
      const rel = f.filter((x: string) => {
        const low = x.toLowerCase();
        if (t.brand.toLowerCase() === 'corsair') return low.includes('corsair');
        if (t.brand.toLowerCase() === 'hyperx') return low.includes('hyperx');
        if (t.brand.toLowerCase() === 'crucial') return low.includes('crucial');
        return true;
      });
      if (rel.length) console.log(`    ${c} -> ${rel.slice(0, 6).join(' | ')}`);
      else if (f.length) console.log(`    ${c} -> (${f.length} file, không có "${t.brand}")`);
    }
  }
}
void main();

export {};
