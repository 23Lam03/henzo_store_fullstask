import { getJson } from './lib/commons-files';

const UA = 'henzo-store/1.0 (model image resolver; dev@henzo.local)';

async function main() {
  const queries = process.argv.slice(2);
  for (const q of queries) {
    console.log(`\n=== ${q} ===`);
    const d = await getJson(
      'https://commons.wikimedia.org/w/api.php?action=query&format=json' +
        `&list=search&srnamespace=6&srlimit=25&srsearch=${encodeURIComponent(q)}`,
    );
    for (const r of d?.query?.search ?? []) {
      console.log(`  ${r.title}`);
    }
  }
}

void main();
