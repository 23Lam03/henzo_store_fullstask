/**
 * KIỂM CHỨNG file Commons trong curated-model-files.json.
 *
 * Chạy: npx tsx scripts/verify-curated-files.ts
 * Báo cáo file KHÔNG tồn tại (sẽ bị bỏ qua khi apply) -> để vá nhanh.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { resolveFiles } from './lib/commons-files';

async function main() {
  const curated = JSON.parse(
    readFileSync(
      resolve(process.cwd(), 'scripts/data/curated-model-files.json'),
      'utf-8',
    ),
  ) as Record<string, string[]>;

  const all = [...new Set(Object.values(curated).flat())];
  console.log(`[verify] ${all.length} file unique trong ${Object.keys(curated).length} model…`);

  const map = await resolveFiles(all);
  const missing = all.filter((f) => !map.has(f));

  console.log(`[verify] Tồn tại: ${map.size}/${all.length}`);
  if (missing.length) {
    console.log(`\n[verify] THIẾU ${missing.length} file:`);
    // Ghi ra file để dễ tra cứu.
    const byModel: Record<string, string[]> = {};
    for (const [model, files] of Object.entries(curated)) {
      const miss = files.filter((f) => !map.has(f));
      if (miss.length) byModel[model] = miss;
    }
    for (const [model, files] of Object.entries(byModel)) {
      console.log(`  ${model}:`);
      for (const f of files) console.log(`    - ${f}`);
    }
  }

  // Thống kê số file/model
  const counts = Object.values(curated).map((v) => v.length).sort((a, b) => a - b);
  console.log(
    `\n[verify] file/model: min=${counts[0]} median=${counts[counts.length >> 1]} max=${counts[counts.length - 1]}`,
  );
}

void main();
