import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const db = JSON.parse(
  readFileSync(resolve(process.cwd(), 'scripts/data/model-images.json'), 'utf-8'),
) as Record<string, { images: string[] }>;

const targets = process.argv.slice(2);
for (const t of targets) {
  const entry = db[t];
  console.log(`=== ${t} (${entry?.images?.length ?? 0} ảnh)`);
  (entry?.images ?? []).slice(0, 12).forEach((u) => {
    const clean = decodeURIComponent(u.split('?')[0]);
    console.log('   ', clean.split('/').pop());
  });
}
