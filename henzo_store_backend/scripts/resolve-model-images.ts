/**
 * Tra cứu ảnh THẬT theo từng MODEL sản phẩm (nhiều ảnh / model).
 *
 * Vấn đề gốc: mọi sản phẩm chỉ dùng 22 URL ảnh stock theo danh mục ->
 * "iPhone 16" và "iPhone 15" hiện CÙNG ảnh, và 500 sản phẩm chỉ có
 * 20 model nên danh sách lặp hàng chục dòng giống hệt nhau.
 *
 * Chiến lược:
 * 1. **Wikipedia media-list** — lấy NHIỀU ảnh của đúng trang model
 *    (iPhone 16 Pro, Samsung Galaxy S24, MacBook Pro M4...).
 * 2. **Wikipedia pageimages** — ảnh đại diện của trang khớp model.
 * 3. **Wikimedia Commons search** — ảnh chụp thực tế cho dòng không có
 *    trang Wikipedia riêng (Logitech MX Master 3S, Razer DeathAdder V3...).
 *
 * CHỐNG KHỚP SAI (quan trọng nhất):
 * - Mọi MÃ MODEL của tên (G16, S24, Fold6, M3, 14900K) phải xuất hiện
 *   trong tiêu đề ảnh. "Nokia G42" KHÔNG được nhận ảnh "Nokia".
 *   "iPhone 16" KHÔNG được nhận ảnh "IPhone 16 Pro".
 *
 * Chạy: npx tsx scripts/resolve-model-images.ts
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { modelName as normalizeModelName, modelNameWithSize } from './lib/model-name';

const UA = 'henzo-store/1.0 (model image resolver; dev@henzo.local)';

/**
 * Token "yếu" — xuất hiện ở nhiều sản phẩm, không dùng để định danh.
 *
 * ⚠️ KHÔNG được thêm TÊN DÒNG sản phẩm vào đây (odyssey, ultragear,
 * viewfinity, agon, proart, gt...). Tên dòng là dấu hiệu nhận diện quan
 * trọng nhất để chọn ảnh ĐÚNG DÒNG. VD: "Samsung Odyssey G8" phải bắt
 * được ảnh có chữ "Odyssey", không được nhận ảnh màn hình Samsung chung
 * chung.
 */
const STOPWORDS = new Set([
  'pro', 'plus', 'max', 'ultra', 'mini', 'new', 'series', 'edition',
  'wireless', 'black', 'white', 'graphite', 'silver', 'space', 'gray',
  'grey', 'titanium', 'core', 'mobile', 'personal', 'computer', 'gaming',
  'flagship', 'refresh', 'one', 'two', 'x', 'xr', 'fe', 'optical',
  'oled', 'qhd', 'uhd', 'hdr', 'rgb', 'usb', 'type', 'c', 'ips', 'led',
]);

/** Chuẩn hoá: bỏ dấu, lowercase, gộp khoảng trắng. */
function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Chuẩn hoá tên model.
 *
 * Dùng chung `lib/model-name.ts` để chuẩn hoá giống hệt script seed và
 * script apply — tránh tình trạng 3 nơi tạo ra 3 tên model khác nhau.
 */
function modelName(name: string): string {
  return normalizeModelName(name);
}

/** Token định danh của tên model. */
function keyTokens(name: string): string[] {
  return norm(name)
    .split(' ')
    .filter((t) => t.length > 0 && !STOPWORDS.has(t));
}

/**
 * Token này là MÃ MODEL (phần chữ+số định danh) hay không?
 *
 * VD: g16, s24, fold6, m3, 14900K, 3s, 16, 4090 -> MÃ MODEL.
 *     pro, ultra, max -> KHÔNG phải (đã nằm trong STOPWORDS).
 *
 * Số đơn ("9", "16") cũng là mã model khi đứng cạnh một từ (ví dụ
 * "Phone 9", "iPhone 16") — đây chính là phần định danh sản phẩm.
 */
function isModelCode(t: string): boolean {
  if (/[a-z]+[0-9]/.test(t)) return true; // g16, s24, m3, 3s, fold6
  if (/^[0-9]{4,}[a-z]?$/.test(t)) return true; // 4090, 14900k
  if (/^[0-9]{1,2}$/.test(t)) return true; // 9, 16, 24 (kích thước/số thế hệ)
  return false;
}

/**
 * Hậu tố phân biệt phiên bản.
 *
 * "Samsung Galaxy S24" và "Samsung Galaxy S24 Ultra" là 2 model khác nhau.
 * Các hậu tố này là TỪ KHÓA trong tiêu đề ảnh.
 */
const DISTINCT_SUFFIX = new Set([
  'ultra', 'pro', 'max', 'plus', 'mini', 'lite', 'ti', 'fe', 'se',
  'air', 'xs', 'xr', 'super',
]);

/**
 * Bậc phân biệt thế hệ đi sau MÃ MODEL.
 *
 * Ví dụ: "RTX 4070 Ti SUPER" vs "RTX 4070 SUPER" — cùng mã "4070" nhưng
 * khác bậc ("ti" trước "super"). Nếu tiêu đề ảnh thiếu bậc mà tên model
 * có, ảnh đó KHÔNG đúng model (chỉ đúng "anh em cùng dòng").
 */
const TIER_AFTER_CODE = new Set([
  'ti', 'super', 'max', 'ultra', 'plus', 'pro', 's', 'xt',
]);

/**
 * Nhóm thương hiệu: các tên trong cùng nhóm là CÙNG một hãng (hoặc
 * hãng con), nên ảnh của nhóm này chấp nhận được cho nhau.
 *
 * VD: "Zowie" là thương hiệu con của "BenQ" -> ảnh "BENQ MONITOR" dùng
 * được cho sản phẩm Zowie.
 */
const BRAND_GROUPS: Record<string, string[]> = {
  logitech: ['logitech', 'logi'],
  asus: ['asus', 'rog', 'tuf', 'vivobook', 'zenbook', 'proart'],
  msi: ['msi', 'micro star'],
  lg: ['lg'],
  hp: ['hp', 'hewlett', 'omen', 'victus'],
  gigabyte: ['gigabyte', 'aorus'],
  zowie: ['zowie', 'benq'],
  nvidia: ['nvidia', 'geforce'],
  corsair: ['corsair'],
  razer: ['razer'],
  apple: ['apple', 'macbook', 'ipad', 'iphone', 'airpods'],
  samsung: ['samsung', 'galaxy', 'odyssey'],
  dell: ['dell', 'alienware', 'xps'],
  lenovo: ['lenovo', 'thinkpad', 'ideapad', 'legion'],
  acer: ['acer', 'predator', 'nitro'],
  steam: ['steam', 'valve'],
  ducky: ['ducky'],
  keychron: ['keychron'],
  steelseries: ['steelseries', 'steelseries arctis'],
  hyperx: ['hyperx', 'cloud'],
  benq: ['benq'],
};

/**
 * Tiêu đề ảnh có chứa tên hãng KHÁC (không phải hãng của sản phẩm) không?
 *
 * Ví dụ ảnh "2023 Gigabyte GeForce RTX 4070 Aero OC" cho sản phẩm
 * "NVIDIA GeForce RTX 4070 Ti SUPER" -> ảnh đúng dòng nhưng là của hãng
 * khác (Gigabyte) và là 4070 chứ không phải 4070 Ti SUPER.
 *
 * Mục đích: chặn ảnh "Wireless mouse logi.jpg" (Logitech) cho chuột
 * Corsair / Endgame Gear.
 */
function hasForeignBrand(title: string, brand: string): boolean {
  const t = norm(title);
  const own = new Set(
    brand
      .toLowerCase()
      .split(/[\s&]+/)
      .filter(Boolean)
      .map((p) => norm(p)),
  );

  // Nhóm thương hiệu được chấp nhận cho sản phẩm này.
  const ownGroups = new Set<string>();
  const ownTokens = new Set<string>(own);
  for (const [group, members] of Object.entries(BRAND_GROUPS)) {
    if (!members.some((m) => own.has(m))) continue;
    ownGroups.add(group);
    for (const m of members) ownTokens.add(m);
  }

  for (const [group, members] of Object.entries(BRAND_GROUPS)) {
    if (ownGroups.has(group)) continue;
    for (const m of members) {
      // So trên ranh giới từ để tránh "logi" khớp "logic".
      if (new RegExp(`(^|\\s)${m}(\\s|$)`).test(t)) return true;
    }
  }
  return false;
}

/**
 * Tên hãng (hoặc nhóm hãng con) có xuất hiện trong tiêu đề ảnh không.
 *
 * "Zowie XL2546X" -> ảnh "BENQ MONITOR.jpg" vẫn hợp lệ vì Zowie thuộc BenQ.
 */
function hasBrandToken(title: string, brand: string): boolean {
  const t = norm(title);
  const own = brand
    .toLowerCase()
    .split(/[\s&]+/)
    .filter(Boolean)
    .map((p) => norm(p));
  if (!own.length) return false;

  const tokens = new Set<string>(own);
  for (const [group, members] of Object.entries(BRAND_GROUPS)) {
    if (!members.some((m) => own.includes(m))) continue;
    for (const m of members) tokens.add(m);
  }

  for (const tk of tokens) {
    if (new RegExp(`(^|\\s)${tk}(\\s|$)`).test(t)) return true;
  }
  return false;
}


/**
 * Token kích thước inch trong tên ("16in", "27in") -> số.
 *
 * Tên model chuẩn hoá dùng dạng "16in", còn tên file ảnh trên Commons
 * dùng dạng "16-inch" -> sau khi norm() thành "16 inch" (2 token).
 * Cần hàm này để so khớp được 2 dạng.
 */
function inchOf(token: string): string | null {
  const m = token.match(/^(\d{1,2})in$/);
  return m ? m[1] : null;
}

/**
 * Trang/ảnh có khớp đúng model không?
 *
 * Nguyên tắc: ảnh phải chứng minh được là CÙNG DÒNG SẢN PHẨM.
 *
 *   1. Mã model của tên phải xuất hiện trong tiêu đề.
 *   2. Token thuộc TÊN DÒNG phải có trong tiêu đề.
 *   3. Tên hãng ("crucial", "corsair"...) có thể thiếu, NHƯNG chỉ khi tiêu đề
 *      đã khớp >= 2 token dòng sản phẩm. Nếu chỉ khớp mã model rời rạc
 *      ("T500" khớp "Honda T500") thì BẮT BUỘC phải có tên hãng — nếu không
 *      sẽ nhận nhầm ảnh của sản phẩm hoàn toàn khác.
 */
