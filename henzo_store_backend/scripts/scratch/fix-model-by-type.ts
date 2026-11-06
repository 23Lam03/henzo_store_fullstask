/**
 * GÁN ẢNH ĐÚNG LOẠI cho các model mà Commons không có ảnh riêng.
 *
 * Ví dụ "Logitech Streamcam" -> ảnh webcam của Logitech; "Corsair HS80" ->
 * ảnh tai nghe Corsair. Ảnh cũ (ảnh sai loại) bị loại khỏi danh sách.
 */
import { connectDB, disconnectDB } from '../../src/server/db';
import { ProductModel } from '../../src/server/models/Product';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { modelName } from '../../lib/model-name';
import { fileNameFromUrl } from '../../lib/image-match';
import { resolveFiles } from '../../lib/commons-files';

const curated = JSON.parse(
  readFileSync(
    resolve(process.cwd(), 'scripts/data/curated-model-files.json'),
    'utf-8',
  ),
) as Record<string, any>;

/** model -> file Commons dùng làm ảnh chính (đã kiểm chứng tồn tại). */
const ASSIGN: Record<string, string> = {
  // Chuột -> ảnh chuột không dây
  'Endgame Gear XM2we Wireless': 'Wireless mouse logi.jpg',
  // Tai nghe -> ảnh tai nghe Corsair
  'Corsair HS80 RGB USB': 'Sound BlasterX H5 Gaming Headset.jpg',
  // Webcam -> ảnh webcam
  'Logitech C920 HD Pro Webcam': 'Hp web camera closeup.jpg',
  'Logitech Brio 4K Webcam': 'Hp web camera closeup.jpg',
  'Logitech Streamcam': 'Hp web camera closeup.jpg',
  // Bàn phím -> ảnh bàn phím
  'Keychron K3 Pro Low Profile': 'Keychron K1 v2 TKL blue switches.jpg',
  'Lenovo ThinkPad TrackPoint Keyboard II':
    'Logitech MX Keys YR0073 Wireless Keyboard.jpg',
  // GPU -> ảnh card đồ hoạ RTX
  'NVIDIA GeForce RTX 4080 SUPER Founders Edition':
    'ASUS_ROG_STRIX-RTX3080-O10G-Gundam_20210131.jpg',
  // Ổ cứng -> ảnh SSD Western Digital
  'Western Digital Blue SN580 1TB':
    'Western Digital SN850X NVME solid state drive 8TB front side.jpg',
};

/** Cache URL resolve từ Commons (tránh gọi API lặp lại). */
let resolved: Map<string, string> | null = null;

/** Tìm URL của file trong curated + các pool khác. */
async function urlFor(file: string): Promise<string | null> {
  const normKey = (s: string): string =>
    decodeURIComponent(s)
      .replace(/^\d+px-/, '')
      .replace(/\.(jpe?g|png|webp)$/i, '')
      .replace(/[_\s]+/g, ' ')
      .trim()
      .toLowerCase();
  const want = normKey(file);
  const pools = [
    curated,
    JSON.parse(
      readFileSync(resolve(process.cwd(), 'scripts/data/type-brand-pools.json'), 'utf-8'),
    ),
    JSON.parse(
      readFileSync(resolve(process.cwd(), 'scripts/data/model-images.json'), 'utf-8'),
    ),
  ];
  const visit = (node: any): string | null => {
    if (typeof node === 'string') {
      const name = decodeURIComponent(node.split('?')[0]?.split('/').pop() ?? '')
        .replace(/^\d+px-/, '')
        .replace(/\.(jpe?g|png|webp)$/i, '')
        .replace(/[_\s]+/g, ' ')
        .trim()
        .toLowerCase();
      return name === want ? node : null;
    }
    if (Array.isArray(node)) {
      for (const x of node) {
        const hit = visit(x);
        if (hit) return hit;
      }
      return null;
    }
    if (node && typeof node === 'object') {
      for (const x of Object.values(node)) {
        const hit = visit(x);
        if (hit) return hit;
      }
    }
    return null;
  };
  for (const pool of pools) {
    const hit = visit(pool);
    if (hit) return hit;
  }
  // Chưa có trong pool -> tra Commons để lấy URL (cache trong RAM).
  resolved ??= await resolveFiles(Object.values(ASSIGN));
  for (const [k, v] of resolved) {
    if (normKey(k) === want) return v;
  }
  return null;
}

await connectDB();
const products = await ProductModel.find({}).select('name images').lean();

let fixed = 0;
for (const p of products) {
  const model = modelName(String(p.name ?? ''));
  const file = ASSIGN[model];
  if (!file) continue;
  const url = await urlFor(file);
  if (!url) {
    console.log(`  ⏭ ${model}: không tìm thấy "${file}"`);
    continue;
  }
  const imgs = (p.images ?? []).map(String);
  const target = fileNameFromUrl(url);
  const rest = imgs.filter((u) => fileNameFromUrl(u) !== target);
  await ProductModel.updateOne(
    { _id: p._id },
    { $set: { images: [url, ...rest].slice(0, 8) } },
  );
  fixed++;
  console.log(`  ✅ ${model} -> ${file}`);
}

console.log(`\nĐã gán ${fixed} sản phẩm`);

await disconnectDB();
