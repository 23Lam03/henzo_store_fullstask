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

async function wikidata(query: string) {
  const d = await getJson(
    `https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json` +
      `&language=en&limit=8&search=${encodeURIComponent(query)}`,
  );
  const out: string[] = [];
  for (const x of d?.search ?? []) {
    const id = String(x.id);
    const e = await getJson(
      `https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&ids=${id}` +
        `&props=claims|labels|sitelinks`,
    );
    const ent = e?.entities?.[id];
    const p18 = ent?.claims?.P18?.map((c: any) => String(c.mainsnak?.datavalue?.value ?? ''));
    const label = String(ent?.labels?.en?.value ?? '');
    const sitelinks = Object.keys(ent?.sitelinks ?? {});
    out.push(`${id} "${label}" img=${p18?.join(',') ?? '-'} sitelinks=${sitelinks.length}`);
  }
  return out;
}

async function commonsBitmap(query: string) {
  const d = await getJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
      `&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(query)}` +
      `&gsrlimit=30&prop=imageinfo&iiprop=url|mime&iiurlwidth=900`,
  );
  return Object.values<any>(d?.query?.pages ?? {})
    .filter((p) => {
      const ii = (p.imageinfo ?? [])[0];
      return ii?.mime && /^image\/(jpeg|png|webp)$/.test(ii.mime);
    })
    .map((p) => String(p.title));
}

async function commonsFile(title: string) {
  const d = await getJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
      `&titles=${encodeURIComponent(`File:${title}`)}&prop=imageinfo&iiprop=url`,
  );
  const p = Object.values<any>(d?.query?.pages ?? {})[0];
  return p && !p.missing ? String((p.imageinfo ?? [])[0]?.url ?? '') : null;
}

async function main() {
  const models = [
    'Corsair HS60 Wireless',
    'Corsair HS80 RGB USB',
    'Corsair M75 Wireless',
    'Crucial T500',
    'Endgame Gear XM2we Wireless',
    'HyperX Cloud Alpha Wireless',
    'HyperX Cloud III Wireless',
  ];

  for (const m of models) {
    console.log(`\n########## ${m}`);

    console.log('  -- wikidata:');
    const wd = await wikidata(m);
    wd.forEach((x) => console.log('     ', x));
    if (!wd.length) console.log('      (không có)');

    console.log('  -- commons bitmap:');
    const queries = [
      `${m} filetype:bitmap`,
      `${m.split(' ').slice(0, -1).join(' ')} filetype:bitmap`,
      m.replace(/ Wireless$/, ''),
    ];
    for (const q of queries) {
      const r = await commonsBitmap(q);
      console.log(`     "${q}" -> ${r.length ? r.slice(0, 6).join(' | ') : '(không có)'}`);
    }
  }
}
void main();

export {};
