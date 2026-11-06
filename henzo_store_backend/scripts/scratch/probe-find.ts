import { findCandidates } from '../../lib/commons-model-search';

const models = process.argv.slice(2);
for (const m of models) {
  const c = await findCandidates(m, 8);
  console.log(`=== ${m} -> ${c.length} ứng viên`);
  c.slice(0, 5).forEach((x) =>
    console.log(`   ${x.score} (phủ ${x.coverage.toFixed(2)}) ${x.title}`),
  );
  await new Promise((s) => setTimeout(s, 600));
}
