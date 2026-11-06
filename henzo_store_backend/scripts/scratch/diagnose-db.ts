import { connectDB, disconnectDB } from '../src/server/db';
import { ProductModel } from '../src/server/models/Product';

async function main() {
  await connectDB();
  const docs = (await ProductModel.find({})
    .select('name categoryName brand images')
    .lean()) as any[];

  // 1) Tên có hậu tố số đơn lẻ ở cuối ("...Ultra 112", "...Pro Max 256GB 37")
  const suffixNum = docs.filter((d) => /\s\d{1,3}$/.test(d.name));
  console.log(`TỔNG: ${docs.length} | tên có hậu tố số: ${suffixNum.length}`);
  for (const d of suffixNum.slice(0, 20)) {
    console.log(`  "${d.name}" [${d.categoryName}/${d.brand}] img=${(d.images?.[0] ?? '').slice(0, 80)}`);
  }

  // 2) Ảnh dùng chung: đếm ảnh trùng
  const imgCount = new Map<string, number>();
  for (const d of docs) {
    for (const u of d.images ?? []) imgCount.set(u, (imgCount.get(u) ?? 0) + 1);
  }
  console.log('\nTop ảnh dùng chung:');
  for (const [u, c] of [...imgCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)) {
    console.log(`  x${String(c).padStart(3)}  ${u.slice(0, 90)}`);
  }

  // 3) Poco F6 Pro đang dùng ảnh gì?
  const poco = docs.filter((d) => /poco/i.test(d.name));
  console.log(`\nPoco (${poco.length}):`);
  for (const d of poco.slice(0, 5)) {
    console.log(`  "${d.name}" [${d.categoryName}/${d.brand}]`);
    for (const u of d.images ?? []) console.log(`     ${u.slice(0, 90)}`);
  }

  // 4) iPhone 15 vs 16 đang dùng ảnh gì?
  const ip = docs.filter((d) => /iphone\s*1[56]/i.test(d.name));
  const ipImg = new Map<string, string[]>();
  for (const d of ip) {
    const key = (d.images?.[0] ?? '').split('/').pop()?.slice(0, 40) ?? '';
    ipImg.set(key, [...(ipImg.get(key) ?? []), d.name]);
  }
  console.log(`\niPhone 15/16 (${ip.length} sp) dùng ${ipImg.size} ảnh chính khác nhau:`);
  for (const [img, names] of ipImg) {
    console.log(`  ${img} x${names.length}  e.g. ${names[0]}`);
  }

  await disconnectDB();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
