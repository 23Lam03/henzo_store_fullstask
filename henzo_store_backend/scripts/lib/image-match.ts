/**
 * SO KHỚP ẢNH VỚI TÊN MODEL / HÃNG (dùng chung cho các script audit & fix).
 *
 * Vì sao cần module riêng: tên file Commons không theo một quy  luật —
 *   "Laptophp.png"          -> token "hp" nằm giữa, phải so bằng substring
 *   "MSIGamingNotebook.jpg" -> token "msi" cũng nằm giữa
 *   "Apple_iPhone_12_Pro"   -> token tách bằng dấu gạch dưới
 *
 * Nếu mỗi script tự viết logic so khớp, kết quả sẽ lệch nhau và gây hiểu
 * nhầm. Mọi script đo/gán ảnh đều dùng chung hàm ở đây.
 */

/** Token dừng — không mang thông tin định danh sản phẩm. */
export const STOP_TOKENS = new Set([
  'pro', 'plus', 'max', 'ultra', 'mini', 'air', 'se', 'gen', 'series',
  'gaming', 'wireless', 'rgb', 'black', 'white', 'silver', 'grey', 'gray',
  'titanium', 'magnetic', 'tkl', 'full', 'size', 'edition', 'combo',
  'package', 'kit', 'new', 'type', 'model', 'with', 'and', 'the', 'for',
  'inch', 'gb', 'tb', 'dung', 'luu', 'cho', 'gia', 're', 'sieu', 'toc',
  'phan', 'bo', 'mau', 'do', 'den', 'trang', 'xanh', 'hang', 'cap',
]);

/** Token marketing không bao giờ nằm trong tên file Commons. */
export const MARKETING_TOKENS = new Set([
  'pc', 'gaming', 'workstation', 'silent', 'stream', 'streaming', 'esports',
  'arena', 'budget', 'starter', 'supreme', 'phantom', 'creator', 'whisper',
  'tournament', 'flagship', 'basic', 'advanced', 'premium', 'performance',
  'productivity', 'metaverse', 'ready', 'setup', 'itx', 'mini', 'tower',
]);

/** Tách chuỗi thành token chữ/số, bỏ stop-word. */
export function tokenize(text: string): string[] {
  return (text ?? '')
    .replace(/[()"]/g, ' ')
    .split(/[^A-Za-z0-9]+/)
    .filter((t) => t.length >= 2 && !STOP_TOKENS.has(t.toLowerCase()))
    .map((t) => t.toLowerCase());
}

/** Chuẩn hoá tên file Commons về chuỗi so sánh. */
export function normalizeFileTitle(title: string): string {
  return (title ?? '')
    .replace(/^File:/, '')
    .replace(/\.(jpe?g|png|webp|tiff)$/i, '')
    .replace(/[_.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/** Tên file từ URL (bỏ query + tiền tố `NNNpx-`). */
export function fileNameFromUrl(url: string): string {
  return decodeURIComponent(url.split('?')[0]?.split('/').pop() ?? '')
    .replace(/^\d+px-/, '');
}

/**
 * File có chứa ít nhất một token của `name` không.
 *
 * Token dài (>= 4 ký tự) so khớp bằng phần tử (chính xác, tránh "pro" khớp
 * "project"); token ngắn (<= 3 ký tự: "hp", "lg", "msi") so bằng substring
 * vì Commons hay viết liền ("Laptophp.png").
 */
export function fileMatchesName(name: string, urlOrFile: string): boolean {
  const raw = urlOrFile.includes('http')
    ? fileNameFromUrl(urlOrFile)
    : urlOrFile;
  const f = normalizeFileTitle(raw);
  const fTokens = new Set(tokenize(f));
  return tokenize(name).some((t) =>
    t.length <= 3 ? f.includes(t) : fTokens.has(t),
  );
}

/** Có chứa đủ TẤT CẢ token quan trọng của `name` không (khớp chặt). */
export function fileMatchesAll(name: string, urlOrFile: string): boolean {
  const raw = urlOrFile.includes('http')
    ? fileNameFromUrl(urlOrFile)
    : urlOrFile;
  const f = normalizeFileTitle(raw);
  const fTokens = new Set(tokenize(f));
  const toks = tokenize(name).filter((t) => t.length >= 3);
  if (!toks.length) return false;
  return toks.every((t) => fTokens.has(t));
}
