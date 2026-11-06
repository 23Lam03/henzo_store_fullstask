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

async function subCats(cat: string) {
  const d = await getJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
      `&list=categorymembers&cmtitle=${encodeURIComponent(`Category:${cat}`)}` +
      `&cmtype=subcat&cmlimit=50`,
  );
  return (d?.query?.categorymembers ?? []).map(
    (x: any): string => String(x.title),
  );
}

async function main() {
  const cat = process.argv[2] ?? 'HyperX';
  console.log('Sub-categories của', cat);
  const subs = await subCats(cat);
  subs.forEach((s: string) => console.log('  ', s));

  for (const kw of ['Cloud', 'Headset', 'Alpha', 'Void', 'Katar', 'T500', 'XM2']) {
    const d = await getJson(
      `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
        `&list=search&srnamespace=14&srsearch=${encodeURIComponent(kw)}&srlimit=12`,
    );
    console.log(`\ncategory "${kw}":`);
    (d?.query?.search ?? []).forEach((x: any) => console.log('  ', String(x.title)));
  }
}
void main();

export {};
