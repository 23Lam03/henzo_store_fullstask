/**
 * Chuẩn hoá tên sản phẩm -> TÊN MODEL (dùng chung cho resolver & script apply).
 *
 * Mục tiêu: gom các biến thể cấu hình của cùng một thiết bị về một model,
 * để ảnh tra cứu được gán đúng và không trùng lặp.
 *
 *   "iPhone 16 Pro Max 128GB Titanium Gray"  -> "iPhone 16 Pro Max"
 *   "ASUS ROG Harpe Ace Eclipse Gray"        -> "ASUS ROG Harpe Ace"
 *   "Samsung Galaxy S24 Ultra 256GB"         -> "Samsung Galaxy S24 Ultra"
 *
 * QUY TẮC: bỏ DUNG LƯỢNG + KÍCH THƯỚC + TÊN MÀU, nhưng GIỮ số trong tên
 * model (iPhone 16, RTX 4090, AW3225QF) — nếu xóa thì "iPhone 16" thành
 * "iPhone" và ảnh sẽ khớp sai model.
 */

/** Các cụm màu thực tế dùng trong tên sản phẩm (dài trước để khớp đúng). */
const COLOR_PHRASES = [
  'Natural Titanium',
  'Titanium Gray',
  'Titanium Black',
  'Eclipse Gray',
  'Tonal Silver',
  'Moonlight White',
  'Platinum Silver',
  'Graphite Gray',
  'Lunar Gray',
  'Storm Gray',
  'Arctic White',
  'Silver Shadow',
  'Cobalt Violet',
  'Forest Green',
  'Space Gray',
  'Carbon Black',
  'Pale Gray',
  'MX Stone',
  'Sandstone',
  'Chromium',
  'Obsidian',
  'Porcelain',
  'Hazel',
  'Graphite',
  'Mango',
  'Snow',
  'Midnight Blue',
  'Titanium',
  'Black',
  'White',
  'Silver',
  'Blue',
  'Sand',
  'Gray',
  'Grey',
].sort((a, b) => b.length - a.length);

/**
 * Bỏ tên màu ở CUỐI chuỗi (nếu có).
 *
 * So khớp theo **cụm màu có sẵn** chứ không theo regex tổng quát — tránh
 * việc nuốt mất tên model ("ASUS ROG Harpe Ace" bị cắt thành "ASUS ROG").
 */
