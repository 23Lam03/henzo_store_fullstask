/**
 * Mô tả & thẻ sản phẩm — sinh từ thông số THẬT của model.
 *
 * Dùng chung cho:
 *   - `henzo_store/src/data/sellerData.ts`  (sinh mock 500 sản phẩm)
 *   - `henzo_store_backend/scripts/apply-real-specs.ts` (đồng bộ DB)
 *
 * Trước đây mọi sản phẩm đều có mô tả giống nhau:
 *   "Mô tả chi tiết {tên}. Sản phẩm chất lượng cao, bảo hành chính hãng 12 tháng."
 * và tags rỗng — đó là lý do trang chi tiết sản phẩm thiếu tiêu chí.
 */
import { specsForProduct } from './modelSpecs';

export interface ProductCopyInput {
  /** Tên sản phẩm đầy đủ (vd: "iPhone 16 Pro Max 256GB"). */
  productName: string;
  /** Tên model gốc (vd: "iPhone 16 Pro Max"). */
  base: string;
  /** Loại: phone | laptop | tablet | audio | accessory. */
  kind: string;
  /** Danh mục hiển thị. */
  category: string;
  /** Thương hiệu. */
  brand: string;
}

const CATEGORY_NOTE: Record<string, string> = {
  'Điện thoại': 'Sản phẩm chính hãng, mới 100%, sẵn có tại kho Henzotech.',
  Laptop: 'Cấu hình mạnh, màn hình sắc nét, phù hợp cả làm việc lẫn giải trí.',
  'Màn hình': 'Màn hình hiển thị sắc nét, đồng bộ mượt mà cho mọi nhu cầu.',
  'PC Gaming': 'Cấu hình chơi game mượt mình, sẵn sàng cho các tựa game AAA.',
  Chuột: 'Độ chính xác cao, phản hồi nhanh cho cả chơi game lẫn văn phòng.',
  'Bàn phím': 'Góc phím êm tay, phản hồi gọn, hỗ trợ đa thiết bị.',
  'Tai nghe': 'Âm thanh chi tiết, chống ồn chủ động, micro rõ ràng.',
  'Phụ kiện': 'Phụ kiện chính hãng, tương thích tốt với thiết bị của bạn.',
};

/**
 * Mô tả sản phẩm 2-3 câu, gồm thông số nổi bật + cam kết bảo hành.
 */
export function productDescription(input: ProductCopyInput): string {
  const { productName, base, category, brand } = input;
  const { specs } = specsForProduct(productName);

  const pick = (...keys: string[]) => {
    for (const k of keys) {
      const v = specs[k];
      if (v && v !== '—') return v;
    }
    return '';
  };

  const lead = pick('Chip', 'CPU', 'GPU', 'Driver', 'Sensor', 'Switch', 'Mẫu thu');
  const mem = pick('RAM', 'Bộ nhớ');
  const screen = pick('Màn hình');
  const conn = pick('Kết nối', 'Cổng kết nối');
  const weight = pick('Trọng lượng');
  const warranty = pick('Bảo hành');

  const bits: string[] = [];
  if (lead) bits.push(lead);
  if (mem) bits.push(mem);
  if (screen) bits.push(screen);

  const head = bits.length ? bits.join(', ') : `${brand} ${base}`;

  const tail: string[] = [];
  if (conn) tail.push(`kết nối ${conn.toLowerCase()}`);
  if (weight) tail.push(`trọng lượng ${weight}`);
  tail.push('bảo hành chính hãng 12 tháng');
  if (warranty && !warranty.includes('năm')) tail.push(warranty);

  return (
    `${brand} ${base} với ${head}. ` +
    `${CATEGORY_NOTE[category] ?? 'Sản phẩm chất lượng cao, chính hãng.'} ` +
    `Thông số: ${tail.join(', ')}.`
  );
}

/**
 * Thẻ sản phẩm theo model + danh mục (KHÔNG random rỗng).
 *
 * @param seed số ngẫu nhiên đã cố định (để seed script cho kết quả ổn định).
 */
export function productTags(input: ProductCopyInput, seed?: number): string[] {
  const { base, kind, category, brand } = input;
  const tags = new Set<string>();

  tags.add(brand.toLowerCase());
  tags.add(category.toLowerCase());

  const modelTag = base.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (modelTag) tags.add(modelTag);

  if (kind === 'phone') tags.add('5g');
  if (kind === 'laptop') tags.add('laptop');
  if (kind === 'tablet') tags.add('tablet');
  if (kind === 'audio') tags.add('audio');
  if (kind === 'accessory') tags.add('phu-kien');

  // Nhãn bán chạy / mới — gắn theo chỉ số bán hàng, không random rỗng.
  // `seed` cho phép script backend tái lập đúng kết quả.
  const rnd = () => (seed === undefined ? Math.random() : ((seed * 9301 + 49297) % 233280) / 233280);
  if (rnd() > 0.72) tags.add('hot');
  if (rnd() > 0.78) tags.add('new');
  if (rnd() > 0.85) tags.add('best-seller');

  return [...tags];
}
