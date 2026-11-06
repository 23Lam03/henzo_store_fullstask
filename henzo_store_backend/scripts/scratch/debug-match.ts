import { CATEGORY_IMAGES } from '../src/server/data/product-images';

const STOPWORDS = new Set([
  'pro', 'plus', 'max', 'ultra', 'mini', 'new', 'series', 'edition',
  'wireless', 'black', 'white', 'graphite', 'silver', 'space', 'gray',
  'grey', 'titanium', 'core', 'mobile', 'personal', 'computer', 'gaming',
  'flagship', 'refresh', 'one', 'two', 'x', 'xr', 'fe', 'gt', 'optical',
  'oled', 'qhd', 'uhd', 'hdr', 'rgb', 'usb', 'type', 'c', 'ips', 'led',
  'agon', 'proart', 'odyssey', 'ultragear', 'viewfinity', 'aoc',
]);

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}
function keyTokens(name: string): string[] {
  return norm(name).split(' ').filter((t) => t.length > 0 && !STOPWORDS.has(t));
}
function isModelCode(t: string): boolean {
  return /[a-z]+[0-9]/.test(t) || /^[0-9]{4,}[a-z]?$/.test(t);
}
function isMatch(title: string, name: string): boolean {
  const tSquish = norm(title).replace(/ /g, '');
  const tTokens = keyTokens(title);
  const tTokenSet = new Set(tTokens);
  const nTokens = keyTokens(name);
  const codes = nTokens.filter(isModelCode);
  for (const c of codes) if (!tSquish.includes(c)) return false;
  for (const tk of nTokens) {
    if (isModelCode(tk)) continue;
    if (tTokenSet.has(tk)) continue;
    if (tTokens.some((tt) => tt.startsWith(tk) && tk.length >= 3)) continue;
    return false;
  }
  return true;
}

const CASES: Array<[string, string]> = [
  ['IPhone 16 Pro', 'iPhone 16 Pro Max'],
  ['IPhone 16 Pro', 'iPhone 16'],
  ['IPhone 16', 'iPhone 16'],
  ['Samsung Galaxy S24', 'Samsung Galaxy S24 Ultra'],
  ['Samsung Galaxy S26', 'Samsung Galaxy S26 Ultra'],
  ['Samsung Galaxy Z Fold 6', 'Samsung Galaxy Z Fold6'],
  ['Xiaomi 15 Ultra', 'Xiaomi 15 Ultra'],
  ['Oppo Find X8', 'OPPO Find X8 Pro'],
  ['OnePlus 13', 'OnePlus 13'],
  ['Logitech MX Master 3S HS03', 'Logitech MX Master 3S'],
  ['ROG Strix G16 2026-08-08 ASUS 03', 'ASUS ROG Strix G16'],
  ['Google Pixel 9 Pro XL (back).jpg', 'Google Pixel 9 Pro XL'],
  ['File:Samsung Galaxy Z Flip 6.jpg', 'Samsung Galaxy Z Flip6'],
  ['File:Keychron Q1 Pro.jpg', 'Keychron Q1 Pro'],
  ['File:Sony WH-1000XM5.jpg', 'Sony WH-1000XM5'],
  ['File:Razer DeathAdder V3 Pro.jpg', 'Razer DeathAdder V3 Pro'],
];

for (const [title, name] of CASES) {
  console.log(
    `${isMatch(title, name) ? '✓' : '✗'} title="${title}" name="${name}" ` +
      `nTok=${JSON.stringify(keyTokens(name))} tTok=${JSON.stringify(keyTokens(title))}`,
  );
}

console.log(`\nCATEGORY_IMAGES keys: ${Object.keys(CATEGORY_IMAGES).join(', ')}`);
