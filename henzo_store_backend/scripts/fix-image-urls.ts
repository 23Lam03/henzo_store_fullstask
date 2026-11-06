import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { connectDB, disconnectDB } from '../src/server/db';
import { ProductModel } from '../src/server/models/Product';
import { resolveFiles } from './lib/commons-files';

function fileOf(url: string): string {
  const name = decodeURIComponent(url.split('?')[0]?.split('/').pop() ?? '');
  return name.replace(/^\d+px-/, '');
}

function isOriginal(url: string): boolean {
  return (
    url.includes('/commons/') &&
    !url.includes('/commons/thumb/') &&
    !url.includes('/thumb/')
  );
}

function stripQuery(url: string): string {
  return url.split('?')[0] ?? url;
}

async function main() {
  await connectDB();

  const products = (await ProductModel.find({})
    .select('name slug images')
    .lean()) as any[];

  const poolFiles = new Set<string>();
  for (const f of [
    'scripts/data/model-images.json',
    'scripts/data/type-image-pools.json',
  ]) {
    try {
      const json = JSON.parse(
        readFileSync(resolve(process.cwd(), f), 'utf-8'),
      ) as any;
      const urls: string[] = Array.isArray(json)
        ? json.flatMap((x: any) => x.images ?? [])
        : Object.values(json).flatMap((v: any) =>
            Array.isArray(v) ? v : (v?.images ?? []),
          );
      for (const u of urls) {
        if (isOriginal(u)) poolFiles.add(fileOf(u));
      }
    } catch {
          }
  }

  const dbFiles = new Set<string>();
  for (const p of products) {
    for (const u of (p.images ?? []) as string[]) {
      if (isOriginal(u)) dbFiles.add(fileOf(u));
    }
  }

  const allFiles = [...new Set([...dbFiles, ...poolFiles])];
  console.log(
    `[img-url] ${dbFiles.size} file trong DB + ${poolFiles.size} file trong pool`,
  );

  const map = await resolveFiles(allFiles);
  console.log(`[img-url] Tra được: ${map.size}/${allFiles.length}`);

    const normalize = (url: string): string => {
    if (!url.includes('/commons/')) return url;
    const clean = stripQuery(url);
    if (!isOriginal(url)) return clean;
    const thumb = map.get(fileOf(url));
    if (!thumb) return clean;

    return stripQuery(thumb);
  };

  let changed = 0;
  let unchanged = 0;
  for (const p of products) {
    const images = (p.images ?? []) as string[];
    if (!images.length) continue;
    const next = images.map(normalize);
    if (next.join('|') === images.join('|')) {
      unchanged++;
      continue;
    }
    changed++;
    await ProductModel.updateOne({ _id: p._id }, { $set: { images: next } });
  }
  console.log(`[img-url] DB: ${changed} sản phẩm đổi URL, ${unchanged} giữ nguyên`);

  for (const f of [
    'scripts/data/model-images.json',
    'scripts/data/type-image-pools.json',
  ]) {
    const path = resolve(process.cwd(), f);
    let json: any;
    try {
      json = JSON.parse(readFileSync(path, 'utf-8'));
    } catch {
      continue;
    }
    let touched = 0;
    if (Array.isArray(json)) {
      for (const v of json) {
        if (!v?.images?.length) continue;
        const next = v.images.map(normalize);
        if (next.join('|') !== v.images.join('|')) touched++;
        v.images = [...new Set(next)];
      }
    } else {
      for (const [key, v] of Object.entries<any>(json)) {
        if (Array.isArray(v)) {

          const next = v.map(normalize);
          if (next.join('|') !== v.join('|')) touched++;
          json[key] = [...new Set(next)];
        } else if (v?.images?.length) {

          const next = v.images.map(normalize);
          if (next.join('|') !== v.images.join('|')) touched++;
          v.images = [...new Set(next)];
        }
      }
    }
    writeFileSync(path, JSON.stringify(json, null, 2), 'utf-8');
    console.log(`[img-url] Pool ${f}: ${touched} mục đổi URL`);
  }

  const after = (await ProductModel.find({}).select('images').lean()) as any[];
  let originals = 0;
  let withQuery = 0;
  let shortLists = 0;
  for (const p of after) {
    const imgs = (p.images ?? []) as string[];
    if (imgs.length < 3) shortLists++;
    for (const u of imgs) {
      if (isOriginal(u)) originals++;
      if (u.includes('utm_')) withQuery++;
    }
  }
  console.log(`[img-url] Còn URL gốc: ${originals}`);
  console.log(`[img-url] Còn query tracking: ${withQuery}`);
  console.log(`[img-url] Sản phẩm < 3 ảnh: ${shortLists}`);

  await disconnectDB();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
