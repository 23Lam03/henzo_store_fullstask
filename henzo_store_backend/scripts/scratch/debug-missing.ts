import { modelName } from '../lib/model-name';

const UA = 'henzo-store/1.0 (model image resolver; dev@henzo.local)';

async function getJson(url: string): Promise<any> {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA } });
    if (!r.ok) return null;
    return await r.json();
  } catch (e) {
    console.error('ERR', e);
    return null;
  }
}

async function commonsSearch(query: string) {
  const d = await getJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
      `&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(query)}` +
      `&gsrlimit=25&prop=imageinfo&iiprop=url|mime&iiurlwidth=900`,
  );
  const out: string[] = [];
  for (const p of Object.values<any>(d?.query?.pages ?? {})) {
    const ii = (p.imageinfo ?? [])[0];
    if (!ii) continue;
    out.push(`${String(p.title)}  [${ii.mime}]`);
  }
  return out;
}

async function main() {
  const model = process.argv[2] ?? 'Corsair HS60 Wireless';
  console.log('MODEL:', model);
  console.log('modelName():', modelName(model));
  console.log();

  const queries = [
    model,
    model.replace(/\s+/g, ''),
    'Corsair HS60',
    'HS60',
    'Corsair headset',
    'HyperX Cloud Alpha',
  ];
  for (const q of queries) {
    console.log(`--- search: "${q}"`);
    const r = await commonsSearch(q);
    r.forEach((t) => console.log('   ', t));
    if (!r.length) console.log('    (không có)');
    console.log();
  }
}
void main();
