import { readFileSync } from 'node:fs';

interface Item {
  url: string;
  categories: string[];
  products: string[];
  keywords: string[];
  overlap: string[];
  labels?: string[];
}

const LABEL_TO_CATEGORY: Record<string, string[]> = {
  computer_mouse: ['Chuột'],
  mouse: ['Chuột'],
  headphones: ['Tai nghe'],
  headset: ['Tai nghe'],
  earphone: ['Tai nghe'],
  keyboard: ['Bàn phím'],
  computer_keyboard: ['Bàn phím'],
  keypad: ['Bàn phím'],
  monitor: ['Màn hình'],
  display: ['Màn hình'],
  screen: ['Màn hình', 'Laptop'],
  television: ['Màn hình'],
  laptop: ['Laptop'],
  computer: ['Laptop', 'PC Gaming'],
  phone: ['Điện thoại'],
  smartphone: ['Điện thoại'],
  mobile_phone: ['Điện thoại'],
  cellphone: ['Điện thoại'],
  tablet: ['Điện thoại'],
  ipad: ['Điện thoại'],
  tower: ['PC Gaming'],
  circuit_board: ['PC Gaming'],
  game: ['PC Gaming'],
  gpu: ['PC Gaming'],
};

const DEFINITELY_WRONG = [
  'sofa', 'couch', 'bed', 'food', 'dish', 'plate', 'cup', 'beverage',
  'person', 'people', 'crowd', 'child', 'woman', 'man', 'dog', 'cat', 'bird',
  'flower', 'plant', 'tree', 'sky', 'cloud', 'sunset', 'landscape', 'beach',
  'mountain', 'building', 'car', 'road', 'street', 'wood', 'furniture',
  'clothing', 'shirt', 'shoe', 'book', 'paper', 'document', 'text', 'money',
];

function score(item: Item) {
  const labels = (item.labels ?? [])
    .map((l) => {
      const [conf, name] = l.split(':');
      return { conf: parseFloat(conf), name };
    })
    .filter((l) => l.name && !l.name.startsWith('ERROR'));

  if (!labels.length) {
    return { verdict: 'DEAD' as const, reason: 'tải ảnh thất bại (URL chết)' };
  }

  const wrong = labels.find(
    (l) => l.conf >= 0.4 && DEFINITELY_WRONG.includes(l.name),
  );
  if (wrong) {
    return {
      verdict: 'WRONG' as const,
      reason: `ảnh là "${wrong.name}" (${(wrong.conf * 100).toFixed(0)}%) — không phải ${item.categories.join('/')}`,
    };
  }

  const matched = labels.find((l) => {
    const cats = LABEL_TO_CATEGORY[l.name] ?? [];
    return cats.some((c) => item.categories.includes(c));
  });
  if (matched) {
    return {
      verdict: 'OK' as const,
      reason: `"${matched.name}" (${(matched.conf * 100).toFixed(0)}%) khớp ${item.categories.join('/')}`,
    };
  }

  const generic = labels.find(
    (l) => l.conf >= 0.5 && ['consumer_electronics', 'machine'].includes(l.name),
  );
  if (generic) {
    return {
      verdict: 'UNVERIFIED' as const,
      reason: `chỉ nhận diện chung "${generic.name}" — không xác định được danh mục`,
    };
  }

  return {
    verdict: 'UNVERIFIED' as const,
    reason: `nhãn: ${labels.slice(0, 3).map((l) => l.name).join(', ')}`,
  };
}

const file = process.argv[2] ?? '/tmp/image-audit-list-classified.json';
const items: Item[] = JSON.parse(readFileSync(file, 'utf-8'));

const results = items.map((i) => ({ item: i, ...score(i) }));

const byVerdict = {
  OK: results.filter((r) => r.verdict === 'OK'),
  UNVERIFIED: results.filter((r) => r.verdict === 'UNVERIFIED'),
  WRONG: results.filter((r) => r.verdict === 'WRONG'),
  DEAD: results.filter((r) => r.verdict === 'DEAD'),
};

console.log('\n════════ KẾT QUẢ KIỂM TRA ẢNH ════════');
console.log(`Tổng ảnh thật duy nhất : ${results.length}`);
console.log(`✓ ĐÚNG danh mục        : ${byVerdict.OK.length}`);
console.log(`? Chưa xác định được    : ${byVerdict.UNVERIFIED.length}`);
console.log(`✗ SAI danh mục          : ${byVerdict.WRONG.length}`);
console.log(`☠ URL chết             : ${byVerdict.DEAD.length}`);

for (const v of ['WRONG', 'DEAD', 'UNVERIFIED'] as const) {
  if (!byVerdict[v].length) continue;
  console.log(`\n──────── ${v} ────────`);
  for (const r of byVerdict[v]) {
    const id = r.item.url.split('/').pop()?.split('?')[0];
    console.log(`  ${id}`);
    console.log(`    dùng cho: ${r.item.categories.join(' / ')} — ${r.item.products.slice(0, 3).join(' | ')}`);
    console.log(`    ${r.reason}`);
  }
}

console.log('\n──────── OK ────────');
for (const r of byVerdict.OK) {
  const id = r.item.url.split('/').pop()?.split('?')[0];
  console.log(`  ✓ ${id}  (${r.item.categories.join('/')}) — ${r.reason}`);
}