export function isMatch(title: string, name: string): boolean {
  const tSquish = norm(title).replace(/ /g, '');
  const tTokens = keyTokens(title);
  const tTokenSet = new Set(tTokens);
  const allNameTokens = keyTokens(name);

  // 1) Mã model của tên phải xuất hiện trong tiêu đề.
  //
  //    Mã gồm chữ (g16, s24, 3s, pa32ucg) -> so sánh trong chuỗi đã bỏ
  //    khoảng trắng. Mã CHỈ GỒM SỐ (16, 9) -> phải là TOKEN RIÊNG, nếu
  //    không sẽ khớp nhầm: "16" của "iPhone 16 Pro Max" khớp "DSCF1286"
  //    (ảnh iPhone 1 năm 2007) -> ảnh sai hoàn toàn.
  // Token inch ("16in") KHÔNG phải mã model định danh — tên file ảnh
  // trên Commons dùng dạng "16-inch". Loại token này ra khỏi
  // khớp token, nương chỉ dùng để so kích thước ổ 1d.
  const nTokens = allNameTokens.filter((t) => !inchOf(t));
  const codes = nTokens.filter(isModelCode);
  for (const c of codes) {
    if (/^[0-9]+$/.test(c)) {
      if (!tTokenSet.has(c)) return false;
    } else if (!tSquish.includes(c)) {
      return false;
    }
  }

  // 1b) Mọi hậu tố phân biệt có trong tiêu đề phải có trong tên.
  //     "Samsung Galaxy S24" KHÔNG được nhận ảnh "Samsung Galaxy S24 Ultra".
  //     Ngược lại ("iPhone 16 Pro Max" <- "IPhone 16 Rear") vẫn OK vì ảnh
  //     là của model gốc, chỉ thiếu hậu tố.
  //
  //     ⚠️ Phải lấy token từ norm() CHƯA bỏ stopword — vì "plus", "pro",
  //     "max", "ultra" đều nằm trong STOPWORDS và sẽ bị keyTokens() xoá
  //     mất, khiến quy tắc này chết và "iPhone 16" nhận nhầm ảnh
  //     "iPhone 16 Plus".
  const rawTokensOf = (s: string): string[] => norm(s).split(' ').filter(Boolean);
  const titleSuffixes = rawTokensOf(title).filter((t) => DISTINCT_SUFFIX.has(t));
  if (titleSuffixes.length) {
    const nameSuffixes = new Set(rawTokensOf(name).filter((t) => DISTINCT_SUFFIX.has(t)));
    for (const s of titleSuffixes) {
      if (!nameSuffixes.has(s)) return false;
    }
  }
  // 1c) KÍCH THƯỚC MÀN HÌNH phải khớp nếu cả hai đều có.
  //     "MacBook Pro 14\" M4 Pro" KHÔNG được nhận ảnh "MacBook Pro 16-inch"
  //     — cùng chip nhưng là model khác nhau.
  const sizeOf = (s: string): string | null => {
    const m = norm(s).match(/\b(\d{1,2})\s*(?:in\b|inch)/);
    return m ? m[1] : null;
  };
  const tSize = sizeOf(title);
  const nSize = sizeOf(name);
  if (tSize && nSize && tSize !== nSize) return false;

  // 1c2) BẬC PHÂN BIỆT sau mã model phải khớp.
  //      "RTX 4070 Ti SUPER" KHÔNG được nhận ảnh "RTX 4070" hay
  //      "RTX 4070 SUPER" — khác bậc là khác model.
  {
    const tRaw = rawTokensOf(title);
    const nRaw = rawTokensOf(name);
    const tierAfter = (tokens: string[]): string | null => {
      for (let i = 0; i < tokens.length; i++) {
        if (!/^\d{3,4}$/.test(tokens[i])) continue;
        for (let j = i + 1; j < tokens.length; j++) {
          if (TIER_AFTER_CODE.has(tokens[j])) return tokens[j];
          // Chỉ xét bậc ngay sau mã (bỏ qua token trung gian).
          if (/^\d+$/.test(tokens[j])) continue;
          break;
        }
      }
      return null;
    };
    const tTier = tierAfter(tRaw);
    const nTier = tierAfter(nRaw);
    if (nTier && tTier !== nTier) return false;
  }

  // 1d) Token inch trong tên model chuản hoá ("16in") phải khớp với
  //     kích thước trong tiêu đề ảnh (nếu ảnh có).
  for (const tk of nTokens) {
    const inch = inchOf(tk);
    if (!inch) continue;
    if (tSize && tSize !== inch) return false;
  }

  // 2) Token THUỘC TÊN DÒNG phải có mặt trong tiêu đề.
  //    Đếm số token khớp để quyết định có được phép bỏ qua tên hãng hay không.
  let lineHits = 0;
  for (const tk of nTokens) {
    // Token 1 KÝ TỰ là hậu tố phiên bản ("MX Keys S", "G Pro X"). Ảnh trên
    // Commons thường KHÔNG ghi hậu tố này ("Logitech MX Keys YR0073.jpg"),
    // nên không được loại ứng viên chỉ vì thiếu nó.
    if (tk.length === 1) continue;
    if (isModelCode(tk)) {
      lineHits++;
      continue;
    }
    if (tTokenSet.has(tk)) {
      lineHits++;
      continue;
    }
    // Cho phép tiêu đề có token dài hơn ("proart" vs "pro").
    if (tTokens.some((tt) => tt.startsWith(tk) && tk.length >= 3)) {
      lineHits++;
      continue;
    }
    // Token không khớp và KHÔNG phải tên hãng -> loại ứng viên.
    if (!isBrandToken(tk)) return false;
  }

  // 3) Đánh giá độ tin cậy:
  //
  //    - Tên KHÔNG có token hãng ("iPhone 16 Pro Max") -> cần >= 2 token dòng
  //      khớp (ví dụ "iphone" + "16").
  //    - Tên CÓ token hãng ("SteelSeries Apex 3 Wireless"):
  //        * Hãng có trong tiêu đề -> >= 2 token khớp là đủ.
  //        * Hãng KHÔNG có trong tiêu đề -> cần >= 3 token khớp.
  //
  //    Ngưỡng 3 chặn được các cặp sai như:
  //      "SteelSeries Apex 3 Wireless" vs "Janus in Overwatch APEX Season 3"
  //      "Crucial T500"  vs "Honda T500"
  //      "Corsair K70"  vs "Pentax K-70"
  //      "Corsair HS60" vs "Taj Mahal HS-60"
  //    Trong khi vẫn chấp nhận ảnh đúng:
  //      "Galaxy Tab S10+ Back.jpg" vs "Samsung Galaxy Tab S10+"  (3 token)
  //      "IPhone 16 Pro Max Desert Titanium Rear.png" vs "iPhone 16 Pro Max"
  const brandTokens = nTokens.filter(isBrandToken);
  if (brandTokens.length) {
    const brandPresent = brandTokens.every((b) =>
      tTokenSet.has(b) || tTokens.some((tt) => tt.startsWith(b) && b.length >= 3),
    );
    const need = brandPresent ? 2 : 3;
    if (lineHits < need) return false;
  } else if (lineHits < 2) {
    return false;
  }
  return true;
}

/** Token tên hãng (có thể bị thiếu trong tiêu đề ảnh). */
const BRAND_TOKENS = new Set([
  'apple', 'samsung', 'asus', 'msi', 'logitech', 'razer', 'corsair',
  'dell', 'hp', 'lenovo', 'acer', 'xiaomi', 'oppo', 'vivo', 'google',
  'realme', 'nokia', 'oneplus', 'honor', 'tecno', 'gigabyte', 'microsoft',
  'huawei', 'lg', 'benq', 'viewsonic', 'aoc', 'philips', 'steelseries',
  'hyperx', 'roccat', 'jbl', 'bose', 'elgato', 'nvidia', 'amd', 'intel',
  'seagate', 'kingston', 'crucial', 'toshiba', 'wacom', 'endgame',
  'custom', 'deepcool', 'cooler', 'master', 'gskill', 'western', 'digital',
]);

function isBrandToken(t: string): boolean {
  return BRAND_TOKENS.has(t);
}

/**
 * Ảnh này có chứa NHIỀU sản phẩm khác nhau không?
 *
 * "Apple MacBook Pro 16\" M2 Max and iPhone 13 Pro.jpg" là ảnh so sánh 2 sản
 * phẩm -> dùng làm ảnh đại diện cho "iPhone 16 Pro Max" sẽ SAI (thấy cả
 * laptop, và iPhone trong ảnh là iPhone 13 Pro).
 */
function isMultiProductPhoto(title: string): boolean {
  // Dùng chuỗi THÔ (chưa chuẩn hoá) vì dấu "&" bị norm() xoá mất.
  const raw = title.toLowerCase();
  const t = norm(title);
  // Cụm nối nhiều sản phẩm.
  const connectors = [' and ', ' with ', ' vs ', ' versus ', ' & ', ' + '];
  const PRODUCT_WORDS =
    /(iphone|ipad|macbook|galaxy|pixel|watch|airpods|laptop|monitor|keyboard|mouse|headset|buds|earbuds|earphone|tablet|smartphone|phone|camera|tv|console|playstation|xbox|nintendo|router|printer|projector)/;
  for (const c of connectors) {
    const idx = raw.indexOf(c);
    if (idx < 0) continue;
    // Mỗi bên phải phải chứa một từ định danh sản phẩm thì mới coi là
    // ảnh đa sản phẩm (" and " trong "candy and gadgets" không phải).
    const right = t.slice(idx + c.length);
    if (PRODUCT_WORDS.test(right)) {
      return true;
    }
  }
  return false;
}

/**
 * Mã model LẠ trong tiêu đề ảnh — dùng để loại ảnh của model KHÁC.
 *
 * VD: model "Poco F6 Pro", ảnh "Xiaomi Mi A3 phone.png" -> "a3" là mã
 * của model KHÁC -> ảnh đó SAI cho model hiện tại (điện thoại nhưng là
 * chiếc Xiaomi Mi A3, không phải Poco F6).
 *
 * Chỉ xét token dạng MÃ SẢN PHẨM:
 *   g915, x50, a3, m4, s26   (chữ ngắn + số)
 *   pa32ucg, m3, 3s         (chữ + số + chữ)
 * Bỏ qua: mã linh kiện/số ký hiệu của Commons (YR0073, PNr°0325),
 * tên file máy ảnh (DSCF1234), năm (2018), số thuần.
 */
const NON_MODEL_CODE_PREFIX =
  /^(yr|pn|pnr|sku|art|part|ref|cat|cp|dc|ac|mc|uc|ec|it|no|img|dsc|dscf|px|ph|ex|hs|ss|cm|wm|res|z|hd|sd|pj|eis|dei|sm|so|mk|ii|iii|iv|v|app|clip)[0-9]/;

function conflictingModelCode(title: string, name: string): boolean {
  const nameTokens = new Set(keyTokens(name));
  for (const tk of keyTokens(title)) {
    if (nameTokens.has(tk)) continue;
    if (NON_MODEL_CODE_PREFIX.test(tk)) continue;
    // Mã dạng chữ ngắn + số: g915, x50, a3, m4, s26.
    if (/^[a-z]{1,2}[0-9]{1,4}$/.test(tk)) return true;
    // Mã dạng chữ + số + chữ: pa32ucg, m3, 3s.
    if (/^[a-z]{1,3}[0-9]{1,3}[a-z]{1,3}$/.test(tk)) return true;
  }
  return false;
}

/**
 * Ảnh Commons này có phải ảnh sản phẩm không.
 *
 * LƯU Ý: KHÔNG bắt buộc tên hãng phải xuất hiện trong tiêu đề — nhiều ảnh
 * sản phẩm thật trên Commons không ghi tên hãng ("Razer Arctosa keyboard-top"
 * có hãng, nhưng "Arctosa" thì không). Việc khớp đúng model đã do
 * `isMatch` đảm bảo qua MÃ MODEL (G16, S24, 3S, MX...).
 *
 * @param model tên model đích (nếu có) — dùng để loại ảnh của model KHÁC.
 */
