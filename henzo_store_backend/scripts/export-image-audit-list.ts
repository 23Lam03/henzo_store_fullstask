/**
 * Kiểm tra ảnh sản phẩm có khớp danh mục/tên sản phẩm không (thị giác).
 *
 * Dùng Vision framework của macOS để phân loại nội dung ảnh, rồi so
 * với danh mục sản phẩm kỳ vọng.
 *
 * Bước 1 (TS): xuất danh sách ảnh duy nhất + category kỳ vọng
 *   npx tsx scripts/export-image-audit-list.ts
 * Bước 2 (Swift): phân loại từng ảnh
 *   /tmp/vision-batch <file.json>
 * Bước 3 (TS): chấm điểm
 *   npx tsx scripts/score-image-audit.ts
 */
import { connectDB, disconnectDB } from '../src/server/db';
import { ProductModel } from '../src/server/models/Product';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

/** Từ khoá Vision dùng để suy ra danh mục từ nội dung ảnh. */
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Điện thoại': [
    'phone', 'smartphone', 'mobile', 'iphone', 'cellphone', 'handset',
    'tablet', 'ipad',
  ],
  Laptop: ['laptop', 'computer', 'macbook', 'notebook', 'screen', 'keyboard'],
  'PC Gaming': ['computer', 'tower', 'desktop', 'game', 'gpu', 'graphics'],
  'Màn hình': ['monitor', 'screen', 'display', 'television', 'tv'],
  Chuột: ['mouse', 'computer_mouse'],
  'Bàn phím': ['keyboard', 'keypad', 'computer_keyboard'],
  'Tai nghe': ['headphone', 'headset', 'earphone', 'audio'],
  'Phụ kiện': ['cable', 'cord', 'connector', 'adapter', 'bag', 'case'],
};

/** Danh mục nào có nhóm từ khoá gần nhau (ảnh máy tính dùng chung). */
const CATEGORY_OVERLAP: Record<string, string[]> = {
  'Điện thoại': ['Laptop', 'Phụ kiện'],
  Laptop: ['Điện thoại', 'PC Gaming', 'Màn hình', 'Phụ kiện'],
  'PC Gaming': ['Laptop', 'Màn hình', 'Bàn phím', 'Chuột'],
  'Màn hình': ['Laptop', 'PC Gaming'],
  Chuột: ['Bàn phím'],
  'Bàn phím': ['Chuột'],
  'Tai nghe': ['Chuột', 'Phụ kiện'],
};

async function main() {
  await connectDB();
  const docs = await ProductModel.find({}).lean();

  // Gom ảnh duy nhất kèm category kỳ vọng (loại ảnh giả).
  const map = new Map<
    string,
    { url: string; categories: Set<string>; products: string[] }
  >();

  for (const d of docs as any[]) {
    const images = (d.images ?? []) as string[];
    for (const u of images) {
      const slug = u.split('?')[0].split('/photo-')[1] ?? '';
      if (slug.length < 20) continue; // ảnh giả — bỏ qua ở bước này
      const e =
        map.get(u) ?? { url: u, categories: new Set<string>(), products: [] };
      e.categories.add(String(d.categoryName ?? ''));
      if (e.products.length < 6) e.products.push(String(d.name ?? ''));
      map.set(u, e);
    }
  }

  const list = [...map.values()].map((e) => {
    const cats = Array.from(e.categories);
    return {
      url: e.url,
      categories: cats,
      products: e.products,
      keywords: Array.from(
        new Set(cats.flatMap((c) => CATEGORY_KEYWORDS[c] ?? [])),
      ),
      overlap: Array.from(
        new Set(cats.flatMap((c) => CATEGORY_OVERLAP[c] ?? [])),
      ),
    };
  });

  const out = resolve(process.cwd(), '/tmp/image-audit-list.json');
  writeFileSync(out, JSON.stringify(list, null, 2), 'utf-8');
  console.log(`[audit] ${list.length} ảnh thật duy nhất -> ${out}`);
  await disconnectDB();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
