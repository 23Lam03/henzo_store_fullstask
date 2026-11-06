/**
 * Xuất JSON phục vụ trang audit ảnh (public/audit-images.html).
 *
 * Chạy: npx tsx scripts/export-audit-json.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { connectDB, disconnectDB } from '../src/server/db';
import { ProductModel } from '../src/server/models/Product';

function isFakeId(url: string): boolean {
  const slug = url.split('?')[0].split('/photo-')[1] ?? '';
  return slug.length < 20;
}

async function main() {
  await connectDB();
  const docs = await ProductModel.find({}).lean();

  const products = (docs as any[])
    .map((d) => ({
      name: d.name,
      slug: d.slug,
      brand: d.brand,
      categoryName: d.categoryName,
      images: (d.images ?? []) as string[],
      fake: ((d.images ?? []) as string[]).some((u) => isFakeId(u)),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const out = resolve(
    process.cwd(),
    '../henzo_store/public/audit-products.json',
  );
  writeFileSync(out, JSON.stringify({ products }, null, 2), 'utf-8');

  // Nhúng dữ liệu thẳng vào HTML để không phụ thuộc fetch (dev server có
  // thể chặn request .json từ static).
  const htmlPath = resolve(
    process.cwd(),
    '../henzo_store/public/audit-images.html',
  );
  const html = readFileSync(htmlPath, 'utf-8');
  const injected = html.replace(
    "const DATA_URL = '/audit-products.json';",
    `const DATA = ${JSON.stringify({ products })};`,
  );
  writeFileSync(htmlPath, injected, 'utf-8');

  console.log(
    `[audit] Đã ghi ${out} (${products.length} sản phẩm) + nhúng vào audit-images.html`,
  );
  await disconnectDB();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