export function isProductPhoto(
  title: string,
  brand: string,
  model?: string,
): boolean {
  // PHẢI chuẩn hoá trước: tên file Commons dùng "_" và ký tự đặc biệt
  // ("Dell_laptop_hard_disk.jpg" khác "hard disk"). So trực tiếp chuỗi thô
  // sẽ bỏ sót các từ cấm.
  const t = norm(title);
  // Từ khoá CHỮ QUỐC GIA KHÁC phải so trên chuỗi THÔ — norm() xoá mất
  // mọi ký tự ngoài a-z0-9 nên "机型价格" sẽ biến mất.
  const rawLower = title.toLowerCase();
  const bad = [
    'logo', 'wordmark', 'banner', 'poster', 'icon', 'flag', 'map',
    'diagram', 'chart', 'screenshot', 'graph', 'seal', 'stamp', 'coin',
    'sign', 'symbol', 'headquarters', 'store', 'office', 'box',
    'package', 'retail', 'unboxing', 'comparison', 'review', 'vector',
    // Trang "List of ..." là bảng liệt kê, KHÔNG phải ảnh sản phẩm.
    'list of', 'comparison of', 'timeline', 'specification',
    // ảnh BẢNG GIÁ / SLIDE so sánh — KHÔNG phải ảnh sản phẩm.
    // VD "IPhone 15 机型价格 & 性能数据对比图.png".
    // (từ khoá tiếng Trung so trên chuỗi THÔ vì norm() xoá mất).
    'price', 'specs', 'spec sheet', 'table of', 'infographic',
    // ảnh CHỮ độ / tách để không phải sản phẩm.
    'warranty', 'manual', 'user guide', 'receipt', 'invoice', 'boit',
    // ảNH Kỹ THUậT / NộI BỘ — không phải ảnh đại diện sản phẩm.
    'hard disk', 'harddisk', 'teardown', 'disassembled', 'exploded',
    'schematic', 'circuit board', 'main board', 'mainboard', 'carte',
    'motherboard', 'logic board', 'serial tag', 'label',
    // ảNH CủA HÃNG KHÁC (chưa game khác) — không phải SP của hãng ta.
    'ps4', 'ps5', 'playstation', 'xbox', 'nintendo', 'steam machine',
    // ảNH THIẾT BỀ VR / head mounted display — không phải tai nghe gaming.
    'oculus', 'rift cv1', 'valve index', 'htc vive', 'ps vr',
    // ảnh CừA / đổ GỞAI đếc trong tên file.
    'bad omen', 'zenscreen', 'with computer set', 'computer set',
    // ảnh đượng dẫn / hướng dẫn (tiếnng đệ).
    'guide', 'poster of', 'advertisement', 'ad for', 'promotion',
    // ảnh CHI TIẾT bộ phận (không phải ảnh đại diện sản phẩm):
    //   "Dell Laptop-Keyboard.jpg", "Logitech-apple-keyboard_(...)",
    //   "Asus ROG Laptop Keyboard.jpg", "Green mechanical switch Razer keyboard".
    'laptop keyboard', 'laptop-keyboard', 'keyboard close', 'keyboard top',
    'apple-keyboard', 'mechanical switch', 'switch razer', 'keycap',
    // ảnh SỰ KIỆN / có NGƯỜI trong khung hình -> không phải ảnh SP.
    'talking at', 'talking,', 'on the stage', 'at the booth', 'booth',
    'at aorus', 'at computex', 'at ksp', 'playing sonic', 'with jkr',
    'talking with', 'interview', 'handshake', 'in hands on',
    // ảnh SẢN PHẨM HỎNG / KHÔNG HOÀN CHỈNH.
    'broken screen', 'broken', 'damaged', 'cracked', 'defect',
    // ảnh máy tính/đồ cũ, không phải sản phẩm hiện đại.
    'aptiva', 'impressora', 'epson stylus', 'ibm 486', '486 com',
    'crt monitor', 'floppy', 'vintage computer',
    // ảnh BÀN PHÍM/MÁY TÍNH dùng chung (setup) — không phải ảnh SP.
    'computer set', 'setup', 'workstation on', 'on the desk', 'desk setup',
    'keyboard-', 'laptop on a stand', 'museum',
    // ảnh SỰ KIỆN NHƯNG KHÔNG CÓ TỪ "booth"/"stage" (VD ảnh người tại
    // sân khấu Aorus, ảnh dầu sập trên biển cho "M3").
    'oil spill', 'deepwater', 'horizon',
    // ảnh CHI TIẾT LINH KIỆN / bối cảnh — không phải ảnh đại diện SP.
    'open case', 'battery', 'at platform', 'train station', 'in the wild',
    'interior', 'chassis', 'cooling fan', 'power supply', 'cable close',
  ];
  // Từ khoá tiếng Trung / ký tự đặc biệt — so trên chuỗi THÔ.
  const rawBad = ['机型价格', '性能数据', '对比图', '参数对比', '配置'];
  for (const b of bad) if (t.includes(b)) return false;
  for (const b of rawBad) if (rawLower.includes(b)) return false;
  // Ảnh của model KHÁC (có mã model lạ) -> không dùng cho model hiện tại.
  if (model && conflictingModelCode(title, model)) return false;
  // Ảnh so sánh nhiều sản phẩm -> không dùng làm ảnh đại diện.
  if (isMultiProductPhoto(title)) return false;
  // Ảnh của hãng KHÁC -> không dùng (VD ảnh Logitech cho chuột Corsair).
  if (brand && hasForeignBrand(title, brand)) return false;
  return true;
}

/**
 * Tiêu đề trang Wikipedia này là trang SẢN PHẨM cụ thể hay trang tổng hợp?
 *
 * "List of AMD Ryzen processors", "List of Apple products" là trang liệt kê
 * -> ảnh của chúng không phải ảnh sản phẩm cụ thể.
 */
function isProductPage(title: string): boolean {
  const t = title.toLowerCase();
  const bad = [
    'list of', 'comparison of', 'timeline', 'index of', 'outline of',
    'history of', 'category:', 'template:', 'portal:',
  ];
  for (const b of bad) if (t.includes(b)) return false;
  return true;
}

/** Bỏ mã kỹ thuật phía sau: "G614JIR", "PHN16-72", "17Z90S-G.AA85N". */
function stripTechCode(base: string): string {
  return base
    .replace(/\s+[A-Z]{1,6}[-]?\d{2,}[A-Z0-9./-]*\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Các biến thể tên để dò (giảm dần độ khớp). */
function variants(name: string): string[] {
  const base = modelName(name);
  const out = [base];
  const noCode = stripTechCode(base);
  if (noCode && noCode !== base) out.push(noCode);
  // Bố kích thước inch: "MacBook Pro 14in M4 Pro" ->
  // "MacBook Pro M4 Pro" (Wikipedia/Commons hay dùng tên không kích thước).
  const noInch = base.replace(/\s*\d{1,2}(?:\.\d+)?in\b/g, '').trim();
  if (noInch && noInch !== base) out.push(noInch);
  // Bố kích thước inch + mã kỹ thuật.
  const bare = noInch.replace(/\s+[A-Z]{1,8}-?\d{2,}[A-Z0-9./-]*\b/g, '').trim();
  if (bare && bare !== base && bare !== noInch) out.push(bare);
  return [...new Set(out.filter(Boolean))];
}

/** Cụm tìm kiếm Commons: thử tên đầy đủ trước, rồi rút ngắn dần. */
function commonsQueries(name: string, brand: string): string[] {
  const base = modelName(name);
  const tokens = base.split(' ').filter(Boolean);
  const brandFirst = brand.split(' ')[0].toLowerCase();
  const rest = tokens[0]?.toLowerCase() === brandFirst ? tokens.slice(1) : [...tokens];
  const out: string[] = [base];

  // Tên bỏ hãng: "ASUS ROG Harpe Ace" -> "ROG Harpe Ace".
  if (rest.length && rest.join(' ') !== base) out.push(rest.join(' '));

  // Cụm rút ngắn: bỏ dần từ cuối, giữ ít nhất 2 token.
  for (let len = rest.length - 1; len >= 2; len--) {
    const q = rest.slice(0, len).join(' ');
    if (q && !out.includes(q)) out.push(q);
  }

  // Biến thữ kích thước dạng "N-inch" (cách Commons hay dùng).
  const hyphen = base.replace(/(\d{1,2}(?:\.\d+)?)in\b/g, '$1-inch');
  if (hyphen && hyphen !== base) out.push(hyphen);

  // Cụm có MÃ MODEL: "Harpe Ace", "DeathAdder V3", "MX Master 3S".
  // Đây là truy vấn chính xác nhất vì mã model là định danh duy nhất.
  const codes = keyTokens(base).filter(isModelCode);
  if (codes.length) {
    // Ghép mã model với token ngữ nghĩa ngay trước nó.
    const idx = tokens.findIndex((t) => isModelCode(norm(t)));
    if (idx > 0) {
      const withPrev = tokens.slice(Math.max(0, idx - 1), idx + 1).join(' ');
      if (withPrev && !out.includes(withPrev)) out.push(withPrev);
    }
    if (codes.length === 1 && !out.includes(codes[0])) out.push(codes[0]);
  }

  // Cụm ngắn nhất: 2 token cuối.
  if (rest.length >= 2) {
    const last2 = rest.slice(-2).join(' ');
    if (last2 && !out.includes(last2)) out.push(last2);
  }
  return [...new Set(out.filter(Boolean))];
}

/** Ngủ giữa các request (tránh bị Wikimedia chặn 429). */
const wait = (ms: number) => new Promise((s) => setTimeout(s, ms));

async function getJson(url: string, attempt = 3): Promise<any> {
  for (let a = 0; a < attempt; a++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA } });
      if (r.status === 429) {
        await wait(2500 * (a + 1));
        continue;
      }
      if (!r.ok) return null;
      return await r.json();
    } catch {
      await wait(900);
    }
  }
  return null;
}

/**
 * NHIỀU ảnh của một trang Wikipedia (media-list REST API).
 * Đây là nguồn ảnh đa dạng nhất cho các dòng có trang Wikipedia riêng.
 */
async function mediaListImages(
  title: string,
  name: string,
): Promise<Array<{ url: string; title: string }>> {
  const d = await getJson(
    `https://en.wikipedia.org/api/rest_v1/page/media-list/${encodeURIComponent(title)}`,
  );
  const items = d?.items ?? [];
  const out: Array<{ url: string; title: string }> = [];

  // Trang liệt kê ("List of Bose headphones") -> ảnh không phải ảnh SP cụ thể.
  if (!isProductPage(title)) return out;

  for (const it of items) {
    if (it?.type !== 'image') continue;
    const srcset = it?.srcset ?? [];
    const pick =
      srcset.find((s: any) => s.scale === 2) ??
      srcset.find((s: any) => s.scale === 1) ??
      srcset[0];
    if (!pick?.src) continue;
    const url = String(pick.src).startsWith('//')
      ? `https:${pick.src}`
      : String(pick.src);
    const fileTitle = String(it.title ?? '');
    // Bỏ ảnh vector/logo/screenshot — chỉ giữ ảnh chụp thực tế.
    if (/vector|logo|icon|diagram|chart|screenshot|graph|\.svg$/i.test(fileTitle)) {
      continue;
    }
    if (!isMatch(fileTitle, name)) continue;
    out.push({ url, title: fileTitle });
  }
  return out;
}
/** Ảnh đại diện của 1 trang Wikipedia (pageimages). */
async function wikiThumb(
  title: string,
  name: string,
): Promise<{ url: string; title: string } | null> {
  const d = await getJson(
    `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages` +
      `&piprop=thumbnail&pithumbsize=900&redirects=1&titles=${encodeURIComponent(title)}`,
  );
  for (const p of Object.values<any>(d?.query?.pages ?? {})) {
    const src = p?.thumbnail?.source;
    if (!src) continue;
    const pageTitle = String(p.title ?? '');
    if (!isMatch(pageTitle, name)) continue;
    // Trang tổng hợp ("List of AMD Ryzen processors") không phải ảnh SP.
    if (!isProductPage(pageTitle)) continue;
    return { url: String(src), title: pageTitle };
  }
  return null;
}

/** Tìm ứng viên trang Wikipedia theo từ khóa. */
async function wikiSearchTitles(query: string): Promise<string[]> {
  const d = await getJson(
    `https://en.wikipedia.org/w/api.php?action=query&format=json&list=search` +
      `&srsearch=${encodeURIComponent(query)}&srlimit=6`,
  );
  return (d?.query?.search ?? [])
    .map((x: any) => String(x.title ?? ''))
    .filter((t: string) => isProductPage(t));
}

/** Tìm ảnh trên Wikimedia Commons. */
async function commonsSearch(
  query: string,
  brand: string,
  name: string,
): Promise<Array<{ title: string; url: string }>> {
  const d = await getJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
      `&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(query)}` +
      `&gsrlimit=20&prop=imageinfo&iiprop=url|mime&iiurlwidth=900`,
  );
  const out: Array<{ title: string; url: string }> = [];
  for (const p of Object.values<any>(d?.query?.pages ?? {})) {
    const ii = (p.imageinfo ?? [])[0];
    if (!ii) continue;
    if (ii.mime && !/^image\/(jpeg|png|webp)$/.test(ii.mime)) continue;
    const url: string = ii.thumburl ?? ii.url;
    if (!url) continue;
    const t = String(p.title ?? '');
    if (!isProductPhoto(t, brand)) continue;
    if (!isMatch(t, name)) continue;
    out.push({ title: t, url });
  }
  return out;
}

