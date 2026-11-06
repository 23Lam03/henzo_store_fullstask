import { connectDB, disconnectDB } from '../src/server/db';
import { ProductModel } from '../src/server/models/Product';

function isFakeId(url: string): boolean {
  const base = url.split('?')[0];
  const slug = base.split('/photo-')[1] ?? '';
  return slug.length < 20;
}

function hasNumericSuffix(name: string): boolean {
  return /\s\d+$/.test(name);
}

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

async function main() {
  await connectDB();
  const total = await ProductModel.countDocuments({});
  const docs = await ProductModel.find({}).lean();

  const stats = {
    total,
    noImages: 0,
    fakePrimary: 0,
    realPrimary: 0,
    allFake: 0,
    allReal: 0,
    mixed: 0,
    numericSuffix: 0,
  };

  const nameCount = new Map<string, number>();
  const slugCount = new Map<string, number>();
  const fakeSamples: any[] = [];
  const realSamples: any[] = [];
  const dupNameSamples: any[] = [];

  for (const d of docs as any[]) {
    const name = String(d.name ?? '');
    const slug = String(d.slug ?? '');

    nameCount.set(name, (nameCount.get(name) ?? 0) + 1);
    slugCount.set(slug, (slugCount.get(slug) ?? 0) + 1);

    if (hasNumericSuffix(name)) stats.numericSuffix++;

    const images = (d.images ?? []) as string[];
    if (!images.length) {
      stats.noImages++;
      continue;
    }

    const flags = images.map((u) => isFakeId(u));
    const fakeCount = flags.filter(Boolean).length;

    if (flags[0]) stats.fakePrimary++;
    else stats.realPrimary++;

    if (fakeCount === images.length) stats.allFake++;
    else if (fakeCount === 0) stats.allReal++;
    else stats.mixed++;

    if (fakeCount > 0 && fakeSamples.length < 8) {
      fakeSamples.push({
        name,
        slug,
        brand: d.brand,
        category: d.categoryName,
        img: images[0],
        total: images.length,
        fake: fakeCount,
      });
    }
    if (fakeCount === 0 && realSamples.length < 8) {
      realSamples.push({ name, slug, brand: d.brand, img: images[0] });
    }
  }

  const dupNames = [...nameCount.entries()].filter(([, c]) => c > 1);
  const dupSlugs = [...slugCount.entries()].filter(([, c]) => c > 1);
  for (const [name, c] of dupNames.slice(0, 8)) {
    dupNameSamples.push({ name, count: c });
  }

  const baseGroups = new Map<string, string[]>();
  for (const d of docs as any[]) {
    const base = String(d.name ?? '').replace(/\s\d+$/, '');
    const list = baseGroups.get(base) ?? [];
    list.push(String(d.name));
    baseGroups.set(base, list);
  }
  const dups = [...baseGroups.entries()].filter(([, l]) => l.length > 1);

  console.log('\n════════ TỔNG QUAN ════════');
  console.log('Tổng sản phẩm        :', stats.total);
  console.log('Không có ảnh          :', stats.noImages);
  console.log('Ảnh chính GIẢ (chết) :', stats.fakePrimary);
  console.log('Ảnh chính THẬT        :', stats.realPrimary);
  console.log('Sản phẩm toàn ảnh giả :', stats.allFake);
  console.log('Sản phẩm toàn ảnh thật:', stats.allReal);
  console.log('Sản phẩm ảnh lẫn lộn  :', stats.mixed);
  console.log('Tên có hậu tố số      :', stats.numericSuffix);

  console.log('\n════════ TRÙNG TÊN ════════');
  console.log('Số tên trùng nhau      :', dupNames.length);
  console.log('Số slug trùng nhau     :', dupSlugs.length);
  console.log('Số nhóm tên gốc trùng  :', dups.length);
  console.log('Ví dụ tên trùng        :', JSON.stringify(dupNameSamples, null, 1));
  if (dups.length) {
    console.log(
      'Ví dụ nhóm gốc         :',
      JSON.stringify(
        dups.slice(0, 6).map(([k, v]) => ({ base: k, variants: v })),
        null,
        1,
      ),
    );
  }

  console.log('\n════════ ẢNH GIẢ (mẫu) ════════');
  console.log(JSON.stringify(fakeSamples, null, 1));

  console.log('\n════════ ẢNH THẬT (mẫu) ════════');
  console.log(JSON.stringify(realSamples, null, 1));

  const slugMismatch = (docs as any[]).filter((d) => {
    const n = norm(String(d.name ?? '')).replace(/\s\d+$/, '');
    const s = norm(String(d.slug ?? ''));

    const words = n.split(' ').filter((w) => w.length > 2);
    if (!words.length) return false;
    return !words.some((w) => s.includes(w));
  });
  console.log('\n════════ SLUG KHÔNG KHỚP TÊN ════════');
  console.log('Số lượng:', slugMismatch.length);
  console.log(
    JSON.stringify(
      slugMismatch.slice(0, 10).map((d) => ({ name: d.name, slug: d.slug })),
      null,
      1,
    ),
  );

  await disconnectDB();
}

main().catch((e) => {
  console.error('ERROR:', e);
  process.exit(1);
});