function stripColor(name: string): string {
  let out = name;
  for (const color of COLOR_PHRASES) {
    const re = new RegExp(
      `\\s+${color.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
      'i',
    );
    const next = out.replace(re, '');
    // Chỉ bỏ nếu phần còn lại vẫn là một tên hợp lệ (>= 2 từ).
    if (next !== out && next.trim().split(/\s+/).length >= 2) {
      out = next;
      break;
    }
  }
  return out;
}

/**
 * Bỏ dung lượng & kích thước, giữ số trong tên model.
 *
 * LƯU Ý: giữ lại KÍCH THƯỚC MÀN HÌNH (inch) vì nó phân biệt model:
 *   "MacBook Pro 16\" M4 Pro"  vs  "MacBook Pro 14\" M4 Pro"
 * là 2 model khác nhau, ảnh cũng khác nhau (16-inch vs 14-inch).
 * Dung lượng (256GB) và tần số (360Hz) thì bỏ vì chỉ là biến thể cấu hình.
 */
function stripCapacity(name: string): string {
  return name
    .replace(/\s+\d+(?:\.\d+)?\s*(?:GB|TB|MB)\b/gi, ' ')
    .replace(/\s+\d+(?:\.\d+)?\s*(?:Hz|W|mm)\b/gi, ' ')
    // Kích thước màn hình: chuẩn hoá "34\"" / "34 inch" -> "34in".
    .replace(/\s*(\d{1,2}(?:\.\d+)?)\s*(?:"|inch)(?![a-z])/gi, ' $1in');
}

/**
 * Tên model chuẩn hoá.
 *
 * Ngoài ra còn bỏ MÃ KỸ THUẬT PHỤ ở cuối tên ("G614JIR", "PHN16-72",
 * "17Z90S-G.AA85N") — đây là mã định danh phiên bản, không xuất hiện trong
 * tên file ảnh nên gây khớp sai.
 */
export function modelName(name: string): string {
  let out = stripCapacity(name);
  out = stripColor(out);
  out = stripTechCode(out);
  return dedupeInch(out.replace(/\s+/g, ' ').trim());
}

/**
 * Tên model GIỮ kích thước màn hình (inch).
 *
 * Vì sao cần riêng:
 * - "MacBook Pro 16\" M4 Pro" và "MacBook Pro 14\" M4 Pro" là 2 model KHÁC
 *   NHAU. Nếu bỏ inch, cả hai gộp thành "MacBook Pro M4 Pro" -> cùng 1 ảnh
 *   16-inch cho cả hai -> ảnh sai.
 * - Tương tự: "Zowie XL2546X" (24.5") vs "Zowie XL2566K" (25") khác mã
 *   nên đã phân biệt được, nhưng "LG UltraWide 34\"" vs "LG UltraGear 27\""
 *   cần giữ inch.
 *
 * Chỉ dùng cho TRA CỨU ẢNH (nơi cần phân biệt chính xác), không dùng để
 * gom nhóm sản phẩm.
 */
export function modelNameWithSize(name: string): string {
  let out = name
    .replace(/\s+\d+(?:\.\d+)?\s*(?:GB|TB|MB)\b/gi, ' ')
    .replace(/\s+\d+(?:\.\d+)?\s*(?:Hz|W|mm)\b/gi, ' ')
    // GIỮ inch: chuyển thành dạng "16in" cho gọn và ổn định.
    .replace(/\s*(\d{1,2}(?:\.\d+)?)\s*(?:"|inch)(?![a-z])/gi, ' $1in');
  out = stripColor(out);
  out = stripTechCode(out);
  return dedupeInch(out.replace(/\s+/g, ' ').trim());
}

/**
 * Bỏ token inch TRÙNG LẶP.
 *
 * Tên sản phẩm đôi khi lặp kích thước: "MacBook Pro 14\" M4 Pro 14\"" ->
 * "MacBook Pro 14in M4 Pro 14in". Cần gộp lại thành 1 token để key ổn định.
 */
function dedupeInch(name: string): string {
  const seen = new Set<string>();
  return name
    .split(' ')
    .filter((t) => {
      const m = t.match(/^(\d{1,2}(?:\.\d+)?)in$/);
      if (!m) return true;
      if (seen.has(m[1])) return false;
      seen.add(m[1]);
      return true;
    })
    .join(' ');
}

/**
 * Bỏ mã kỹ thuật phụ ở CUỐI tên.
 *
 * Mã kỹ thuật = cụm chữ in hoa (1-6 ký tự) + số (>= 2 chữ số), đứng riêng
 * ở cuối: "G614JIR", "PHN16-72", "GU605MI", "RZ09-0485EDH3".
 *
 * Cẩn thận: KHÔNG bỏ "M4 Pro", "S26 Ultra", "RTX 4090" — chúng là mã
 * model thật, phải giữ. Vì vậy chỉ bỏ khi cụm đó ở CUỐI và có dạng
 * chữ-in-hoa + số dài.
 */
function stripTechCode(name: string): string {
  // Mã kỹ thuật ở CUỐI tên. Phải là cụm RIÊNG BIỆT (trước đó có khoảng
  // trắng) và có ít nhất 5 ký tự alnum.
  //
  //   "G614JIR" (6)  -> bỏ
  //   "GU605MI" (6)  -> bỏ
  //   "FA507UI" (6)  -> bỏ
  //   "PHN16-72"(7)  -> bỏ
  //   "WH-1000XM5"   -> KHÔNG bỏ: "WH" chỉ 2 chữ -> đây là tên model
  //                      (không phải mã kỹ thuật phụ)
  const re = /\s+([A-Z]{1,8}-?\d{2,}[A-Z0-9./-]*)$/;
  const out = name.replace(re, (m, core: string) => {
    // Mã model thật dạng "WH-1000XM5": phần chữ ĐẦU chỉ 2 ký tự.
    const head = core.split('-')[0];
    if (head.length <= 2) return m; // giữ nguyên
    return '';
  });
  return out.replace(/\s+/g, ' ').trim();
}

/**
 * Băm chuỗi -> số nguyên ổn định (reproducible giữa các lần chạy).
 */
export function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}
