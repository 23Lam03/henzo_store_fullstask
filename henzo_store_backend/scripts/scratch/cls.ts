import { readFileSync } from 'node:fs';
import { modelName } from '../lib/model-name';

const mock = JSON.parse(readFileSync('scripts/data/frontend-mock.json', 'utf-8'));
const all = [
  ...(mock.products as any[]),
  ...((mock.sellerProducts ?? []) as any[]),
];
const byCat = new Map<string, string[]>();
for (const p of all) {
  const m = modelName(p.name);
  const c = p.categoryName ?? p.category ?? '?';
  byCat.set(c, [...(byCat.get(c) ?? []), m]);
}
let i = 0;
for (const [c, ms] of [...byCat.entries()].sort((a, b) => b[1].length - a[1].length)) {
  console.log(`\n### ${c} (${ms.length})`);
  for (const m of ms) console.log(`  ${String(++i).padStart(3)} ${m}`);
}
