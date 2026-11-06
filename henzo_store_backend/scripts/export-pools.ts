/**
 * Trích xuất các POOL ảnh từ finalize-model-images.ts ra JSON.
 *
 * Dùng để gán nhiều ảnh dự phòng cho mỗi model, nhờ đó thuật toán phân bổ
 * ảnh chính có thể chọn ảnh KHÁC NHAU cho các model cùng nhóm.
 *
 * Chạy: npx tsx scripts/export-pools.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const src = readFileSync(
  resolve(process.cwd(), 'scripts/finalize-model-images.ts'),
  'utf-8',
);

const pools: Record<string, string[]> = {};
const re = /const ([A-Z_]+)_POOL = \[([\s\S]*?)\n\];/g;
let m: RegExpExecArray | null;
while ((m = re.exec(src))) {
  const files = [...m[2].matchAll(/'([^']+)'/g)].map((x) => x[1]);
  pools[m[1]] = files;
}
writeFileSync(
  resolve(process.cwd(), 'scripts/data/image-pools.json'),
  JSON.stringify(pools, null, 2),
  'utf-8',
);
for (const [k, v] of Object.entries(pools)) console.log(`${k}: ${v.length}`);
