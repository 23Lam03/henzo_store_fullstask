import { writeFileSync } from 'node:fs';

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
      await new Promise((s) => setTimeout(s, 800));
    }
  }
  return null;
}

async function catMembers(cat: string, depth = 0): Promise<string[]> {
  if (depth > 2) return [];
  const out: string[] = [];
  const d = await getJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
      `&list=categorymembers&cmtitle=${encodeURIComponent(cat)}&cmlimit=500`,
  );
  const res = (d?.query?.categorymembers ?? []) as any[];
  for (const r of res) {
    if (r.ns === 6) out.push(String(r.title).replace(/^File:/, ''));
    else if (r.ns === 14 && depth < 2) out.push(...(await catMembers(r.title, depth + 1)));
  }
  return out;
}

async function main() {
  const log: string[] = [];
  const all = new Set<string>();

  for (const c of ['Category:Corsair', 'Category:MSI (company)', 'Category:Micro-Star International']) {
    const m = await catMembers(c);
    log.push(`\n=== ${c} (${m.length}) ===`);
    for (const f of m) log.push(`  ${f}`);
    m.forEach((f) => all.add(f));
  }

  for (const q of ['Corsair', 'Corsair keyboard', 'Corsair mouse', 'Corsair headset', 'MSI laptop', 'MSI computer']) {
    const d = await getJson(
      `https://commons.wikimedia.org/w/api.php?action=query&format=json&list=search` +
        `&srsearch=${encodeURIComponent(`filetype:bitmap ${q}`)}&srnamespace=6&srlimit=200`,
    );
    const res = (d?.query?.search ?? []) as any[];
    log.push(`\n=== search: ${q} (${res.length}) ===`);
    for (const r of res) {
      const t = String(r.title).replace(/^File:/, '');
      log.push(`  ${t}`);
      all.add(t);
    }
  }

  writeFileSync('scripts/data/probe-deep.txt', log.join('\n'));
  writeFileSync('scripts/data/probe-deep.json', JSON.stringify([...all], null, 2));
  console.log('total', all.size);
}

void main();
