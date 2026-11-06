import { connectDB, disconnectDB } from '../src/server/db';
import { ProductModel } from '../src/server/models/Product';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

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

  const map = new Map<
    string,
    { url: string; categories: Set<string>; products: string[] }
  >();

  for (const d of docs as any[]) {
    const images = (d.images ?? []) as string[];
    for (const u of images) {
      const slug = u.split('?')[0].split('/photo-')[1] ?? '';
      if (slug.length < 20) continue;
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
