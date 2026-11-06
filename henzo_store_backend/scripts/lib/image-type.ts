/**
 * KIỂM TRA ẢNH CÓ ĐÚNG LOẠI SẢN PHẨM KHÔNG.
 *
 * Vấn đề phát hiện khi audit ảnh:
 *   Pool ảnh của một model có thể chứa cả ảnh SAI LOẠI. Ví dụ pool
 *   "Vivo X200" chứa `Asus_vivobook.jpg` -> sản phẩm điện thoại Vivo bị
 *   gán ảnh laptop; pool "ASUS ROG Harpe Ace" (chuột) chứa ảnh ROG Phone.
 *
 * Cách sửa: trước khi gán ảnh cho sản phẩm, loại bỏ ảnh có dấu hiệu
 * thuộc loại khác. Ảnh chỉ bị loại khi KHÔNG có token của loại sản phẩm
 * đó VÀ có token của loại khác (tránh false positive với ảnh trung tính).
 */

/** Token đặc trưng cho từng loại sản phẩm. */
export const TYPE_MARKERS: Record<string, string[]> = {
  'Điện thoại': [
    'iphone', 'galaxy s', 'pixel', 'phone', 'smartphone', 'redmi', 'oneplus',
    'nothing phone', 'vivo x', 'vivo y', 'oppo find', 'oppo reno', 'xiaomi',
    'poco', 'realme', 'honor magic', 'nokia', 'tecno', 'infinix',
  ],
  Tablet: ['ipad', 'galaxy tab', 'tab s', 'tablet', 'xiaomi pad'],
  Laptop: [
    'macbook', 'notebook', 'laptop', 'thinkpad', 'ideapad', 'zenbook',
    'vivobook', 'xps', 'inspiron', 'pavilion', 'omen', 'spectre', 'predator',
    'nitro', 'swift', 'legion', 'LOQ', 'surface_laptop', 'matebook', 'gram',
    'aorus', 'razer_blade', 'titan', 'raider', 'stealth', 'katana', 'warrior',
    'alienware', 'g16', 'g15', 'elitebook', 'probook', 'envy', 'geforce',
    'aspire', 'swift go', 'matebook',
  ],
  'Màn hình': [
    'monitor', 'display', 'ultragear', 'odyssey', 'viewfinity', 'aorus',
    'ag274', 'ag27', 'cu34', 'pd3225', 'xl2546', 'xl2566', 'mo320u', 'm32uc',
    'm27q', 'm34wmu', '321upx', '271qrx', '401qr', '27qs', '27q', 'colorpro',
    '27e2n', '34e2n', 'legion r32', 'thinkvision', 'raptor', 'xr273qk',
    'xb273k', 'xeneon', 'aw3225', 'u2723', 'aw2723', 'pa32', 'pg32', 'pa279',
    'm32uc', 's3223',
  ],
  'PC Gaming': [
    'tower', 'gaming_pc', 'desktop', 'case_miditower', 'ryzen', 'core_i9',
    'core_i7', 'core_i5', 'geforce_rtx', 'rm850x', 'rm750e', 'mp700',
    '990_pro', '870_evo', 'sn850x', 'sn580', 'p3_plus', 't500', 'firecuda',
    'barracuda', 'fury_beast', 'fury_renegade', 'ak620', 'g200',
    // Ổ cứng / SSD: tên file Commons thường chứa "Western Digital",
    // "Scorpio Blue", "HDD"... cần có token riêng để KHÔNG bị coi là sai loại
    // chỉ vì tên file có chữ "Laptop" (vd "2.5 inch Laptop HDDs").
    'western_digital', 'western digital', 'scorpio', '_hdd', 'hard_disk',
    'hard disk', 'samsung_ssd', 'crucial_ssd', 'kingston_ssd',
  ],
  Chuột: [
    'mouse', 'chuột', 'g_pro_x_superlight', 'g502', 'deathadder', 'viper',
    'basilisk', 'harpe', 'katar', 'm75_wireless', 'xm2we', 'rival_650',
    'g502_x', 'brien', 'v2_pro', 'kone',
  ],
  'Bàn phím': [
    'keyboard', 'bàn phím', 'keychron', 'k70', 'hhkb', 'mx_keys', 'g915',
    'blackwidow', 'huntsman', 'cynara', 'apex_pro', 'apex_3', 'k100',
    'azoth', 'vulcan', 'kone_xp', 'ducky', 'stream_deck', 'thinkpad',
    'trackpoint',
  ],
  'Tai nghe': [
    'headset', 'headphone', 'tai nghe', 'wh-1000', 'wf-1000', 'airpods',
    'quietcomfort', 'quantum', 'tour_one', 'arctis', 'cloud_iii', 'cloud_alpha',
    'hs80', 'hs60', 'rog_delta', 'g_pro_x_2', 'eclipse', 'steelseries_arctis',
  ],
  'Phụ kiện': [
    'adapter', 'cable', 'hub', 'dock', 'charger', 'sạc', 'power_bank',
    'powerbank', 'mag_safe', 'boostcharge', '737_power', '20w_usb',
    '45w_travel', 'streamcam', 'brio', 'c920', 'wave:3', 'hd60', 'icue_link',
    'sonar_wireless', 'sumi', 'seiren', 'k3_pro',
  ],
};

/** Tất cả token của các loại khác (dùng để phát hiện ảnh lạc loại). */
const OTHER_MARKERS = Object.entries(TYPE_MARKERS)
  .filter(([c]) => c !== 'Điện thoại')
  .flatMap(([, t]) => t);

/** Số token của loại sản phẩm mà URL ảnh chứa. */
export function typeHits(url: string, type: string): number {
  const u = decodeURIComponent(url).toLowerCase();
  return (TYPE_MARKERS[type] ?? []).filter((t) => u.includes(t)).length;
}

/**
 * Ảnh CHẮC CHẮN không phải sản phẩm công nghệ — ảnh động vật, con người,
 * phong cảnh... Commons có rất nhiều ảnh như vậy (chuột nhắc, lemur, bản đồ).
 *
 * Những ảnh này chứa token của loại (vd "mouse") nên logic "có token của loại
 * khác" không bắt được -> phải loại trực tiếp.
 */
const NON_PRODUCT = [
  'spider', 'lemmur', 'grass mouse', 'mouse-deer', 'chevo', 'mouse brain',
  'mouse kidney', 'mouse pony', 'harvest mouse', 'bambary', 'striped grass',
  'mouse trap', 'mouse-pad', 'cat-and-computer', 'cat and computer',
  'rebindi', 'todd', 'person ', 'woman', 'girl ', 'crowd', 'protest',
  'landscape', 'mountain', 'flower', 'blossom', 'temple', 'church',
  'statue', 'painting', 'drawing', 'cartoon', 'comic', 'mechanism',
];

/**
 * Ảnh có SAI LOẠI không?
 *
 * - Có token của loại khác và KHÔNG có token của loại đang xét -> sai.
 * - Không có token nào -> ảnh trung tính, coi là đúng (không đoán bừa).
 */
export function isWrongType(url: string, type: string): boolean {
  const u = decodeURIComponent(url).toLowerCase();
  // Ảnh không phải sản phẩm -> coi như sai loại.
  if (NON_PRODUCT.some((t) => u.includes(t))) return true;
  const own = (TYPE_MARKERS[type] ?? []).filter((t) => u.includes(t));
  if (own.length) return false;
  return OTHER_MARKERS.some((t) => u.includes(t));
}
