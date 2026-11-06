/**
 * Sinh 500 sản phẩm với 500 MODEL KHÁC NHAU.
 *
 * Vấn đề gốc: `mockSellerProducts` trước đây xoay vòng 20 tên cố định -> 500
 * sản phẩm chỉ có **20 model duy nhất**, mỗi model lặp ~25 lần. Hậu quả
 * trên giao diện: danh sách sản phẩm hiển thị hàng chục dòng giống hệt
 * nhau (cùng tên, cùng ảnh) -> người dùng báo "ảnh bị trùng lặp".
 *
 * Cách sửa: mỗi sản phẩm là một **biến thể cấu hình thật** của một dòng
 * sản phẩm (dung lượng, màu, kích thước) -> tên khác nhau, ảnh khác nhau,
 * tồn kho & giá độc lập.
 *
 * Mỗi biến thể có **đúng một tên duy nhất** trong toàn bộ 500 sản phẩm.
 */

/** Dung lượng thực tế theo loại sản phẩm. */
const CAPACITY_BY_KIND: Record<string, string[]> = {
  phone: ['128GB', '256GB', '512GB'],
  laptop: ['512GB', '1TB', '2TB'],
  tablet: ['256GB', '512GB', '1TB'],
  audio: ['—'],
  accessory: ['1TB', '2TB', '4TB'],
};

/** Màu thực tế theo dòng sản phẩm (Apple/Samsung dùng tên màu chính thức). */
const COLOR_BY_BRAND: Record<string, string[]> = {
  Apple: ['Titanium Gray', 'Natural Titanium', 'Deep Blue', 'Black', 'White'],
  Samsung: ['Titanium Gray', 'Titanium Black', 'Silver Shadow', 'Cobalt Violet'],
  ASUS: ['Eclipse Gray', 'Tonal Silver', 'Moonlight White'],
  Dell: ['Platinum Silver', 'Graphite Gray', 'Titanium Gray'],
  Lenovo: ['Lunar Gray', 'Storm Gray', 'Arctic White'],
  MSI: ['Black', 'Titanium Gray', 'White'],
  Razer: ['Black', 'White', 'Chromium'],
  Logitech: ['Graphite', 'Pale Gray', 'MX Stone'],
  Sony: ['Black', 'Silver', 'Midnight Blue'],
  Xiaomi: ['Black', 'Titanium Gray', 'Forest Green'],
  Google: ['Obsidian', 'Porcelain', 'Hazel'],
  Keychron: ['Carbon Black', 'Grey', 'Snow'],
  SteelSeries: ['Black', 'White', 'Mango'],
  Corsair: ['Black', 'White', 'Carbon'],
  HyperX: ['Black', 'Red', 'White'],
  JBL: ['Black', 'Blue', 'Sand'],
  Bose: ['Black', 'White', 'Sandstone'],
  default: ['Black', 'White', 'Gray'],
};

const SIZE_12 = '12"';
const SIZE_13 = '13"';
const SIZE_14 = '14"';
const SIZE_15 = '15"';
const SIZE_16 = '16"';
const SIZE_17 = '17"';
const SIZE_18 = '18"';
const SIZE_27 = '27"';
const SIZE_32 = '32"';
const SIZE_34 = '34"';

/**
 * Kích thước hiển thị cho tên sản phẩm.
 *
 * ⚠️  Nhiều base đã chứa sẵn kích thước (`MacBook Pro 14" M4 Pro`,
 *     `LG UltraWide 34"`, `Samsung Galaxy Book4 Ultra 16"`) — nếu gắn thêm
 *     size lần nữa sẽ ra `MacBook Pro 14" M4 Pro 14" 512GB`.
 *     Hàm này chỉ trả về size khi base CHƯA chứa size.
 */
