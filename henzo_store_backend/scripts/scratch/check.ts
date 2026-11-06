import { isProductPhoto, isMatch, isIntitleMatch } from '../resolve-model-images';

/**
 * [tiêu đề ảnh, brand, model, kỳ vọng]
 *  expected = true  -> ảnh PHẢI được chấp nhận
 *  expected = false -> ảnh PHẢI bị loại
 */
const CASES: Array<[string, string, string, boolean]> = [
  // ── Ảnh KHÔNG phải sản phẩm ───────────────────────────────────────────
  ['File:IPhone 15 机型价格 & 性能数据对比图.png', 'Apple', 'iPhone 15', false],
  ['File:Air Scoop - 2015 BMW M3 (15383974204).jpg', 'Apple', 'iPad Air M3 13in', false],
  ['File:Deepwater Horizon oil spill - May 24, 2010.jpg', 'BenQ', 'Zowie XL2546X 24.5in', false],
  ['File:Xiaomi Mi A3 phone.png', 'Xiaomi', 'Poco F6 Pro', false],
  ['File:Realme X50 Pro 5G smartphone.jpg', 'Realme', 'Realme GT 6', false],
  ['File:IBM Aptiva 486 com monitor Samsung 4Ne e impressora Epson Stylus Color 480.jpg', 'Samsung', 'Samsung Odyssey G8 32in', false],
  ['File:Dell Laptop-Keyboard.jpg', 'Dell', 'Dell Inspiron 15 3530', false],
  ['File:Rami talking at KOL Stage, BenQ monitor on the table 20251114.jpg', 'BenQ', 'BenQ MO320U 32in', false],
  ['File:OnePlus AC2003 with a broken screen, 13.jpg', 'OnePlus', 'OnePlus 13', false],
  ['File:SAMSUNG Galaxy S26 Ultra & SAMSUNG Galaxy Buds4 Pro.jpg', 'Samsung', 'Samsung Galaxy S26 Ultra', false],
  ['File:Custom Computer with Open Case 1 2018-05-06.jpg', 'Custom', 'PC Gaming RTX 5090 Supreme', false],
  ['File:ViewSonic monitor at Platform 2, TRA Baifu Station 20221113.jpg', 'ViewSonic', 'ViewSonic XG272-2K-OLED 27in', false],
  ['File:Black_Smartphone_The_realme_16_Pro_2026-08-11_Titan_battery_03.jpg', 'Realme', 'Realme GT 6', false],
  ['File:Logitech Gaming-Keyboard G15.jpg', 'Logitech', 'Logitech G915 TKL Lightspeed', false],
  ['File:Logitech Gaming-Keyboard G15.jpg', 'Logitech', 'Logitech G Pro X 60% TKL Lightspeed', false],
  ['File:MacBook Pro (14-inch, M4 Pro, Silver).jpg', 'Apple', 'MacBook Pro 16in M4 Pro', false],
  ['File:About iPhone 16 Plus in Pink.jpg', 'Apple', 'iPhone 16', false],
  ['File:Back of iPhone 16 Plus.jpg', 'Apple', 'iPhone 16', false],
  ['File:Sony Ericsson G502 (Premium Black) - Front.jpg', 'Logitech', 'Logitech G502 Hero', false],

  // ── Ảnh ĐÚNG model ───────────────────────────────────────────────────
  ['File:Back of iPhone 16 Pro Max Gold model.jpg', 'Apple', 'iPhone 16 Pro Max', true],
  ['File:Logitech MX Master 3S HS03.jpg', 'Logitech', 'Logitech MX Master 3S Graphite', true],
  ['File:Logitech MX Keys YR0073 Wireless Keyboard.jpg', 'Logitech', 'Logitech MX Keys S', true],
  ['File:MacBook Pro (16-inch, M4 Pro, Silver).jpg', 'Apple', 'MacBook Pro 16in M4 Pro', true],
];

// Ảnh tìm được qua lớp `intitle:` — chỉ cần qua bộ lọc ảnh sản phẩm.
const INTITLE_OK: Array<[string, string, string]> = [
  ['File:G502 Hero.jpg', 'Logitech', 'Logitech G502 Hero'],
  ['File:2026 G502 X PLUS (side view).jpg', 'Logitech', 'Logitech G502 X Plus Lightspeed'],
];

// Ảnh KHÔNG được chấp nhận qua lớp `intitle:` (trùng mã nhưng sai sản phẩm).
const INTITLE_BAD: Array<[string, string, string]> = [
  ['File:Taj Mahal, Agra, Uttar Pradesh s-60.jpg', 'Corsair', 'Corsair HS60 Wireless'],
  ['File:Board of G915 (20210625091622).jpg', 'Logitech', 'Logitech G915 TKL Lightspeed'],
  ['File:Shuinanzhuang level crossing when G915 passing (20210922094301).jpg', 'Logitech', 'Logitech G915 TKL Lightspeed'],
  ['File:Air Scoop - 2015 BMW M3 (15383974204).jpg', 'Apple', 'iPad Air M3 13in'],
  ['File:Sony Ericsson G502 (Premium Black) - Front.jpg', 'Logitech', 'Logitech G502 Hero'],
  // ẢNH của hãng KHÁC -> phải loại.
  ['File:2023 Gigabyte GeForce RTX 4070 Aero OC 12GB (3).jpg', 'NVIDIA', 'NVIDIA GeForce RTX 4070 Ti SUPER Founders Edition'],
  ['File:Wireless mouse logi.jpg', 'Corsair', 'Corsair Katar Pro XT Wireless'],
  ['File:Wireless mouse logi.jpg', 'Endgame Gear', 'Endgame Gear XM2we Wireless'],
  // Khác BẬC sau mã model -> phải loại.
  ['File:NVIDIA GeForce RTX 4070 Founders Edition.jpg', 'NVIDIA', 'NVIDIA GeForce RTX 4070 Ti SUPER Founders Edition'],
];

let pass = 0;
let fail = 0;
for (const [title, brand, model, expected] of CASES) {
  const got = isProductPhoto(title, brand, model) && isMatch(title, model);
  if (got === expected) {
    pass++;
  } else {
    fail++;
    console.log(
      `FAIL (mong đợi ${expected ? 'PASS' : 'FAIL'})  ${title.slice(0, 58).padEnd(60)} | ${model}`,
    );
  }
}
console.log(`\n${pass} pass, ${fail} fail`);

// Lớp intitle: chỉ cần bộ lọc ảnh sản phẩm (không dùng isMatch).
for (const [title, brand, model] of INTITLE_OK) {
  const got = isIntitleMatch(title, brand, model);
  console.log(
    `${got ? 'PASS' : 'FAIL'}  [intitle] ${title.slice(0, 46).padEnd(48)} | ${model}`,
  );
}
for (const [title, brand, model] of INTITLE_BAD) {
  const got = isIntitleMatch(title, brand, model);
  console.log(
    `${got ? 'FAIL' : 'PASS'}  [intitle-bad] ${title.slice(0, 44).padEnd(46)} | ${model}`,
  );
}
