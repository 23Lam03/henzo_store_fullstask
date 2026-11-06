/**
 * KIỂM TRA TOÀN BỘ TIÊU CHÍ SẢN PHẨM trong MongoDB.
 *
 * Bao phủ:
 *  1. Thông số kỹ thuật thật (>= 6 khoá, không còn mẫu random CPU/RAM/SSD)
 *  2. Mô tả khác generic, đúng model
 *  3. Tags không rỗng
 *  4. Tên / slug duy nhất
 *  5. Ảnh đúng model & không trùng lặp
 *  6. Giá / tồn kho hợp lệ
 *  7. Category / brand đầy đủ
 */
import { connectDB, disconnectDB } from '../src/server/db';
import { ProductModel } from '../src/server/models/Product';
import { specModelKey } from '../../henzo_store/src/data/modelSpecs';

const GENERIC_DESC = /^Mô tả chi tiết/;
const RANDOM_KEYS = ['CPU', 'RAM', 'SSD'];
const MIN_SPECS = 6;

async function main() {
  await connectDB();
  const products = await ProductModel.find({});
  console.log(`Tổng sản phẩm: ${products.length}\n`);

  const issues: Record<string, string[]> = {
    'Thông số thiếu/quá ít': [],
    'Thông số còn dạng random': [],
    'Mô tả generic': [],
    'Mô tả thiếu': [],
    'Tags rỗng': [],
    'Tên trùng': [],
    'Slug trùng': [],
    'Ảnh thiếu': [],
    'Ảnh trùng giữa các model': [],
    'Giá không hợp lệ': [],
    'Tồn kho không hợp lệ': [],
    'Thiếu category/brand': [],
  };

  const nameCount = new Map<string, number>();
  const slugSet = new Set<string>();
  const slugDup = new Set<string>();
  const imgCount = new Map<string, string[]>();
  /** Ảnh -> set model dùng ảnh đó (dùng để phát hiện trùng GIỮA CÁC MODEL). */
  const imgModels = new Map<string, Set<string>>();

  for (const p of products) {
    const name = String(p.name);
    const specs = p.specifications ? Object.fromEntries(p.specifications) : (p.specifications as unknown as Record<string, string>) ?? {};
    const specKeys = Object.keys(specs);

    if (specKeys.length < MIN_SPECS) {
      issues['Thông số thiếu/quá ít'].push(`${name} (${specKeys.length} khoá)`);
    }
    // Còn sót mẫu random: đúng 3 khoá CPU/RAM/SSD
    if (specKeys.length === 3 && RANDOM_KEYS.every((k) => k in specs)) {
      issues['Thông số còn dạng random'].push(`${name} -> ${JSON.stringify(specs)}`);
    }

    const desc = String(p.description ?? '');
    if (!desc.trim()) issues['Mô tả thiếu'].push(name);
    else if (GENERIC_DESC.test(desc)) issues['Mô tả generic'].push(name);

    if (!p.tags || p.tags.length === 0) issues['Tags rỗng'].push(name);

    nameCount.set(name, (nameCount.get(name) ?? 0) + 1);
    const slug = String(p.slug);
    if (slugSet.has(slug)) slugDup.add(slug);
    slugSet.add(slug);

    const imgs = (p.images ?? []).map(String);
    if (!imgs.length) issues['Ảnh thiếu'].push(name);
    for (const img of imgs) {
      const arr = imgCount.get(img) ?? [];
      arr.push(name);
      imgCount.set(img, arr);

      const model = specModelKey(name);
      const set = imgModels.get(img) ?? new Set<string>();
      set.add(model);
      imgModels.set(img, set);
    }

    const price = Number(p.price ?? 0);
    const original = Number(p.originalPrice ?? 0);
    if (!(price > 0)) issues['Giá không hợp lệ'].push(`${name} (${price})`);
    if (original && original < price)
      issues['Giá không hợp lệ'].push(`${name} (original ${original} < price ${price})`);

    const stock = Number(p.stock ?? 0);
    if (stock < 0) issues['Tồn kho không hợp lệ'].push(`${name} (${stock})`);

    if (!p.categoryName || !p.brand) {
      issues['Thiếu category/brand'].push(`${name} (${p.categoryName}/${p.brand})`);
    }
  }

  for (const [k, v] of Object.entries(nameCount)) {
    if (v > 1) issues['Tên trùng'].push(`${k} x${v}`);
  }
  for (const s of slugDup) issues['Slug trùng'].push(s);

  // Ảnh trùng GIỮA CÁC MODEL KHÁC NHAU -> ảnh sai (lỗi nghiệp vụ).
  const crossModel = [...imgModels.entries()].filter(([, s]) => s.size > 1);
  for (const [img, models] of crossModel) {
    issues['Ảnh trùng giữa các model'].push(
      `${[...models].join(' <> ')} <- ${img.slice(0, 70)}`,
    );
  }

  // Ảnh phụ trùng giữa các biến thể CÙNG model -> chấp nhận được
  // (cùng thiết bị, khác dung lượng/màu) — chỉ thống kê.
  const sameModelDup = [...imgCount.entries()].filter(([, v]) => v.length > 1);
  console.log(
    `\nℹ  Ảnh phụ dùng chung giữa các biến thể cùng model: ${sameModelDup.length} URL ` +
      `(đúng nghiệp vụ — cùng thiết bị, khác cấu hình)`,
  );

  let total = 0;
  for (const [k, v] of Object.entries(issues)) {
    total += v.length;
    console.log(
      `${v.length === 0 ? '✅' : '❌'} ${k}: ${v.length}`,
    );
    v.slice(0, 6).forEach((x) => console.log(`     - ${x}`));
    if (v.length > 6) console.log(`     ... +${v.length - 6} nữa`);
  }
  console.log(`\nTỔNG VẤN ĐỀ: ${total}`);

  await disconnectDB();
}
main().catch((e) => { console.error(e); process.exit(1); });