function sizeSuffix(base: string, size: string): string {
  return /\d{1,2}(?:\.\d+)?\s*(?:"|inch)/i.test(base) ? '' : size;
}

export interface Variant {
  base: string;
  /** Tiền tố hãng. */
  brand: string;
  /** Loại sản phẩm — quyết định bộ dung lượng/màu phù hợp. */
  kind: 'phone' | 'laptop' | 'tablet' | 'audio' | 'accessory';
  /** Danh mục hiển thị. */
  category: string;
  /** Dung lượng / kích thước gắn thêm. */
  suffix?: string;
}

/**
 * 500 biến thể — mỗi dòng sản phẩm được mở rộng thành nhiều biến thể cấu
 * hình thực tế (dung lượng x màu x kích thước). Tổng đúng 500, tên đôi một
 * khác nhau.
 */
export const PRODUCT_VARIANTS: Variant[] = buildVariants();

function buildVariants(): Variant[] {
  const out: Variant[] = [];

  // ─── Điện thoại (135 = 45 model x 3 dung lượng) ───────────────────────
  const phones: Array<[string, string]> = [
    ['Apple', 'iPhone 16 Pro Max'],
    ['Apple', 'iPhone 16 Pro'],
    ['Apple', 'iPhone 16'],
    ['Apple', 'iPhone 16 Plus'],
    ['Apple', 'iPhone 16e'],
    ['Apple', 'iPhone 15 Pro Max'],
    ['Apple', 'iPhone 15 Pro'],
    ['Apple', 'iPhone 15'],
    ['Samsung', 'Samsung Galaxy S26 Ultra'],
    ['Samsung', 'Samsung Galaxy S26+'],
    ['Samsung', 'Samsung Galaxy S26'],
    ['Samsung', 'Samsung Galaxy S25 Ultra'],
    ['Samsung', 'Samsung Galaxy S25+'],
    ['Samsung', 'Samsung Galaxy S24 Ultra'],
    ['Samsung', 'Samsung Galaxy S24+'],
    ['Samsung', 'Samsung Galaxy A56'],
    ['Samsung', 'Samsung Galaxy A36'],
    ['Samsung', 'Samsung Galaxy A16'],
    ['Samsung', 'Samsung Galaxy Z Fold6'],
    ['Samsung', 'Samsung Galaxy Z Flip6'],
    ['Xiaomi', 'Xiaomi 15 Ultra'],
    ['Xiaomi', 'Xiaomi 15'],
    ['Xiaomi', 'Xiaomi 14T Pro'],
    ['Xiaomi', 'Poco F6 Pro'],
    ['Xiaomi', 'Poco X6 Pro'],
    ['Xiaomi', 'Redmi Note 14 Pro 5G'],
    ['OPPO', 'OPPO Find X8 Pro'],
    ['OPPO', 'OPPO Find X8'],
    ['OPPO', 'OPPO Reno13'],
    ['Vivo', 'Vivo X200 Pro'],
    ['Vivo', 'Vivo X200'],
    ['Vivo', 'Vivo V40 5G'],
    ['Google', 'Google Pixel 9 Pro XL'],
    ['Google', 'Google Pixel 9'],
    ['Realme', 'Realme GT 6'],
    ['Realme', 'Realme 13 Pro+'],
    ['Nokia', 'Nokia G42'],
    ['OnePlus', 'OnePlus 13'],
    ['OnePlus', 'OnePlus 12'],
    ['Honor', 'Honor Magic7 Pro'],
    ['Honor', 'Honor Magic6 Pro'],
    ['Tecno', 'Tecno Spark 30 Pro'],
    ['ASUS', 'ASUS ROG Phone 9 Pro'],
  ];
  for (const [brand, base] of phones) {
    for (const cap of CAPACITY_BY_KIND.phone) {
      out.push({ base, brand, kind: 'phone', category: 'Điện thoại', suffix: cap });
    }
  }

  // ─── Tablet (18 = 6 model x 3 dung lượng) ─────────────────────────────
  const tablets: Array<[string, string]> = [
    ['Apple', 'iPad Pro M4'],
    ['Apple', 'iPad Air M3'],
    ['Apple', 'iPad 10th Generation'],
    ['Samsung', 'Samsung Galaxy Tab S9 Ultra'],
    ['Samsung', 'Samsung Galaxy Tab S10+'],
    ['Xiaomi', 'Xiaomi Pad 6'],
  ];
  for (const [brand, base] of tablets) {
    for (const cap of CAPACITY_BY_KIND.tablet) {
      out.push({
        base,
        brand,
        kind: 'tablet',
        category: 'Điện thoại',
        suffix: `${cap} ${SIZE_13}`,
      });
    }
  }

  // ─── Laptop (132 = 44 model x 3 dung lượng) ───────────────────────────
  const laptops: Array<[string, string, string]> = [
    ['Apple', 'MacBook Pro 14" M4 Pro', SIZE_14],
    ['Apple', 'MacBook Pro 16" M4 Pro', SIZE_16],
    ['Apple', 'MacBook Pro 14" M3 Pro', SIZE_14],
    ['Apple', 'MacBook Pro 16" M3 Max', SIZE_16],
    ['Apple', 'MacBook Air 13" M4', SIZE_13],
    ['Apple', 'MacBook Air 15" M4', SIZE_15],
    ['ASUS', 'ASUS ROG Strix G16', SIZE_16],
    ['ASUS', 'ASUS ROG Zephyrus G16', SIZE_16],
    ['ASUS', 'ASUS ROG Swift OLED', SIZE_14],
    ['ASUS', 'ASUS TUF Gaming A15', SIZE_15],
    ['ASUS', 'ASUS ZenBook 14 OLED', SIZE_14],
    ['ASUS', 'ASUS VivoBook 15 OLED', SIZE_15],
    ['MSI', 'MSI Titan 18 HX', SIZE_18],
    ['MSI', 'MSI Raider GE78 HX', SIZE_16],
    ['MSI', 'MSI Stealth 16 AI Studio', SIZE_16],
    ['MSI', 'MSI Katana 15', SIZE_15],
    ['Dell', 'Dell XPS 16', SIZE_16],
    ['Dell', 'Dell XPS 15', SIZE_15],
    ['Dell', 'Dell Inspiron 15', SIZE_15],
    ['Dell', 'Dell Alienware x16', SIZE_16],
    ['Dell', 'Dell G16', SIZE_16],
    ['Lenovo', 'Lenovo ThinkPad X1 Carbon Gen 12', SIZE_14],
    ['Lenovo', 'Lenovo LOQ 15', SIZE_15],
    ['Lenovo', 'Lenovo Legion Pro 7', SIZE_16],
    ['Lenovo', 'Lenovo IdeaPad Slim 5', SIZE_14],
    ['Lenovo', 'Lenovo Yoga Pro 7', SIZE_14],
    ['HP', 'HP Omen 16', SIZE_16],
    ['HP', 'HP Spectre x360 16', SIZE_16],
    ['HP', 'HP Victus 15', SIZE_15],
    ['HP', 'HP Envy x360 14', SIZE_14],
    ['Acer', 'Acer Predator Helios Neo 16', SIZE_16],
    ['Acer', 'Acer Swift Go 14', SIZE_14],
    ['Acer', 'Acer Nitro V 15', SIZE_15],
    ['Gigabyte', 'Gigabyte AORUS 16X', SIZE_16],
    ['Gigabyte', 'Gigabyte AORUS M15', SIZE_15],
    ['Razer', 'Razer Blade 16', SIZE_16],
    ['Razer', 'Razer Blade 14', SIZE_14],
    ['Microsoft', 'Microsoft Surface Laptop 7', SIZE_13],
    ['Microsoft', 'Microsoft Surface Pro 12', SIZE_12],
    ['Samsung', 'Samsung Galaxy Book4 Ultra', SIZE_16],
    ['Huawei', 'Huawei MateBook X Pro', SIZE_14],
    ['LG', 'LG Gram 17', SIZE_17],
    ['LG', 'LG Gram 14', SIZE_14],
  ];
  for (const [brand, base, size] of laptops) {
    for (const cap of CAPACITY_BY_KIND.laptop) {
      out.push({
        base,
        brand,
        kind: 'laptop',
        category: 'Laptop',
        suffix: `${sizeSuffix(base, size)} ${cap}`,
      });
    }
  }

  // ─── Màn hình (40 model) ──────────────────────────────────────────────
  const monitors: Array<[string, string, string]> = [
    ['Samsung', 'Samsung Odyssey G9', SIZE_34],
    ['Samsung', 'Samsung Odyssey G8', SIZE_32],
    ['Samsung', 'Samsung Odyssey Neo G8', SIZE_32],
    ['Samsung', 'Samsung ViewFinity S8', SIZE_32],
    ['Samsung', 'Samsung Odyssey OLED G8', SIZE_32],
    ['LG', 'LG UltraGear 27GR95QE', SIZE_27],
    ['LG', 'LG UltraWide 34"', SIZE_34],
    ['LG', 'LG UltraGear 32GP950', SIZE_32],
    ['Dell', 'Dell Alienware AW3225QF', SIZE_32],
    ['Dell', 'Dell UltraSharp U2723QE', SIZE_27],
    ['Dell', 'Dell Alienware AW2723DZD', SIZE_27],
    ['ASUS', 'ASUS ProArt PA32UCG-K', SIZE_32],
    ['ASUS', 'ASUS ROG Swift PG32UCDM', SIZE_32],
    ['ASUS', 'ASUS ProArt PA279CV', SIZE_27],
    ['AOC', 'AOC AGON PRO AG274QZM', SIZE_27],
    ['AOC', 'AOC CU34G2X', SIZE_34],
    ['AOC', 'AOC AGON U27G3X', SIZE_27],
    ['BenQ', 'BenQ PD3225U', SIZE_32],
    ['BenQ', 'Zowie XL2546X', '24.5"'],
    ['BenQ', 'Zowie XL2566K', SIZE_27],
    ['BenQ', 'BenQ MO320U', SIZE_32],
    ['Gigabyte', 'Gigabyte M32UC', SIZE_32],
    ['Gigabyte', 'Gigabyte M27Q X', SIZE_27],
    ['Gigabyte', 'Gigabyte M34WMU', SIZE_34],
    ['MSI', 'MSI MAG 321UPX', SIZE_32],
    ['MSI', 'MSI MPG 271QRX', SIZE_27],
    ['MSI', 'MSI MAG 401QR', SIZE_32],
    ['HP', 'HP Omen 27qs', SIZE_27],
    ['HP', 'HP Victus 27q', SIZE_27],
    ['ViewSonic', 'ViewSonic XG272-2K-OLED', SIZE_27],
    ['ViewSonic', 'ViewSonic ColorPro VP3200-3K', SIZE_32],
    ['Philips', 'Philips 27E2N7900', SIZE_27],
    ['Philips', 'Philips 34E2N5600', SIZE_34],
    ['Lenovo', 'Lenovo Legion R32fc-30', SIZE_32],
    ['Lenovo', 'Lenovo ThinkVision T32p-30', SIZE_32],
    ['Razer', 'Razer Raptor 27"', SIZE_27],
    ['Acer', 'Acer Nitro XR273QK', SIZE_27],
    ['Acer', 'Acer Predator XB273K', SIZE_27],
    ['Corsair', 'Corsair Xeneon 27QHD240', SIZE_27],
  ];
  for (const [brand, base, size] of monitors) {
    out.push({
      base,
      brand,
      kind: 'accessory',
      category: 'Màn hình',
      suffix: sizeSuffix(base, size),
    });
  }

  // ─── Chuột (42 = 14 model x 3 màu) ────────────────────────────────────
  const mice: Array<[string, string]> = [
    ['Logitech', 'Logitech MX Master 3S'],
    ['Logitech', 'Logitech G Pro X Superlight 2'],
    ['Logitech', 'Logitech G502 X Plus Lightspeed'],
    ['Logitech', 'Logitech G502 Hero'],
    ['Razer', 'Razer DeathAdder V3 Pro'],
    ['Razer', 'Razer DeathAdder V3'],
    ['Razer', 'Razer Viper V3 Pro'],
    ['Razer', 'Razer Basilisk V3'],
    ['ASUS', 'ASUS ROG Harpe Ace Aim Lab Edition'],
    ['ASUS', 'ASUS ROG Harpe Ace'],
    ['Corsair', 'Corsair Katar Pro XT Wireless'],
    ['Corsair', 'Corsair M75 Wireless'],
    ['Endgame Gear', 'Endgame Gear XM2we Wireless'],
    ['SteelSeries', 'SteelSeries Rival 650 Wireless'],
  ];
  for (const [brand, base] of mice) {
    for (const color of (COLOR_BY_BRAND[brand] ?? COLOR_BY_BRAND.default)) {
      out.push({ base, brand, kind: 'accessory', category: 'Chuột', suffix: color });
    }
  }

  // ─── Bàn phím (45 = 15 model x 3 màu) ─────────────────────────────────
  const keyboards: Array<[string, string]> = [
    ['Keychron', 'Keychron Q1 Pro'],
    ['Keychron', 'Keychron Q1 Max'],
    ['Keychron', 'Keychron K2 Pro'],
    ['Logitech', 'MX Keys S'],
    ['Logitech', 'Logitech G915 TKL Lightspeed'],
    ['Razer', 'Razer BlackWidow V4 Pro'],
    ['Razer', 'Razer Huntsman V3 Pro'],
    ['Razer', 'Razer Cynara V3'],
    ['SteelSeries', 'SteelSeries Apex Pro TKL Wireless'],
    ['SteelSeries', 'SteelSeries Apex 3 Wireless'],
    ['Corsair', 'Corsair K100 RGB OPX Optical'],
    ['Corsair', 'Corsair K70 RGB Pro'],
    ['ASUS', 'ASUS ROG Azoth Extreme'],
    ['ROCCAT', 'ROCCAT Vulcan II Mini Air'],
    ['ROCCAT', 'ROCCAT Kone XP Air'],
  ];
  for (const [brand, base] of keyboards) {
    for (const color of (COLOR_BY_BRAND[brand] ?? COLOR_BY_BRAND.default)) {
      out.push({ base, brand, kind: 'accessory', category: 'Bàn phím', suffix: color });
    }
  }

  // ─── Tai nghe (48 = 16 model x 3 màu) ─────────────────────────────────
  const headsets: Array<[string, string]> = [
    ['Sony', 'Sony WH-1000XM5'],
    ['Sony', 'Sony WF-1000XM5'],
    ['Apple', 'AirPods Pro 2 USB-C'],
    ['Apple', 'AirPods Max'],
    ['Apple', 'AirPods 4 ANC'],
    ['Bose', 'Bose QuietComfort Ultra'],
    ['JBL', 'JBL Quantum 910 Wireless'],
    ['JBL', 'JBL Tour One M2'],
    ['SteelSeries', 'SteelSeries Arctis Nova Pro Wireless'],
    ['SteelSeries', 'SteelSeries Arctis Nova 7'],
    ['HyperX', 'HyperX Cloud III Wireless'],
    ['HyperX', 'HyperX Cloud Alpha Wireless'],
    ['Corsair', 'Corsair HS80 RGB USB'],
    ['Corsair', 'Corsair HS60 Wireless'],
    ['ASUS', 'ASUS ROG Delta S Wireless'],
    ['Logitech', 'Logitech G Pro X 2 Gaming Headset'],
  ];
  for (const [brand, base] of headsets) {
    for (const color of (COLOR_BY_BRAND[brand] ?? COLOR_BY_BRAND.default)) {
      out.push({ base, brand, kind: 'audio', category: 'Tai nghe', suffix: color });
    }
  }

  // ─── Linh kiện PC (30) ────────────────────────────────────────────────
  const pcParts: Array<[string, string]> = [
    ['NVIDIA', 'NVIDIA GeForce RTX 4090 Founders Edition'],
    ['NVIDIA', 'NVIDIA GeForce RTX 4080 SUPER Founders Edition'],
    ['NVIDIA', 'NVIDIA GeForce RTX 4070 Ti SUPER Founders Edition'],
    ['AMD', 'AMD Ryzen 9 7950X3D'],
    ['AMD', 'AMD Ryzen 7 7800X3D'],
    ['AMD', 'AMD Ryzen 5 7600X'],
    ['Intel', 'Intel Core i9-14900K'],
    ['Intel', 'Intel Core i7-14700K'],
    ['Intel', 'Intel Core i5-14600K'],
    ['Corsair', 'Corsair RM850x'],
    ['Corsair', 'Corsair RM750e'],
    ['Corsair', 'Corsair MP700 Pro SE'],
    ['G.Skill', 'G.Skill Trident Z5 RGB 64GB'],
    ['G.Skill', 'G.Skill Ripjaws S5 32GB'],
    ['Samsung', 'Samsung 990 PRO 4TB'],
    ['Samsung', 'Samsung 990 PRO 2TB'],
    ['Samsung', 'Samsung 870 EVO 1TB'],
    ['Western Digital', 'Western Digital Black SN850X 2TB'],
    ['Western Digital', 'Western Digital Blue SN580 1TB'],
    ['Crucial', 'Crucial P3 Plus 2TB'],
    ['Crucial', 'Crucial T500 1TB'],
    ['Seagate', 'Seagate FireCuda 530 2TB'],
    ['Seagate', 'Seagate Barracuda Compute 4TB'],
    ['Kingston', 'Kingston FURY Beast 32GB DDR5'],
    ['Kingston', 'Kingston FURY Renegade 1TB'],
    ['Asus', 'ASUS TUF Gaming VG32AQL3A'],
    ['Cooler Master', 'Cooler Master MTT G200 V2'],
    ['DeepCool', 'DeepCool AK620 Digital'],
    ['Logitech', 'Logitech C920 HD Pro Webcam'],
    ['Elgato', 'Elgato Stream Deck XL'],
  ];
  for (const [brand, base] of pcParts) {
    out.push({
      base,
      brand,
      kind: 'accessory',
      category: base.includes('Webcam') || base.includes('Stream Deck')
        ? 'Phụ kiện'
        : 'PC Gaming',
    });
  }

  // ─── Phụ kiện (14) ────────────────────────────────────────────────────
  const accessories: Array<[string, string]> = [
    ['Belkin', 'Belkin BoostCharge 3-in-1 MagSafe'],
    ['Anker', 'Anker 737 Power Bank 24K'],
    ['Apple', 'Apple 20W USB-C Power Adapter'],
    ['Samsung', 'Samsung 45W Travel Adapter'],
    ['Logitech', 'Logitech Streamcam'],
    ['Logitech', 'Logitech Brio 4K Webcam'],
    ['Razer', 'Razer Seiren V2 Pro'],
    ['Corsair', 'Corsair iCUE LINK System Hub'],
    ['SteelSeries', 'SteelSeries Sonar Wireless'],
    ['HyperX', 'HyperX Cloud III Sumi USB'],
    ['Elgato', 'Elgato Wave:3'],
    ['Elgato', 'Elgato HD60 X'],
    ['Keychron', 'Keychron K3 Pro Low Profile'],
    ['Lenovo', 'Lenovo ThinkPad TrackPoint Keyboard II'],
  ];
  for (const [brand, base] of accessories) {
    out.push({ base, brand, kind: 'accessory', category: 'Phụ kiện' });
  }

  return out;
}

/**
 * Tên đầy đủ của 1 biến thể — luôn khác nhau giữa các sản phẩm.
 */
export function variantName(v: Variant): string {
  const suffix = v.suffix ? ` ${v.suffix}` : '';
  return `${v.base}${suffix}`;
}

/** Suy ra danh mục từ biến thể. */
export function variantCategory(v: Variant): string {
  return v.category;
}

/** Suy ra thương hiệu từ biến thể. */
export function variantBrand(v: Variant): string {
  return v.brand;
}