/**
 * Các truy vấn `intitle:` — tìm file Commons có MÃ MODEL trong TIÊU ĐỀ.
 *
 * VD model "Logitech G502 Hero" -> intitle:"G502 Hero", intitle:"G502",
 *     intitle:"Logitech G502".
 *
 * Đây là cách hiệu quả nhất để tìm ảnh của model niche không có trang
 * Wikipedia riêng (G502 Hero, G502 X Plus, ...).
 */
/**
 * Mã model ĐỦ MẠNH để dùng làm `intitle:`.
 *
 * Mã yếu (chỉ 2 ký tự: "m3", "m4", "24") sẽ khớp nhầm hàng loạt ảnh
 * không liên quan ("Air Scoop - 2015 BMW M3", "May 24, 2010"). Chỉ giữ mã
 * có ÍT NHẤT 3 ký tự:
 *   - chữ + số (g502, xl2566k, s26, m3pro) -> định danh dòng sản phẩm
 *   - số >= 3 chữ số (7800, 4090)          -> định danh mã sản phẩm
 */
function strongModelCodes(model: string): string[] {
  return keyTokens(model).filter((t) => {
    if (t.length < 3) return false;
    if (/^[a-z]{1,3}[0-9]{1,4}[a-z]?$/.test(t)) return true; // g502, s26, m3pro
    if (/^[0-9]{3,}[a-z]?$/.test(t)) return true; // 7800, 4090
    return false;
  });
}

function intitleQueries(model: string): string[] {
  const base = modelName(model);
  const tokens = base.split(' ').filter(Boolean);
  const codes = strongModelCodes(base);

  const out: string[] = [];

  // 1) Mã model + token ngữ nghĩa ngay trước ("G502 Hero", "Odyssey G8").
  for (const code of codes.slice(0, 3)) {
    const ci = tokens.findIndex((t) => norm(t) === code);
    if (ci > 0) {
      out.push(`${tokens[ci - 1]} ${code}`);
      if (ci > 1) out.push(`${tokens[ci - 2]} ${tokens[ci - 1]} ${code}`);
    }
    // Mã model dạng gộp ("PA32UCG" -> "PA32UCG", "g502" -> "G502").
    out.push(code.toUpperCase());
    // Dạng có khoảng trắng: "G 502", "XL 2566 K".
    const spaced = code.replace(/^([a-z]+)(\d+)$/i, '$1 $2');
    if (spaced !== code) out.push(spaced.toUpperCase());
  }

  // 2) Chuỗi mã model liên tiếp trong tên ("G915TKL").
  const squished = base.replace(/\s+/g, '');
  if (squished.length >= 5) out.push(squished);

  return [...new Set(out.filter((q) => q && q.length >= 3))].slice(0, 6);
}

/**
 * Tiêu đề ảnh có hợp lệ với lớp `intitle:` không.
 *
 * Điều kiện (TẤT CẢ phải đúng):
 *   1. Ảnh sản phẩm hợp lệ (không phải bảng giá / ảnh sự kiện / ảnh hỏng).
 *   2. Tiêu đề chứa MÃ MODEL MẠNH của sản phẩm.
 *   3. Tiêu đề có BẰNG CHỨNG thuộc đúng sản phẩm: tên hãng HOẶC token
 *      ngữ nghĩa / hậu tố phân biệt của tên model.
 *      -> loại "Taj Mahal, Agra, Uttar Pradesh s-60.jpg" (trùng mã "s60"
 *         của Corsair HS60 nhưng là ảnh di tích).
 *      -> loại "Board of G915 (2021...).jpg" (trùng mã "g915" nhưng là
 *         ảnh bảng thông báo).
 *   4. Tiêu đề KHÔNG chứa mã model của sản phẩm khác.
 */
export function isIntitleMatch(
  title: string,
  brand: string,
  model: string,
): boolean {
  if (!isProductPhoto(title, brand, model)) return false;

  const codes = strongModelCodes(model);
  if (!codes.length) return false;

  // 2) Tiêu đề chứa MÃ MODEL MẠNH.
  const tSquish = norm(title).replace(/ /g, '');
  const hit = codes.some((c) => tSquish.includes(c.replace(/\s+/g, '')));
  if (!hit) return false;

  // 3) Bằng chứng thuộc đúng sản phẩm.
  // Dùng token THÔ của tiêu đề (không bỏ stopword) vì Commons ghi rõ
  // các hậu tố như "PLUS", "PRO", "MAX" trong tên file.
  const tTokens = new Set(norm(title).split(' ').filter(Boolean));
  // Token NGỮ NGHĨA: lấy từ toàn bộ token của tên (kể cả stopword
  // như "plus", "tkl") vì Commons thường ghi đủ các hậu tố này.
  const rawNameTokens = norm(model).split(' ').filter(Boolean);
  const contextTokens = rawNameTokens.filter(
    (tk) =>
      !isModelCode(tk) &&
      !isBrandToken(tk) &&
      !STOPWORDS.has(tk) &&
      tk.length >= 3,
  );
  const extraContext = rawNameTokens.filter(
    (tk) =>
      tk.length >= 3 &&
      STOPWORDS.has(tk) &&
      // chỉ giữ hậu tố phân biệt (plus/pro/max...) vì chúng xuất hiện
      // trong tên file ảnh và giúp định danh đúng model.
      DISTINCT_SUFFIX.has(tk),
  );
  const brandOk = hasBrandToken(title, brand);
  const contextOk = [...contextTokens, ...extraContext].some(
    (tk) =>
      tTokens.has(tk) ||
      [...tTokens].some((tt) => tt.startsWith(tk) && tk.length >= 4),
  );
  if (!brandOk && !contextOk) return false;

  // 4) Không mang mã model của sản phẩm khác.
  if (conflictingModelCode(title, model)) return false;

  // 5) Bậc phân biệt sau mã model phải khớp.
  //    "RTX 4070 Ti SUPER" không được nhận ảnh "RTX 4070 Aero OC".
  {
    const raw = (s: string): string[] => norm(s).split(' ').filter(Boolean);
    const tierAfter = (tokens: string[]): string | null => {
      for (let i = 0; i < tokens.length; i++) {
        if (!/^\d{3,4}$/.test(tokens[i])) continue;
        for (let j = i + 1; j < tokens.length; j++) {
          if (TIER_AFTER_CODE.has(tokens[j])) return tokens[j];
          if (/^\d+$/.test(tokens[j])) continue;
          break;
        }
      }
      return null;
    };
    const tTier = tierAfter(raw(title));
    const nTier = tierAfter(raw(model));
    if (nTier && tTier !== nTier) return false;
  }

  return true;
}

/**
 * Tìm ảnh Commons bằng `intitle:` — CHẤP NHẬN mọi ảnh có mã model trùng
 * trong tiêu đề, kể cả khi khác chữ hoa/thứ tự.
 *
 * Vì sao tách riêng: `isMatch` quá chặt với tên file kiểu
 * "2026 G502 X PLUS (side view).jpg" (năm ở đầu, nhiều ngoặc phụ).
 */
async function commonsIntitleImages(
  model: string,
  brand: string,
): Promise<Array<{ title: string; url: string }>> {
  const out: Array<{ title: string; url: string }> = [];
  const seen = new Set<string>();

  const codes = strongModelCodes(model);
  if (!codes.length) return out;

  for (const q of intitleQueries(model)) {
    if (out.length >= 6) break;
    const d = await getJson(
      `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
        `&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(
          `intitle:${q}`,
        )}` +
        `&gsrlimit=20&prop=imageinfo&iiprop=url|mime&iiurlwidth=900`,
    );
    for (const p of Object.values<any>(d?.query?.pages ?? {})) {
      if (out.length >= 6) break;
      const ii = (p.imageinfo ?? [])[0];
      if (!ii) continue;
      if (ii.mime && !/^image\/(jpeg|png|webp)$/.test(ii.mime)) continue;
      const url: string = ii.thumburl ?? ii.url;
      if (!url || seen.has(url)) continue;
      const t = String(p.title ?? '');
      if (!isIntitleMatch(t, brand, model)) continue;
      seen.add(url);
      out.push({ title: t, url });
    }
  }
  return out;
}

/**
 * Tìm ảnh trên Wikimedia Commons bằng MÃ MODEL chính xác.
 *
 * Đây là cách hiệu quả nhất: Commons index tên file, nên "MX Master 3S"
 * trả về đúng "Logitech MX Master 3S HS01.jpg", "HS02.jpg"... — mỗi file
 * là một góc chụp khác nhau của CÙNG model -> nhiều ảnh đa dạng.
 */
async function commonsByModelCode(
  model: string,
  brand: string,
): Promise<Array<{ title: string; url: string }>> {
  const codes = keyTokens(model).filter(isModelCode);

  // Token gốc (giữ nguyên hoa/thường) để ghép cụm truy vấn.
  const tokens = modelName(model).split(' ').filter(Boolean);

  const out: Array<{ title: string; url: string }> = [];
  const seen = new Set<string>();

  /**
   * Chạy 1 truy vấn Commons và lấy các ảnh khớp model.
   */
  const runQuery = async (q: string): Promise<void> => {
    if (!q || out.length >= 8) return;
    const d = await getJson(
      `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
        `&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(q)}` +
        `&gsrlimit=20&prop=imageinfo&iiprop=url|mime&iiurlwidth=900`,
    );
    for (const p of Object.values<any>(d?.query?.pages ?? {})) {
      const ii = (p.imageinfo ?? [])[0];
      if (!ii) continue;
      if (ii.mime && !/^image\/(jpeg|png|webp)$/.test(ii.mime)) continue;
      const url: string = ii.thumburl ?? ii.url;
      if (!url || seen.has(url)) continue;
      const t = String(p.title ?? '');
      if (!isProductPhoto(t, brand)) continue;
      if (!isMatch(t, model)) continue;
      seen.add(url);
      out.push({ title: t, url });
    }
  };

  // 1) TÊN ĐẦY ĐỦ — truy vấn này cho kết quả tốt nhất vì Commons index
  //    theo cụm tên file. VD: "Samsung Galaxy S24 Ultra" -> "SAMSUNG Galaxy
  //    S24 Ultra (5).jpg" (nhiều góc chụp của cùng model).
  await runQuery(model);
  if (out.length >= 4) return out;

  // 1a) TÌM THEO TIÊU ĐỀ FILE (intitle:) — chính xác nhất vì Commons
  //     index tên file, không index nội dung mô tả.
  //     VD: "G502 Hero" -> "File:G502 Hero.jpg",
  //         "G502 X Plus" -> "File:2026 G502 X PLUS (side view).jpg".
  //     Đây là lớp giúp tìm được ảnh của model KHÔNG có trang Wikipedia.
  for (const q of intitleQueries(model)) {
    await runQuery(q);
    if (out.length >= 4) return out;
  }

  // 1b) TÊN GIỮ KÍCH THƯỚC — "MacBook Pro 16 M4 Pro" -> "MacBook Pro
  //     16-inch M4 Pro" (đúng cách Commons đặt tên file ảnh).
  const sized = modelNameWithSize(model);
  if (sized && sized !== model) {
    await runQuery(sized);
    if (out.length >= 4) return out;
  }

  // 1c) DạNG "Nin" -> "N-inch" — Commons hay dùng "27-inch", "32-inch"
  //     trong tên file, còng tên model chuản hoá là "27in".
  const hyphenInch = model.replace(/(\d{1,2}(?:\.\d+)?)in\b/g, '$1-inch');
  if (hyphenInch !== model) {
    await runQuery(hyphenInch);
    if (out.length >= 4) return out;
  }

  // 1d) Tên Bỏ kích thước — "AOC AGON PRO AG274QZM 27in"
  //     -> "AOC AGON PRO AG274QZM". Commons index theo MÃ MODEL nên tên
  //     có kích thước vào không tìm ra ảnh.
  const noInch = model.replace(/\s*\d{1,2}(?:\.\d+)?in\b/g, '').trim();
  if (noInch && noInch !== model) {
    await runQuery(noInch);
    if (out.length >= 4) return out;
  }

  // 2) Tên bỏ hãng: "Samsung Galaxy S24 Ultra" -> "Galaxy S24 Ultra".
  const brandFirst = brand.split(' ')[0].toLowerCase();
  const rest =
    tokens[0]?.toLowerCase() === brandFirst ? tokens.slice(1) : tokens;
  if (rest.length && rest.join(' ') !== model) {
    await runQuery(rest.join(' '));
  }
  if (out.length >= 4) return out;

  // 3) Truy vấn theo MÃ MODEL.
  for (const code of codes.slice(0, 2)) {
    // Dạng có và không có dấu gạch nối ("MX Master 3S", "PA32UCG").
    const queries = [code, code.replace(/([a-z])(\d)/i, '$1 $2')];

    // Ghép mã model với token trước nó: "Strix G16", "Galaxy S25",
    // "Master 3S" — Commons index theo cụm này mới ra ảnh đúng.
    const ci = tokens.findIndex((t) => norm(t) === code);
    if (ci > 0) {
      const pair = tokens[ci - 1] + ' ' + tokens[ci];
      queries.push(pair);
      if (ci > 1) {
        queries.push(tokens[ci - 2] + ' ' + pair);
      }
    }

    for (const q of queries.slice(0, 3)) {
      if (out.length >= 8) break;
      await runQuery(q);
    }
    if (out.length >= 4) break;
  }
  return out;
}

