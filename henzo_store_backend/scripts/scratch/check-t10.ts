import { connectDB } from '../../src/server/db';
import { ProductModel } from '../../src/server/models/Product';

const TARGETS = [
  'Kingston FURY Beast',
  'Kingston FURY Renegade',
  'Logitech Streamcam',
  'HyperX Cloud Alpha',
  'SteelSeries Arctis Nova 7',
];

async function main() {
  await connectDB();
  const all = await ProductModel.find({}).lean();
  const byModel = new Map<string, number>();
  for (const p of all) {
    const n = String(p.name ?? '');
    for (const t of TARGETS) {
      if (n.toLowerCase().includes(t.toLowerCase())) {
        byModel.set(t, (byModel.get(t) ?? 0) + 1);
      }
    }
  }
  for (const t of TARGETS) {
    const c = byModel.get(t) ?? 0;
    console.log(`${c > 0 ? '✅' : '❌'} ${t}: ${c} sản phẩm`);
    if (c > 0) {
      const sample = all.find((p) => String(p.name).toLowerCase().includes(t.toLowerCase()));
      console.log(
        `     ví dụ: ${sample!.name} | ${sample!.images?.length ?? 0} ảnh | ${sample!.price?.toLocaleString('vi-VN')}đ | stock ${sample!.stock}`,
      );
    }
  }
  process.exit(0);
}
main();
