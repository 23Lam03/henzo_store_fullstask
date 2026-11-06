/**
 * PHỤC HỒI scripts/data/model-images.json từ file frontend đã sinh
 * (henzo_store/src/data/modelImages.ts) — nguồn chuẩn, chứa URL ảnh đúng.
 *
 * `source` được suy ra lại:
 *   - model có trong MODEL_PHOTOS của finalize-model-images.ts -> 'commons-curated'
 *   - còn lại -> 'commons-code'
 *
 * Chạy: npx tsx scripts/restore-model-images.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

function parseFrontend(): Record<string, string[]> {
  const src = readFileSync(
    resolve(process.cwd(), '../henzo_store/src/data/modelImages.ts'),
    'utf-8',
  );
  const start = src.indexOf('export const MODEL_IMAGES');
  const end = src.indexOf('\n};', start);
  const body = src.slice(start, end);
  const out: Record<string, string[]> = {};
  const re = /^\s*'((?:[^'\\]|\\.)*)':\s*\[([\s\S]*?)\],?\s*$/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body))) {
    const key = m[1].replace(/\\'/g, "'");
    const urls = [...m[2].matchAll(/'((?:[^'\\]|\\.)*)'/g)].map((x) =>
      x[1].replace(/\\'/g, "'"),
    );
    out[key] = urls;
  }
  return out;
}

function titleFromUrl(url: string): string {
  const raw = decodeURIComponent(url.split('?')[0] ?? '');
  const file = raw.split('/').pop() ?? '';
  return file.replace(/^\d+px-/, '');
}

function main() {
  const frontend = parseFrontend();
  const finalize = readFileSync(
    resolve(process.cwd(), 'scripts/finalize-model-images.ts'),
    'utf-8',
  );
  const curated = new Set<string>();
  const cRe = /^\s*'((?:[^'\\]|\\.)*)':\s*\[/gm;
  let cm: RegExpExecArray | null;
  const cStart = finalize.indexOf('const MODEL_PHOTOS');
  const cBody = finalize.slice(cStart);
  while ((cm = cRe.exec(cBody))) curated.add(cm[1].replace(/\\'/g, "'"));

  const db: Record<string, { images: string[]; source: string; title: string }> = {};
  for (const [model, images] of Object.entries(frontend)) {
    if (!images.length) continue;
    db[model] = {
      images,
      source: curated.has(model) ? 'commons-curated' : 'commons-code',
      title: titleFromUrl(images[0]),
    };
  }
  writeFileSync(
    resolve(process.cwd(), 'scripts/data/model-images.json'),
    JSON.stringify(db, null, 2),
    'utf-8',
  );
  console.log(
    `[restore] Đã phục hồi ${Object.keys(db).length} model ` +
      `(${curated.size} curated trong finalize).`,
  );
}

main();