/**
 * Trang Wikipedia của DÒNG SẢN PHẨM (không phải model cụ thể).
 *
 * Nhiều dòng niche không có trang model riêng ("ASUS ROG Harpe Ace",
 * "Keychron Q1", "Razer BlackWidow V4") nhưng CÓ trang dòng sản phẩm
 * ("Asus ROG", "Keychron", "Razer Inc.") chứa ảnh chụp thật các sản phẩm
 * của hãng -> dùng làm fallback cuối cùng.
 */
/**
 * ảnh có thuộc ĐÀNG DÒNG sản phẩm của tên hay không.
 *
 * VD "ASUS ROG Strix G16" -> đòng "Strix" (hay "ROG Strix"). ảnh chung
 * chung kiểu "ASUS-laptop-A6B00R.JPG" KHÔNG chứa đúng dòng -> loại.
 */
function matchesProductLine(title: string, name: string): boolean {
  const tTokens = new Set(keyTokens(title));
  const nTokens = keyTokens(name);
  // Token đặc biệt (không phải hãng, không phải stopword,
  // không phải mã model thực sự) — đây là dấu hiệu dòng.
  const distinctive = nTokens.filter(
    (tk) =>
      !isBrandToken(tk) && !isModelCode(tk) && !STOPWORDS.has(tk) && tk.length >= 3,
  );
  if (!distinctive.length) return false;
  return distinctive.some(
    (tk) =>
      tTokens.has(tk) ||
      [...tTokens].some((tt) => tt.startsWith(tk) && tk.length >= 3),
  );
}

const BRAND_WIKI_PAGES: Record<string, string[]> = {
  ASUS: ['Asus ROG', 'Asus'],
  Acer: ['Acer Gaming', 'Acer'],
  Apple: ['IPhone', 'Apple Inc.'],
  Samsung: ['Samsung Galaxy', 'Samsung Electronics'],
  Xiaomi: ['Xiaomi Corporation', 'Xiaomi'],
  Oppo: ['Oppo', 'Oppo (company)'],
  Vivo: ['Vivo (company)', 'Vivo'],
  Realme: ['Realme', 'Realme (company)'],
  Honor: ['Honor (company)', 'Honor (smartphone)'],
  Oneplus: ['OnePlus', 'OnePlus (company)'],
  Google: ['Google Pixel', 'Pixel (smartphone)'],
  Microsoft: ['Microsoft Surface', 'Surface (Microsoft)'],
  Lenovo: ['Lenovo', 'ThinkPad'],
  Dell: ['Dell', 'Dell XPS'],
  Hp: ['HP Inc.', 'HP Omen'],
  Msi: ['Micro-Star International', 'MSI (company)'],
  Gigabyte: ['Gigabyte Technology', 'AORUS'],
  Logitech: ['Logitech', 'Logitech Gaming Software'],
  Razer: ['Razer Inc.', 'Razer'],
  Corsair: ['Corsair Gaming', 'Corsair (company)'],
  Steelseries: ['SteelSeries', 'SteelSeries Arctis'],
  Hyperx: ['HyperX', 'HyperX Cloud'],
  Keychron: ['Keychron', 'Keychron (company)'],
  Roccat: ['Roccat', 'ROCCAT'],
  Zowie: ['Zowie (brand)', 'Zowie'],
  Elgato: ['Elgato', 'Elgato Gaming'],
  Endgame: ['Endgame Gear', 'Endgame'],
  Nvidia: ['GeForce RTX 40 series', 'GeForce'],
  Amd: ['Ryzen 7', 'Ryzen 5', 'Ryzen 9', 'AMD Ryzen'],
  Intel: ['List of Intel Core processors', 'Intel Core'],
  Seagate: ['Seagate Technology', 'Seagate'],
  Wd: ['Western Digital', 'WD Red'],
  Crucial: ['Crucial (company)', 'Crucial Technology'],
  Kingston: ['Kingston Technology', 'Kingston Fury'],
  Wacom: ['Wacom', 'Wacom (company)'],
  Bose: ['Bose Corporation', 'Bose'],
  Jbl: ['JBL (company)', 'JBL'],
  Philips: ['Philips', 'Philips monitors'],
  Benq: ['BenQ', 'BenQ Corporation'],
  Viewsonic: ['ViewSonic', 'ViewSonic Corporation'],
  Lg: ['LG Electronics', 'LG (company)'],
  Aoc: ['AOC (company)', 'AOC International'],
  Deepcool: ['DeepCool', 'DeepCool (company)'],
  Coolermaster: ['Cooler Master', 'Cooler Master Corporation'],
  Gskill: ['G.Skill', 'G.Skill Trident Z'],
  Nokia: ['Nokia', 'Nokia (company)'],
  Tecno: ['Tecno Mobile', 'Tecno'],
  Jowacom: [],
};

/**
 * Từ khoá nhận diện LOẠI SẢN PHẨM trong tiêu đề ảnh.
 *
 * Dùng cho fallback theo dòng hãng: ảnh phải thuộc đúng LOẠI (chuột,
 * laptop, màn hình...) — nếu không thì ảnh chuột lại hiện ảnh laptop.
 */
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Điện thoại': ['iphone', 'galaxy', 'pixel', 'phone', 'oneplus', 'oppo', 'vivo', 'xiaomi', 'redmi', 'poco', 'honor', 'realme', 'nokia', 'tecno', 'huawei', 'sony'],
  Tablet: ['ipad', 'galaxy tab', 'tablet', 'matepad', 'xiaomi pad', 'surface pro'],
  Laptop: ['laptop', 'notebook', 'macbook', 'vivobook', 'zenbook', 'ideapad', 'thinkpad', 'yoga', 'spectre', 'xps', 'inspiron', 'omen', 'victus', 'predator', 'nitro', 'swift', 'aura', 'rog', 'tuf', 'alienware', 'legion', 'loq', 'katana', 'stealth', 'raider', 'titan', 'gram', 'matebook', 'surface laptop'],
  'Màn hình': ['monitor', 'display', 'screen', 'agon', 'odyssey', 'ultragear', 'viewfinity', 'proart', 'alienware aw', 'benq', 'viewsonic', 'philips', 'aoc'],
  'PC Gaming': ['gaming pc', 'gaming computer', 'tower', 'desktop', 'workstation'],
  Chuột: ['mouse', 'mice', 'viper', 'deathadder', 'basilisk', 'g502', 'superlight', 'kronos', 'kain', 'sensei', 'abyss'],
  'Bàn phím': ['keyboard', 'keychron', 'blackwidow', 'huntsman', 'apex pro', 'k70', 'k100', 'k65', 'corsair', 'g915', 'hhkb', 'realforce'],
  'Tai nghe': ['headset', 'headphones', 'arctis', 'cloud iii', 'cloud alpha', 'quantum', 'tour one', 'quietcomfort', 'wh-1000xm', 'airpods max'],
  'Phụ kiện': ['charger', 'power bank', 'power adapter', 'hub', 'stream deck', 'wave', 'hd60', 'webcam', 'c920', 'brio', 'streamcam', 'cable'],
};

/**
 * Từ khóa LOÁI SẢN PHẨM thuần (không chứa tên hãng).
 *
 * Dùng khi đã kiểm tra tên hãng riêng (`hasBrandToken`). Nếu dùng chung
 * CATEGORY_KEYWORDS thì "Philips DECT Babyphone" cũng khớp "Màn hình" vì có
 * từ khóa "philips" -> ảnh sai.
 */
const CATEGORY_TYPE_WORDS: Record<string, string[]> = {
  'Điện thoại': ['smartphone', 'phone', 'iphone', 'handset'],
  Tablet: ['tablet', 'ipad'],
  Laptop: ['laptop', 'notebook', 'macbook', 'ultrabook'],
  'Màn hình': ['monitor', 'display', 'screen'],
  'PC Gaming': ['computer', 'desktop', 'workstation', 'tower'],
  Chuột: ['mouse', 'mice'],
  'Bàn phím': ['keyboard'],
  'Tai nghe': ['headset', 'headphones', 'earphones', 'earbuds'],
  'Phụ kiện': ['charger', 'power bank', 'adapter', 'hub', 'webcam', 'cable'],
};

/**
 * Ảnh có thuộc đúng LOẠI sản phẩm không (dùng cho fallback dòng hãng).
 */
function matchesCategory(title: string, categoryName: string): boolean {
  const kws = CATEGORY_KEYWORDS[categoryName];
  if (!kws?.length) return true; // không rõ loại -> cho qua
  const t = norm(title);
  return kws.some((k) => t.includes(k));
}

/**
 * Ảnh từ trang Wikipedia của DÒNG SẢN PHẨM.
 *
 * Chỉ dùng khi KHÔNG tìm được ảnh của model cụ thể — ảnh vẫn là sản phẩm
 * thật của đúng hãng, chỉ không khớp từng biến thể.
 */
async function brandLineImages(
  brand: string,
  name: string,
  categoryName: string,
): Promise<Array<{ title: string; url: string }>> {
  const pages = BRAND_WIKI_PAGES[brand] ?? [];
  const out: Array<{ title: string; url: string }> = [];
  const seen = new Set<string>();

  for (const page of pages) {
    // Media-list của trang dòng sản phẩm -> nhiều ảnh chụp thật.
    const d = await getJson(
      `https://en.wikipedia.org/api/rest_v1/page/media-list/${encodeURIComponent(page)}`,
    );
    for (const it of d?.items ?? []) {
      if (it?.type !== 'image') continue;
      const srcset = it?.srcset ?? [];
      const pick =
        srcset.find((s: any) => s.scale === 2) ??
        srcset.find((s: any) => s.scale === 1) ??
        srcset[0];
      if (!pick?.src) continue;
      const url = String(pick.src).startsWith('//')
        ? `https:${pick.src}`
        : String(pick.src);
      const fileTitle = String(it.title ?? '');
      if (seen.has(url)) continue;
      if (/vector|logo|icon|diagram|chart|screenshot|graph|\.svg$/i.test(fileTitle)) {
        continue;
      }
      if (!isProductPhoto(fileTitle, brand)) continue;
      if (!matchesCategory(fileTitle, categoryName)) continue;
      // Ảnh của dòng hãng phải CÓ tên hãng trong tiêu đề, nếu không sẽ rất
      // dễ nhận nhầm ảnh của hãng khác (ví dụ ảnh "Apple" cho "Razer").
      if (!hasBrandToken(fileTitle, brand)) continue;
      // ảnh phải thuộc ĐÀNG DÒNG sản phẩm (Strix, ZenBook, TUF...)
      // — nếu không, ảnh sẽ là ảnh chung chung ("ASUS laptop") -> SAI.
      if (!matchesProductLine(fileTitle, name)) continue;
      // ảnh của dòng hãng KHÔNG được dùng làm ảnh đề
      // để đối với sản phẩm khác (VD "Apple iPhone 13 Pro
      // on MacBook Pro" cho MacBook Air) -> loại.
      if (/\b(iphone|ipad|ipod|airpods|apple watch)\b/i.test(fileTitle)) {
        // Trừ trừ nếu đỉ là ảnh của chính iPad.
        if (!/ipad/i.test(name)) continue;
      }
      seen.add(url);
      out.push({ title: fileTitle, url });
    }
    if (out.length >= 3) break;
  }
  return out;
}

