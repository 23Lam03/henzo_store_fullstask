import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { modelName } from '../../lib/model-name';
import { modelParentChain } from '../../lib/model-parents';

const mi = JSON.parse(
  readFileSync(resolve(process.cwd(), 'scripts/data/model-images.json'), 'utf-8'),
) as Record<string, { images: string[] }>;

const models = [
  'Corsair K100 RGB OPX Optical',
  'Corsair HS60 Wireless',
  'Samsung Galaxy A16',
  'Samsung Galaxy Z Fold6',
  'Samsung Galaxy S24 Ultra',
  'Gigabyte M32UC',
  'Gigabyte M27Q X',
  'HP Omen 16',
  'HP Victus 15',
  'iPhone 16',
  'iPhone 16 Plus',
  'Intel Core i9-14900K',
  'Intel Core i7-14700K',
];

for (const m of models) {
  const own = mi[m]?.images?.length ?? 0;
  const chain = modelParentChain(m);
  const firstHit = chain.find((c) => mi[c]?.images?.length);
  console.log(
    `${m.padEnd(38)} own=${own}  parent=${firstHit ?? '-'} (${mi[firstHit ?? '']?.images?.length ?? 0} ảnh)  chain=[${chain.join(' > ')}]`,
  );
}
