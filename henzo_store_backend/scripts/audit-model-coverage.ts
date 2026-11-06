import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { modelName } from './lib/model-name';

const STOP = new Set([
  'pro', 'plus', 'max', 'ultra', 'mini', 'air', 'se', 'gen', 'series',
  'in', 'inch', 'gb', 'tb', 'gaming', 'wireless', 'rgb', 'black', 'white',
  'silver', 'grey', 'gray', 'titanium', 'magnetic', 'tkl', 'full', 'size',
  'with', 'and', 'the', 'for', 'edition', 'combo', 'package', 'kit',
]);

function tokens(model: string): string[] {
  return model
    .replace(/[()]/g, ' ')
    .split(/[^A-Za-z0-9.+-]+/)
    .filter((t) => t.length >= 2 && !STOP.has(t.toLowerCase()))
    .sort((a, b) => b.length - a.length);
}

function normTitle(title: string): string {
  return title
    .replace(/^File:/, '')
    .replace(/\.(jpe?g|png|webp|tiff)$/i, '')
    .replace(/[_.]/g, ' ')
    .replace(/[()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function fileFromUrl(url: string): string {
  const raw = decodeURIComponent(url.split('?')[0] ?? '');
  const parts = raw.split('/');
  return parts[parts.length - 1] ?? '';
}

export interface Audit {
  model: string;
  brand: string;
  categoryName: string;
  total: number;
  source: string;
  primaryTitle: string;
  primaryFile: string;
    exact: boolean;
    exactCount: number;
}

function isExact(model: string, file: string): boolean {
  const t = normTitle(file);
  const toks = tokens(model);

  const hit = toks.filter((x) => x.length >= 3 && t.includes(x.toLowerCase()));
  if (!hit.length) return false;

  return hit.length >= 1;
}

export function auditModels(): Audit[] {
  const mock = JSON.parse(
    readFileSync(resolve(process.cwd(), 'scripts/data/frontend-mock.json'), 'utf-8'),
  );
  const db = JSON.parse(
    readFileSync(resolve(process.cwd(), 'scripts/data/model-images.json'), 'utf-8'),
  ) as Record<string, { images: string[]; source: string; title: string }>;

  const meta = new Map<string, { brand: string; categoryName: string }>();
  for (const p of [
    ...(mock.products as any[]),
    ...((mock.sellerProducts ?? []) as any[]),
  ]) {
    const m = modelName(p.name);
    if (!meta.has(m)) meta.set(m, { brand: p.brand, categoryName: p.categoryName ?? '' });
  }

  const out: Audit[] = [];
  for (const [model, v] of Object.entries(db)) {
    const images = v.images ?? [];
    if (!images.length) {
      out.push({
        model,
        brand: meta.get(model)?.brand ?? '',
        categoryName: meta.get(model)?.categoryName ?? '',
        total: 0,
        source: v.source,
        primaryTitle: '',
        primaryFile: '',
        exact: false,
        exactCount: 0,
      });
      continue;
    }
    const primaryFile = fileFromUrl(images[0]);
    const exactCount = images.filter((u) => isExact(model, fileFromUrl(u))).length;
    out.push({
      model,
      brand: meta.get(model)?.brand ?? '',
      categoryName: meta.get(model)?.categoryName ?? '',
      total: images.length,
      source: v.source,
      primaryTitle: v.title ?? '',
      primaryFile,
      exact: isExact(model, primaryFile),
      exactCount,
    });
  }

  for (const [model, m] of meta) {
    if (db[model]) continue;
    out.push({
      model,
      brand: m.brand,
      categoryName: m.categoryName,
      total: 0,
      source: 'missing',
      primaryTitle: '',
      primaryFile: '',
      exact: false,
      exactCount: 0,
    });
  }

  out.sort((a, b) => Number(a.exact) - Number(b.exact) || a.model.localeCompare(b.model));
  return out;
}

if (process.argv[1]?.includes('audit-model-coverage')) {
  const list = auditModels();
  writeFileSync(
    resolve(process.cwd(), 'scripts/data/model-audit.json'),
    JSON.stringify(list, null, 2),
    'utf-8',
  );
  const bad = list.filter((x) => !x.exact);
  console.log(`Tổng model: ${list.length}`);
  console.log(`Ảnh chính KHÔNG đúng model: ${bad.length}`);
  for (const b of bad) {
    console.log(
      `  - ${b.model.padEnd(42)} [${b.source}] ${b.primaryFile.slice(0, 70)}`,
    );
  }
}