/**
 * Ảnh trong CATEGORY Commons của dòng sản phẩm.
 *
 * Commons phân có category theo dòng: "Category:MacBook Pro",
 * "Category:Logitech", "Category:Samsung Odyssey"... đây là nguồn ảnh
 * đều dòng khi không có ảnh đúng model cụ thể.
 */
async function commonsCategoryImages(
  model: string,
  brand: string,
  categoryName: string,
): Promise<Array<{ title: string; url: string }>> {
  const out: Array<{ title: string; url: string }> = [];
  const seen = new Set<string>();

  const cands = [
    ...categoryCandidates(model, brand),
    ...(await findCommonsCategories(model, brand)),
  ];
  for (const cat of cands) {
    if (out.length >= 6) break;
    const d = await getJson(
      `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
        `&list=categorymembers&cmtitle=${encodeURIComponent(`Category:${cat}`)}` +
        `&cmtype=file&cmlimit=50`,
    );
    const members: string[] = (d?.query?.categorymembers ?? [])
      .map((x: any) => String(x.title ?? ''))
      .filter(Boolean);
    if (!members.length) continue;

    // Lấy ảnh chi tiết (url + thumb) cho các file ứng viên.
    const files = members
      .filter((t) => /\.(jpe?g|png|webp)$/i.test(t) && !/\.svg$/i.test(t))
      .slice(0, 30);
    if (!files.length) continue;
    const info: any = await getJson(
      `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
        `&titles=${encodeURIComponent(files.join('|'))}` +
        `&prop=imageinfo&iiprop=url|mime&iiurlwidth=900`,
    );
    for (const p of Object.values<any>(info?.query?.pages ?? {})) {
      if (out.length >= 12) break;
      const ii = (p.imageinfo ?? [])[0];
      if (!ii) continue;
      if (ii.mime && !/^image\/(jpeg|png|webp)$/.test(ii.mime)) continue;
      const url: string = ii.thumburl ?? ii.url;
      if (!url || seen.has(url)) continue;
      const t = String(p.title ?? '');
      if (!isProductPhoto(t, brand)) continue;
      // Ưu tiên: khớp đúng model. Nếu không thì phải cùng dòng sản phẩm
      // + đúng loại.
      if (isMatch(t, model)) {
        seen.add(url);
        out.push({ title: t, url });
        continue;
      }
      if (!matchesCategory(t, categoryName)) continue;
      if (!matchesProductLine(t, model)) continue;
      seen.add(url);
      out.push({ title: t, url });
    }
  }
  return out;
}

/**
 * ảNH THEO CATEGORY CỦA HÃNG trên Commons.
 *
 * Mục đích: khi một model KHÔNG có ảnh riêng, pool fallback thường chỉ có
 * 2-3 ảnh -> nhiều model dùng chung ảnh chính -> trang chủ hiển thị trùng.
 * Lớp này gom thật nhiều ảnh sản phẩm thật của đúng hãng + đúng loại
 * (VD "Category:BenQ monitors", "Category:Corsair keyboards") để mỗi model
 * có đủ ảnh để xoay vòng, ảnh chính không trùng nhau.
 */
async function commonsBrandCategoryImages(
  brand: string,
  categoryName: string,
): Promise<Array<{ title: string; url: string }>> {
  const TYPE_WORDS: Record<string, string[]> = {
    'Điện thoại': ['phones', 'smartphones'],
    Tablet: ['tablets'],
    Laptop: ['laptops', 'notebooks'],
    'Màn hình': ['monitors', 'displays'],
    'PC Gaming': ['computers', 'cases'],
    Chuột: ['mice'],
    'Bàn phím': ['keyboards'],
    'Tai nghe': ['headsets', 'headphones'],
    'Phụ kiện': ['accessories'],
  };
  const words = TYPE_WORDS[categoryName] ?? [];

  // Tên category thử: "BenQ monitors", "BenQ", "Corsair keyboards"...
  const cands: string[] = [];
  for (const w of words) cands.push(`${brand} ${w}`);
  cands.push(brand);

  const out: Array<{ title: string; url: string }> = [];
  const seen = new Set<string>();

  for (const cat of cands) {
    if (out.length >= 12) break;
    const d = await getJson(
      `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
        `&list=categorymembers&cmtitle=${encodeURIComponent(`Category:${cat}`)}` +
        `&cmtype=file&cmlimit=100`,
    );
    const members: string[] = (d?.query?.categorymembers ?? [])
      .map((x: any) => String(x.title ?? ''))
      .filter(Boolean);
    if (!members.length) continue;

    const files = members
      .filter((t) => /\.(jpe?g|png|webp)$/i.test(t) && !/\.svg$/i.test(t))
      .slice(0, 40);
    if (!files.length) continue;

    const info: any = await getJson(
      `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
        `&titles=${encodeURIComponent(files.join('|'))}` +
        `&prop=imageinfo&iiprop=url|mime&iiurlwidth=900`,
    );
    for (const p of Object.values<any>(info?.query?.pages ?? {})) {
      if (out.length >= 12) break;
      const ii = (p.imageinfo ?? [])[0];
      if (!ii) continue;
      if (ii.mime && !/^image\/(jpeg|png|webp)$/.test(ii.mime)) continue;
      const url: string = ii.thumburl ?? ii.url;
      if (!url || seen.has(url)) continue;
      const t = String(p.title ?? '');
      // Phải là ảnh sản phẩm thật của ĐÚNG hãng.
      if (!isProductPhoto(t, brand)) continue;
      if (!hasBrandToken(t, brand)) continue;
      // Phải đúng loại sản phẩm (monitor/display cho "Màn hình"...) — tránh
      // lấy ảnh linh kiện/đồ trưng bày của hãng khác loại.
      if (!matchesCategory(t, categoryName)) continue;
      seen.add(url);
      out.push({ title: t, url });
    }
  }
  return out;
}

/**
 * Tên category Commons để thử cho 1 model.
 *
 * Thử nhiều dạng: tên đầy đủ, tên bỏ hãng, tên bỏ kích thước, tên bỏ mã
 * model cuối, rồi tên dòng sản phẩm quen thuộc.
 */
function categoryCandidates(model: string, brand: string): string[] {
  const out = new Set<string>();
  const base = modelName(model);
  const tokens = base.split(' ').filter(Boolean);
  const brandFirst = brand.split(' ')[0].toLowerCase();
  const rest = tokens[0]?.toLowerCase() === brandFirst ? tokens.slice(1) : tokens;

  const add = (s?: string) => {
    const v = s?.trim();
    if (v && v.length > 2) out.add(v);
  };

  add(base);
  add(rest.join(' '));
  // Bỏ kích thước: "MacBook Pro 14in M4 Pro" -> "MacBook Pro M4 Pro".
  add(base.replace(/\s*\d{1,2}(?:\.\d+)?in\b/g, '').trim());
  // Bỏ hãng: "AOC AGON PRO AG274QZM" -> "AGON PRO AG274QZM".
  if (rest.length > 1) {
    add(rest.slice(0, 3).join(' '));
    add(rest.slice(0, 2).join(' '));
  }
  // Bỏ mã model cuối: "MacBook Pro M4 Pro" -> "MacBook Pro".
  if (rest.length > 1) add(rest.slice(0, -1).join(' '));

  return [...out].slice(0, 6);
}

/**
 * Tìm tên CATEGORY Commons phù hợp với model.
 *
 * Commons có namespace 14 (Category). Tên category thường KHÔNG trùng khớp
 * tên sản phẩm ("Samsung Odyssey G8" -> "Category:Samsung Odyssey"),
 * nên phải tìm thay vì đoán.
 */
async function findCommonsCategories(
  model: string,
  brand: string,
): Promise<string[]> {
  const out: string[] = [];
  const seen = new Set<string>();

  const queries = [modelName(model), modelName(model).replace(/\s*\d{1,2}(?:\.\d+)?in\b/g, '').trim()];
  // Bỏ hãng.
  const brandFirst = brand.split(' ')[0].toLowerCase();
  const tokens = modelName(model).split(' ').filter(Boolean);
  if (tokens[0]?.toLowerCase() === brandFirst && tokens.length > 1) {
    queries.push(tokens.slice(1).join(' '));
  }

  for (const q of queries) {
    if (!q) continue;
    const d = await getJson(
      `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
        `&list=search&srnamespace=14&srsearch=${encodeURIComponent(q)}` +
        `&srlimit=8`,
    );
    for (const x of (d?.query?.search ?? [])) {
      const t = String(x.title ?? '');
      if (!t || seen.has(t)) continue;
      // Bỏ category quá rộng ("Category:Electronics") — chỉ lấy category
      // có liên quan chặt tới tên model.
      const name = t.replace(/^Category:/i, '');
      if (!name.toLowerCase().includes(keyTokenOf(q))) continue;
      seen.add(t);
      out.push(name);
      if (out.length >= 5) return out;
    }
  }
  return out;
}

/** Token định danh chính của model (bỏ brand + stopword). */
function keyTokenOf(name: string): string {
  const toks = keyTokens(name).filter(
    (t) => !isBrandToken(t) && !STOPWORDS.has(t) && t.length >= 3,
  );
  return (toks[0] ?? name).toLowerCase();
}

/**
 * Ảnh DÒNG SẢN PHẨM từ Commons theo tên hãng + loại sản phẩm.
 *
 * Nhiều model niche không có ảnh riêng trên Commons ("ViewSonic XG272-2K-OLED")
 * nhưng vẫn có ảnh của dòng sản phẩm cùng hãng ("ViewSonic VX710 front.jpg").
 * Ảnh này là sản phẩm THẬT, đúng hãng, đúng loại -> chấp nhận được khi không
 * còn lựa chọn nào chính xác hơn.
 */
async function commonsBrandLineImages(
  model: string,
  brand: string,
  categoryName: string,
): Promise<Array<{ title: string; url: string }>> {
  const out: Array<{ title: string; url: string }> = [];
  const seen = new Set<string>();

  // Từ khoá theo loại sản phẩm (tiếng Anh) để tìm đúng nhóm ảnh.
  const TYPE_WORDS: Record<string, string[]> = {
    'Điện thoại': ['smartphone', 'phone'],
    Tablet: ['tablet'],
    Laptop: ['laptop', 'notebook'],
    'Màn hình': ['monitor', 'display'],
    'PC Gaming': ['computer', 'desktop', 'pc'],
    Chuột: ['mouse'],
    'Bàn phím': ['keyboard'],
    'Tai nghe': ['headset', 'headphones'],
    'Phụ kiện': ['adapter', 'charger', 'hub'],
  };
  const types = TYPE_WORDS[categoryName] ?? [];

  const queries = [
    `${brand} ${types[0] ?? ''}`.trim(),
    brand,
    ...types.map((t) => `${brand} ${t}`),
  ];

  for (const q of queries) {
    if (out.length >= 12) break;
    if (!q) continue;
    const d = await getJson(
      `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
        `&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(q)}` +
        `&gsrlimit=50&prop=imageinfo&iiprop=url|mime&iiurlwidth=900`,
    );
    for (const p of Object.values<any>(d?.query?.pages ?? {})) {
      if (out.length >= 12) break;
      const ii = (p.imageinfo ?? [])[0];
      if (!ii) continue;
      if (ii.mime && !/^image\/(jpeg|png|webp)$/.test(ii.mime)) continue;
      const url: string = ii.thumburl ?? ii.url;
      if (!url || seen.has(url)) continue;
      const t = String(p.title ?? '');
      if (!isProductPhoto(t, brand, model)) continue;
      // Phải có tên hãng trong tiêu đề -> không nhận nhầm hãng khác.
      if (!hasBrandToken(t, brand)) continue;
      // Phải đúng loại sản phẩm -> không lấy ảnh laptop cho chuột.
      // Dùng CATEGORY_TYPE_WORDS (không chứa tên hãng) vì tên hãng đã được
      // kiểm tra riêng bằng hasBrandToken.
      const typeWords = CATEGORY_TYPE_WORDS[categoryName] ?? [];
      const tn = norm(t);
      if (!typeWords.some((w) => tn.includes(w))) continue;
      // Loại trừ ảnh đã khớp model khác (để ưu tiên ảnh model).
      seen.add(url);
      out.push({ title: t, url });
    }
  }
  return out;
}

