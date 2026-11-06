import { specsForProduct } from './modelSpecs';

export interface ProductCopyInput {
    productName: string;
    base: string;
    kind: string;
    category: string;
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

  const rnd = () => (seed === undefined ? Math.random() : ((seed * 9301 + 49297) % 233280) / 233280);
  if (rnd() > 0.72) tags.add('hot');
  if (rnd() > 0.78) tags.add('new');
  if (rnd() > 0.85) tags.add('best-seller');

  return [...tags];
}
