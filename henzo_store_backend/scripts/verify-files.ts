import { readFileSync, writeFileSync } from 'node:fs';
import { resolveFiles } from './lib/commons-files';

const list = JSON.parse(readFileSync(process.argv[2], 'utf-8')) as string[];
const outDir = process.argv[3] ?? '/tmp/verify';
const m = await resolveFiles(list);
writeFileSync(
  process.argv[4] ?? '/tmp/verify-map.json',
  JSON.stringify(Object.fromEntries(m), null, 2),
);
console.log(`Tồn tại: ${m.size}/${list.length}`);
for (const f of list) if (!m.has(f)) console.log('  ✗ ' + f);