/**
 * ảnh "ANH EM CÙNG DÒNG" — ảnh của sản phẩm KHÁC trong cùng hãng.
 *
 * VD: "Corsair Katar Pro XT Wireless" không có ảnh riêng, nhưng Commons có
 * "File:Corsair Katar Pro Wireless.jpg" -> đúng hãng, đúng dòng sản phẩm.
 *
 * Nguyên tḜ: PHảI có tên hãng trong tiêu đề, đúng loái sản phẩm,
 * và loại trừ ảnh thuộc loái khác.
 */
async function commonsSiblingImages(
  model: string,
  brand: string,
  categoryName: string,
): Promise<Array<{ title: string; url: string }>> {
  const out: Array<{ title: string; url: string }> = [];
  const seen = new Set<string>();

  const TYPE_WORDS: Record<string, string[]> = {
    'Điện thoại': ['smartphone', 'phone'],
    Tablet: ['tablet'],
    Laptop: ['laptop', 'notebook', 'macbook'],
    'Màn hình': ['monitor', 'display'],
    'PC Gaming': ['computer', 'desktop'],
    Chuột: ['mouse', 'mice'],
    'Bàn phím': ['keyboard'],
    'Tai nghe': ['headset', 'headphones', 'earbuds', 'earphones'],
    'Phụ kiện': ['charger', 'power bank', 'adapter', 'hub', 'webcam'],
  };
  const types = TYPE_WORDS[categoryName] ?? [];

  // Loại trừ ảnh thuộc LOÁI khác (VD ảnh ATX cho tai nghe).
  const WRONG_TYPE: Record<string, string[]> = {
    'Điện thoại': ['laptop', 'monitor', 'keyboard', 'mouse', 'headset'],
    Tablet: ['laptop', 'monitor', 'keyboard', 'mouse', 'headset'],
    Laptop: ['monitor', 'keyboard', 'mouse', 'headset', 'smartphone'],
    'Màn hình': ['laptop', 'keyboard', 'mouse', 'headset', 'smartphone'],
    'PC Gaming': ['monitor', 'keyboard', 'mouse', 'headset'],
    Chuột: ['laptop', 'monitor', 'keyboard', 'headset'],
    'Bàn phím': ['laptop', 'monitor', 'mouse', 'headset'],
    'Tai nghe': ['laptop', 'monitor', 'keyboard', 'mouse'],
    'Phụ kiện': ['laptop', 'monitor', 'keyboard', 'mouse', 'headset'],
  };
  const wrong = WRONG_TYPE[categoryName] ?? [];

  const base = modelName(model);
  const brandFirst = brand.split(' ')[0].toLowerCase();
  const tokens = base.split(' ').filter(Boolean);
  const rest = tokens[0]?.toLowerCase() === brandFirst ? tokens.slice(1) : tokens;

  // Từ dòng sản phẩm (không mã model, không stopword).
  const lineWords = rest.filter(
    (t) => t.length >= 4 && !/^\d/.test(t) && !STOPWORDS.has(t.toLowerCase()),
  );

  // Nhóm 1: theo DÒNG sản phẩm -> bắt buộc khớp tên dòng.
  const lineQueries: string[] = [];
  if (lineWords.length) {
    lineQueries.push(`${brand} ${lineWords[0]}`);
    if (lineWords.length > 1) {
      lineQueries.push(`${brand} ${lineWords.slice(0, 2).join(' ')}`);
    }
  }
  // Nhóm 2: theo LOÁI sản phẩm -> chỉ cần đúng hãng.
  const typeQueries = types.map((t) => `${brand} ${t}`);

  const run = async (queries: string[], requireLine: boolean): Promise<void> => {
    for (const q of queries) {
      if (out.length >= 12) return;
      if (!q) continue;
      const d = await getJson(
        `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
          `&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(q)}` +
          `&gsrlimit=40&prop=imageinfo&iiprop=url|mime&iiurlwidth=900`,
      );
      for (const p of Object.values<any>(d?.query?.pages ?? {})) {
        if (out.length >= 12) return;
        const ii = (p.imageinfo ?? [])[0];
        if (!ii) continue;
        if (ii.mime && !/^image\/(jpeg|png|webp)$/.test(ii.mime)) continue;
        const url: string = ii.thumburl ?? ii.url;
        if (!url || seen.has(url)) continue;
        const t = String(p.title ?? '');
        // KHÔNG dùng conflictingModelCode ở lớp "anh em cùng dòng":
        // ảnh anh em CỐ TÝ khác model (VD "Katar Pro Wireless" cho
        // "Katar Pro XT") nhưng vẫn ĐÚNG DÒNG sản phẩm -> chấp nhận được.
        if (!isProductPhoto(t, brand)) continue;
        if (!hasBrandToken(t, brand)) continue;
        const tn = norm(t);
        if (wrong.some((w) => tn.includes(w))) continue;
        if (requireLine && !matchesProductLine(t, model)) continue;
        seen.add(url);
        out.push({ title: t, url });
      }
    }
  };

  await run(lineQueries, true);
  if (!out.length) await run(typeQueries, false);
  return out;
}


/**
 * ảNH SảN PHẩM CHUNG đÚNG LOÁI (không bắt buộc tên hãng).
 *
 * Lỡp CUốI CÙNG: chỉ dùng khi không có bất kỳ ảnh nào đúng loái.
 * ảnh vḓ là sản phẩm THẬT (không phải ảnh stock) để áp dụng
 * ánh cho sản phẩm không có 1ea5n sản phẩm thật.
 */
async function commonsGenericCategoryImages(
  categoryName: string,
  brand?: string,
): Promise<Array<{ title: string; url: string }>> {
  const TYPE_QUERIES: Record<string, string[]> = {
    'Điện thoại': ['smartphone product photo'],
    Tablet: ['tablet product photo'],
    Laptop: ['laptop computer product'],
    'Màn hình': ['computer monitor product'],
    'PC Gaming': ['gaming computer case'],
    Chuột: ['computer mouse product'],
    'Bàn phím': ['mechanical keyboard product'],
    'Tai nghe': ['gaming headset product'],
    'Phụ kiện': ['usb c charger adapter'],
  };
  const queries = TYPE_QUERIES[categoryName] ?? [];
  const out: Array<{ title: string; url: string }> = [];
  const seen = new Set<string>();

  for (const q of queries) {
    if (out.length >= 10) break;
    const d = await getJson(
      `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
        `&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(q)}` +
        `&gsrlimit=40&prop=imageinfo&iiprop=url|mime&iiurlwidth=900`,
    );
    for (const p of Object.values<any>(d?.query?.pages ?? {})) {
      if (out.length >= 10) break;
      const ii = (p.imageinfo ?? [])[0];
      if (!ii) continue;
      if (ii.mime && !/^image\/(jpeg|png|webp)$/.test(ii.mime)) continue;
      const url: string = ii.thumburl ?? ii.url;
      if (!url || seen.has(url)) continue;
      const t = String(p.title ?? '');
      if (!isProductPhoto(t, brand ?? '')) continue;
      // Ảnh của hãng KHÁC -> loại (VD ảnh Logitech cho chuột Corsair).
      if (brand && hasForeignBrand(t, brand)) continue;
      // ảnh phải có đúng loái để tìm được ảnh sản phẩm.
      const gk = CATEGORY_TYPE_WORDS[categoryName] ?? [];
      const gtn = norm(t);
      if (gk.length && !gk.some((w) => gtn.includes(w))) continue;
      // ảnh của sản phẩm khác -> không dùng được để động.
      const otherWords = Object.values(CATEGORY_TYPE_WORDS)
        .flat()
        .filter((w) => !(gk ?? []).includes(w));
      if (otherWords.some((w) => gtn.includes(w))) continue;
      seen.add(url);
      out.push({ title: t, url });
    }
  }
  return out;
}

interface ModelImages {
  /** Danh sách ảnh (khác nhau) của model. */
  images: string[];
  source: string;
  title: string;
}

async function resolveModel(
  model: string,
  brand: string,
  categoryName: string,
): Promise<ModelImages | null> {
  const images: string[] = [];
  const seen = new Set<string>();
  const add = (u: string) => {
    if (u && !seen.has(u)) {
      seen.add(u);
      images.push(u);
    }
  };

  let source = '';
  let title = '';

  // 0) Commons theo MÃ MODEL — nhanh và cho nhiều ảnh của cùng model.
  const byCode = await commonsByModelCode(model, brand);
  for (const i of byCode) add(i.url);
  if (images.length) {
    source = 'commons-code';
    title = byCode[0]?.title ?? model;
  }

  // 0b) Commons theo TIÊU ĐỀ FILE (intitle:) — bắt được model niche không
  //     có trang Wikipedia ("G502 Hero", "2026 G502 X PLUS (side view).jpg").
  if (images.length < 4) {
    const byTitle = await commonsIntitleImages(model, brand);
    for (const i of byTitle) add(i.url);
    if (images.length && !source) {
      source = 'commons-intitle';
      title = byTitle[0]?.title ?? model;
    }
  }

  for (const v of variants(model)) {
    if (images.length >= 4) break;

    // 1) Nhiều ảnh từ media-list của trang Wikipedia.
    const ml = await mediaListImages(v, model);
    for (const i of ml) add(i.url);
    if (images.length && !source) {
      source = 'wikipedia-media';
      title = ml[0]?.title ?? v;
    }

    // 2) Ảnh đại diện của trang Wikipedia khớp chính xác.
    const direct = await wikiThumb(v, model);
    if (direct) {
      add(direct.url);
      if (!source) {
        source = 'wikipedia';
        title = direct.title;
      }
    }

    // 3) Tìm ứng viên trang rồi lấy media-list của trang đó.
    if (images.length < 4) {
      const titles = await wikiSearchTitles(v);
      const exact = titles.find((t) => norm(t) === norm(model));
      const ordered = exact
        ? [exact, ...titles.filter((t) => t !== exact)]
        : titles;
      for (const t of ordered.slice(0, 3)) {
        const ml2 = await mediaListImages(t, model);
        for (const i of ml2) add(i.url);
        const th = await wikiThumb(t, model);
        if (th) add(th.url);
        if (images.length >= 4) break;
      }
      if (images.length && !source) {
        source = 'wikipedia-search';
        title = ordered[0] ?? v;
      }
    }

    // 4) Commons — thử tên đầy đủ rồi rút ngắn dần.
    if (images.length < 4) {
      const queries = [v, ...commonsQueries(v, brand)].filter(
        (q, i, arr) => q && arr.indexOf(q) === i,
      );
      for (const q of queries) {
        const c = await commonsSearch(q, brand, model);
        for (const i of c) add(i.url);
        if (images.length >= 4) break;
      }
      if (images.length && !source) {
        source = 'commons';
        title = v;
      }
    }

    if (images.length >= 4) break;
  }

  // 5) CATEGORY Commons của dòng sản phẩm.
  if (!images.length) {
    const cat = await commonsCategoryImages(model, brand, categoryName);
    for (const i of cat) add(i.url);
    if (images.length) {
      source = 'commons-category';
      title = cat[0]?.title ?? model;
    }
  }

  // 6) ảNH DÒNG SảN PHẩM trên Commons (cùng hãng, cùng loái).
  if (!images.length) {
    const line = await commonsBrandLineImages(model, brand, categoryName);
    for (const i of line) add(i.url);
    if (images.length) {
      source = 'commons-brand-line';
      title = line[0]?.title ?? brand;
    }
  }

  // 7) ÀNH EM CÙNG DÒNG (cùng hãng, cùng loái sản phẩm).
  if (!images.length) {
    const sib = await commonsSiblingImages(model, brand, categoryName);
    for (const i of sib) add(i.url);
    if (images.length) {
      source = 'commons-sibling';
      title = sib[0]?.title ?? brand;
    }
  }

  // 8) ảNH CHUNG ĐÚNG LOÁI (lỡp cuối cùng).
  if (!images.length) {
    const gen = await commonsGenericCategoryImages(categoryName, brand);
    for (const i of gen) add(i.url);
    if (images.length) {
      source = 'commons-generic';
      title = gen[0]?.title ?? categoryName;
    }
  }

  // 7b) BỔ SUNG POOL ảnh theo category của hãng.
  //     Model không có ảnh riêng thường chỉ rơi về 2-3 ảnh fallback ->
  //     nhiều model trùng ảnh chính. Lớp này gom thật nhiều ảnh sản phẩm
  //     thật của hãng để mỗi model có đủ ảnh để xoay vòng.
  if (images.length < 6) {
    const bc = await commonsBrandCategoryImages(brand, categoryName);
    for (const i of bc) add(i.url);
  }

  // 9) FALLBACK CUỐI: trang dòng sản phẩm của hãng.
  //    Dùng khi model không có trang/ảnh riêng — ảnh vẫn là sản phẩm thật
  //    của đúng hãng (ví dụ "Asus ROG" cho "ASUS ROG Harpe Ace").
  if (!images.length) {
    const line = await brandLineImages(brand, model, categoryName);
    for (const i of line) add(i.url);
    if (images.length) {
      source = 'brand-line';
      title = line[0]?.title ?? brand;
    }
  }

  if (!images.length) return null;
  // Giữ tới 12 ảnh để đủ ảnh xoay vòng cho các biến thể cùng model và
  // để mỗi model có ảnh chính riêng.
  return { images: images.slice(0, 12), source, title };
}

