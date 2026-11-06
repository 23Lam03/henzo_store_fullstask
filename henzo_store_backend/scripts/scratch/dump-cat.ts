import { getJson } from '../lib/commons-files';

async function main() {
  const cats = process.argv.slice(2);
  for (const cat of cats) {
    const d = await getJson(
      `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
        `&list=categorymembers&cmtitle=${encodeURIComponent(`Category:${cat}`)}` +
        `&cmtype=file|subcat&cmlimit=500`,
    );
    const files = (d?.query?.categorymembers ?? [])
      .filter((m: any) => m.ns === 6)
      .map((m: any) => String(m.title).replace(/^File:/, ''));
    const subs = (d?.query?.categorymembers ?? [])
      .filter((m: any) => m.ns === 14)
      .map((m: any) => String(m.title).replace(/^Category:/, ''));
    console.log(`\n##### ${cat} — ${files.length} files, ${subs.length} subcats`);
    for (const f of files) console.log(`  F ${f}`);
    for (const s of subs) console.log(`  S ${s}`);
  }
}

void main();
