import { readFileSync } from 'node:fs';
import { modelName } from './lib/model-name';

const mock = JSON.parse(readFileSync('scripts/data/frontend-mock.json', 'utf-8'));
const db = JSON.parse(readFileSync('scripts/data/model-images.json', 'utf-8'));
const models = new Map<string, string>();
for (const p of [...(mock.products as any[]), ...((mock.sellerProducts ?? []) as any[])]) {
  models.set(modelName(p.name), p.name);
}
const missing: string[] = [];
for (const [m, n] of models) if (!db[m]?.images?.length) missing.push(`${m}  <= ${n}`);
console.log('Tổng model:', models.size, '| Có ảnh:', models.size - missing.length, '| Thiếu:', missing.length);
console.log(missing.join('\n'));