/**
 * PHÂN BỔ LẠI ẢNH CHÍNH — mỗi model phải có ảnh chính RIÊNG.
 *
 * Vấn đề: nhiều model không có ảnh riêng trên Commons nên rơi về cùng một
 * ảnh fallback (VD cả "Logitech G915", "Logitech G Pro X 60%", "Logitech MX
 * Keys S" đều nhận "Logitech Gaming-Keyboard G15.jpg") -> trang chủ hiển
 * thị nhiều sản phẩm giống hệt nhau.
 *
 * Thuật toán GREEDY toàn cục:
 *   1. Ưu tiên model có ảnh RIÊNG (source = commons-code / commons-intitle
 *      / wikipedia...) — ảnh đúng model tuyệt đối, giữ nguyên ảnh chính.
 *   2. Với model dùng ảnh fallback: chọn ảnh đầu tiên trong pool CHƯA được
 *      dùng làm ảnh chính của model nào khác. Nếu hết -> dùng ảnh ít được
 *      dùng nhất (chia đều).
 *   3. Đảo lại thứ tự pool để ảnh chính đứng đầu.
 *
 * @param groups model -> danh sách ảnh (đã có)
 */
export function distributePrimaryImages(
  groups: Map<string, ModelImages> | Record<string, ModelImages>,
): void {
  const entries =
    groups instanceof Map ? [...groups.entries()] : Object.entries(groups);
  if (!entries.length) return;

  // 1) Đếm model dùng mỗi ảnh làm ảnh chính.
  const primaryCount = new Map<string, number>();
  for (const [, v] of entries) {
    const main = v.images[0];
    if (!main) continue;
    primaryCount.set(main, (primaryCount.get(main) ?? 0) + 1);
  }

  // 2) Ảnh CHƯA dùng làm ảnh chính của model nào (dồn từ các pool).
  const usedAsPrimary = new Set(primaryCount.keys());

  // Model có ảnh RIÊNG (không phải fallback) -> giữ nguyên, ưu tiên cao.
  const EXACT_SOURCES = new Set([
    'commons-code',
    'commons-intitle',
    'wikipedia',
    'wikipedia-media',
    'wikipedia-search',
    'commons',
  ]);

  const order = [...entries].sort(([a], [b]) => {
    const ea = EXACT_SOURCES.has(entries.find(([m]) => m === a)![1].source);
    const eb = EXACT_SOURCES.has(entries.find(([m]) => m === b)![1].source);
    if (ea !== eb) return ea ? -1 : 1;
    return a.localeCompare(b);
  });

  // Ảnh đã dùng làm ảnh chính (cộng dồn trong lúc phân bổ).
  const taken = new Set<string>();
  const usage = new Map<string, number>(primaryCount);

  for (const [model, v] of order) {
    if (!v.images.length) continue;
    const isExact = EXACT_SOURCES.has(v.source);

    // Model có ảnh riêng -> giữ nguyên ảnh chính (đã đúng model).
    if (isExact) {
      const main = v.images[0];
      taken.add(main);
      continue;
    }

    // Ảnh chưa dùng làm ảnh chính của model nào khác -> chọn ngay.
    let chosen = v.images.find((u) => !taken.has(u));

    // Hết ảnh riêng -> chọn ảnh ít dùng nhất (chia đều tải).
    if (!chosen) {
      let best: string | undefined;
      let bestCount = Infinity;
      for (const u of v.images) {
        const c = usage.get(u) ?? 0;
        if (c < bestCount) {
          bestCount = c;
          best = u;
        }
      }
      chosen = best;
    }
    if (!chosen) continue;

    taken.add(chosen);
    usage.set(chosen, (usage.get(chosen) ?? 0) + 1);

    // Đưa ảnh chọn lên đầu pool.
    v.images = [chosen, ...v.images.filter((u) => u !== chosen)];
  }

  // 4) PHA B: gộp pool của các model vẫn còn trùng ảnh chính rồi xoay vòng.
  //    Ví dụ 3 model cùng dùng ảnh "BENQ MONITOR" làm ảnh chính -> gộp 3 pool
  //    (6 ảnh) và chia đều để mỗi model có ảnh chính riêng.
  const mainCount = new Map<string, number>();
  for (const [, v] of entries) {
    const m = v.images[0];
    if (!m) continue;
    mainCount.set(m, (mainCount.get(m) ?? 0) + 1);
  }

  const dupMain = [...mainCount.entries()]
    .filter(([, c]) => c > 1)
    .map(([m]) => m);

  if (dupMain.length) {
    // Gom các model theo ảnh chính đang trùng.
    const byMain = new Map<string, string[]>();
    for (const [model, v] of entries) {
      const m = v.images[0];
      if (!m) continue;
      const list = byMain.get(m) ?? [];
      list.push(model);
      byMain.set(m, list);
    }

    for (const main of dupMain) {
      const models = byMain.get(main)!;
      if (models.length < 2) continue;

      // Gộp toàn bộ ảnh của các model này thành pool chung.
      const pool: string[] = [];
      for (const model of models) {
        const v = entries.find(([m]) => m === model)![1];
        for (const u of v.images) if (!pool.includes(u)) pool.push(u);
      }
      if (pool.length < models.length) continue; // không đủ ảnh thì giữ nguyên

      models.sort();
      models.forEach((model, i) => {
        const v = entries.find(([m]) => m === model)![1];
        const k = i % pool.length;
        v.images = [...pool.slice(k), ...pool.slice(0, k)];
      });
    }
  }
}


async function main() {
  const mock = JSON.parse(
    readFileSync(resolve(process.cwd(), 'scripts/data/frontend-mock.json'), 'utf-8'),
  );

  // Gom tất cả sản phẩm (curated + seller) theo MODEL.
  const all: Array<{ name: string; brand: string; categoryName: string }> = [
    ...(mock.products as any[]),
    ...((mock.sellerProducts ?? []) as any[]),
  ];
  const byModel = new Map<
    string,
    { brand: string; count: number; categoryName: string }
  >();
  for (const p of all) {
    const m = modelName(p.name);
    const cur = byModel.get(m);
    if (cur) cur.count++;
    else
      byModel.set(m, {
        brand: p.brand,
        count: 1,
        categoryName: p.categoryName ?? '',
      });
  }

  const dest = resolve(process.cwd(), 'scripts/data/model-images.json');
  const result: Record<string, ModelImages> = {};

  // Nạp kết quả cũ để chạy lại không phải tra lại từ đầu.
  if (existsSync(dest)) {
    try {
      const prev = JSON.parse(readFileSync(dest, 'utf-8'));
      for (const [k, v] of Object.entries<any>(prev)) {
        // Chỉ giữ entry có cấu trúc mới (images[]).
        if (v && Array.isArray(v.images) && v.images.length) result[k] = v;
      }
      if (Object.keys(result).length) {
        console.log(
          `[model-img] Đã có sẵn ${Object.keys(result).length} model, tiếp tục tra cứu phần còn lại.`,
        );
      }
    } catch {
      /* ignore */
    }
  }

  const models = [...byModel.keys()].sort();
  let found = 0;

  // Xử lý SONG SONG nhiều model để không mất thời gian chờ mạng tuần tự.
  const CONCURRENCY = 10;
  let cursor = 0;

  // Lưu tiến độ định kỳ để không mất kết quả nếu script bị dừng.
  const saver = setInterval(() => {
    try {
      writeFileSync(dest, JSON.stringify(result, null, 2), 'utf-8');
    } catch {
      /* ignore */
    }
  }, 5000);

  const worker = async (): Promise<void> => {
    while (cursor < models.length) {
      const model = models[cursor++];
      const info = byModel.get(model)!;
      if (result[model]?.images?.length >= 4) {
        found++;
        continue;
      }

      const hit = await resolveModel(model, info.brand, info.categoryName);
      if (hit) {
        found++;
        result[model] = hit;
      }
      console.log(
        `${hit ? '✓' : '✗'} ${model.padEnd(46)} ${hit ? `${hit.images.length} ảnh | ${hit.source} | ${hit.title}` : ''}`,
      );
      await wait(150);
    }
  };

  await Promise.all(
    Array.from({ length: CONCURRENCY }, () => worker()),
  );

  clearInterval(saver);

  // Phân bổ lại ảnh chính: mỗi model phải có ảnh chính RIÊNG để trang
  // chủ không hiển thị nhiều sản phẩm giống hệt nhau.
  distributePrimaryImages(result);

  writeFileSync(dest, JSON.stringify(result, null, 2), 'utf-8');
  const totalImages = Object.values(result).reduce((s, v) => s + v.images.length, 0);
  console.log(
    `\n[model-img] Tìm được ảnh cho ${found}/${models.length} model ` +
      `(${totalImages} ảnh duy nhất) -> ${dest}`,
  );

  // Báo cáo ảnh chính còn trùng giữa các model khác nhau.
  const firstUse = new Map<string, string[]>();
  for (const [model, v] of Object.entries(result)) {
    const main = v.images[0];
    if (!main) continue;
    const list = firstUse.get(main) ?? [];
    list.push(model);
    firstUse.set(main, list);
  }
  const shared = [...firstUse.entries()].filter(([, l]) => l.length > 1);
  console.log(
    `[model-img] Ảnh chính dùng chung giữa các model: ${shared.length} nhóm` +
      (shared.length
        ? ` (nhiều nhất ${Math.max(...shared.map(([, l]) => l.length))} model)`
        : ''),
  );
  for (const [url, models] of shared.slice(0, 8)) {
    console.log(
      `   - ${decodeURIComponent(url.split('/').pop()?.split('?')[0] ?? '')}` +
        ` <- ${models.slice(0, 4).join(' | ')}`,
    );
  }
}

// Chỉ chạy khi file được gọi TRỰC TIẾP (không chạy khi được import để
// test các hàm bộ lọc).
if (process.argv[1]?.endsWith('resolve-model-images.ts')) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
