/**
 * Probe cuối: Wikipedia đa ngôn ngữ + Commons REST search + Wikidata SPARQL.
 *
 * Chạy: npx tsx scripts/probe-multisource.ts "HyperX Cloud Alpha" "Corsair HS60"
 */
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
  const models = process.argv.slice(2);
  for (const m of models) {
    console.log(`\n########## ${m}`);

    // 1) Commons REST search (khác generator=search).
    const r = await getJson(
      `https://commons.wikimedia.org/w/rest.php/v1/search/page?q=${encodeURIComponent(m)}&limit=8`,
    );
    const pages = (r?.pages ?? []).filter((p: any) =>
      /^image\/(jpeg|png|webp)$/.test(String(p?.thumbnail?.mimetype ?? '')),
    );
    console.log(`  commons-rest: ${pages.length}`);
    pages.forEach((p: any) => console.log(`    ${p.title}`));

    // 2) Commons search có điều kiện mime + filemime.
    const r2 = await getJson(
      `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
        `&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(m)}` +
        `&gsrlimit=20&prop=imageinfo&iiprop=url|mime&filemime:image/jpeg`,
    );
    const rows = Object.values<any>(r2?.query?.pages ?? {});
    console.log(`  api+filemime jpeg: ${rows.length}`);
    rows.forEach((p: any) => console.log(`    ${p.title}`));

    // 3) Wikidata SPARQL: tìm item có label chứa model.
    const sparql = `SELECT ?item ?itemLabel ?image WHERE {
      ?item rdfs:label ?label .
      FILTER(CONTAINS(LCASE(?label), ${JSON.stringify(m.toLowerCase())}))
      FILTER(LANG(?label) = "en")
      OPTIONAL { ?item wdt:P18 ?image }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    } LIMIT 20`;
    const r3 = await getJson(
      `https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(sparql)}`,
    );
    const rows3 = r3?.results?.bindings ?? [];
    console.log(`  wikidata: ${rows3.length}`);
    rows3.forEach((b: any) =>
      console.log(`    ${b.itemLabel?.value} | ${b.image?.value ?? '(no image)'}`),
    );
  }
}
void main();

export {};
