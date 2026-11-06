/**
 * TÌM ẢNH WIKIMEDIA COMMONS KHỚP CHÍNH XÁC TÊN MODEL.
 *
 * Tên sản phẩm thương mại có nhiều token marketing không tồn tại trên
 * Commons ("PC Gaming RTX 5090 Supreme" -> file chỉ ghi "RTX 5090").
 * Vì vậy ta sinh NHIỀU truy vấn từ các "chữ ký" khác nhau của model:
 *
 *   "PC Gaming RTX 5090 Supreme"  ->  "RTX 5090", "GeForce RTX 5090", ...
 *   "LG UltraGear 27GR95QE 27in"  ->  "27GR95QE", "UltraGear 27GR95QE"
 *
 * Ứng viên được chấm điểm theo độ phủ token của TRUY VẤN đã dùng (chứ không
 * phải toàn bộ tên model), nên ảnh "RTX 5090" được chấp nhận cho model
 * "PC Gaming RTX 5090 Supreme".
 */
import { getJson } from './commons-files';

export interface Candidate {
  file: string;
  url: string;
  title: string;
  score: number;
  hit: number;
  coverage: number;
  query: string;
}

/** Token dừng không mang thông tin định danh. */
const STOP = new Set([
  'pro', 'plus', 'max', 'ultra', 'mini', 'air', 'se', 'gen', 'series',
  'gaming', 'wireless', 'rgb', 'black', 'white', 'silver', 'grey', 'gray',
  'titanium', 'magnetic', 'tkl', 'full', 'size', 'edition', 'combo',
  'package', 'kit', 'new', 'type', 'model', 'with', 'and', 'the', 'for',
]);

/** Token marketing không bao giờ nằm trong tên file Commons. */
const MARKETING = new Set([
  'pc', 'gaming', 'workstation', 'silent', 'stream', 'streaming', 'esports',
  'arena', 'budget', 'starter', 'supreme', 'phantom', 'creator',
  'whisper', 'tournament', 'edition', 'editions', 'flagship', 'basic',
  'advanced', 'premium', 'performance', 'productivity', 'metaverse',
  'ready', 'setup', 'itx', 'mini', 'tower', 'mua', 'ban', 'hang', 'cap',
  'capcut', 'hangcap',
]);

const tokenize = (s: string): string[] =>
  s
    .replace(/[()"]/g, ' ')
    .split(/[^A-Za-z0-9]+/)
    .filter((t) => t.length >= 2 && !STOP.has(t.toLowerCase()))
    .map((t) => t.toLowerCase());

const normTitle = (t: string): string =>
  t
    .replace(/^File:/, '')
    .replace(/\.(jpe?g|png|webp)$/i, '')
    .replace(/[_.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

/**
 * Sinh các truy vấn ứng viên từ tên model, xếp theo độ đặc trưng.
 *
 * Ưu tiên:
 *  1. Chuỗi "mã sản phẩm" (chứa số + chữ hoa, vd "AG274QZM", "M32UC").
 *  2. Chuỗi series + mã (vd "UltraGear 27GR95QE").
 *  3. Cụm token có số (vd "RTX 5090", "iPhone 16").
 */
export function buildQueries(model: string): string[] {
  const raw = model.replace(/["']/g, ' ').replace(/\s+/g, ' ').trim();
  const out: string[] = [];

  // 1. Chuỗi có số xen kẽ chữ hoa -> mã model (Apple/ASUS/Samsung hay dùng).
  const codes = raw.match(/\b(?=[A-Za-z0-9]*[A-Za-z])(?=[A-Za-z0-9]*\d)[A-Za-z0-9]{4,}\b/g) ?? [];
  for (const c of codes) out.push(c);

  // 2. Chuỗi "mã" đứng sau 1-2 từ đầu (UltraGear 27GR95QE).
  const words = raw.split(' ');
  for (let i = 0; i < words.length - 1; i++) {
    const two = words[i] + ' ' + words[i + 1];
    if (/\d/.test(two) && two.length >= 6 && two.length <= 24) out.push(two);
  }

  // 3. Cụm token có chứa số, loại bỏ token marketing.
  const toks = tokenize(raw).filter((t) => !MARKETING.has(t));
  const numeric = toks.filter((t) => /\d/.test(t));
  if (numeric.length) {
    const kept: string[] = [];
    for (const w of words) {
      const lw = w.toLowerCase();
      if (MARKETING.has(lw) || STOP.has(lw)) continue;
      if (!/\d/.test(lw) && !kept.length) continue;
      kept.push(w);
    }
    if (kept.length) out.push(kept.join(' '));
    out.push(numeric.join(' '));
  }

  // 4. Toàn bộ tên model (bỏ token marketing).
  const full = words.filter((w) => !MARKETING.has(w.toLowerCase())).join(' ');
  if (full) out.push(full);
  out.push(raw);

  return [...new Set(out.filter((x) => x.length >= 3))].slice(0, 6);
}

/**
 * Token định danh của model — phải xuất hiện trong tên file ảnh.
 *
 * Ví dụ "MacBook Pro 16in M4 Pro" -> "macbook". Nếu không ràng buộc, truy vấn
 * "M4 Pro" sẽ khớp nhầm ảnh "POCO M4 Pro" (điện thoại Xiaomi).
 *
 * Trả về null nếu model không có token nào rõ ràng (vd chỉ có mã số).
 */
export function requiredToken(model: string): string | null {
  const words = model.replace(/["']/g, ' ').split(/\s+/).filter(Boolean);
  for (const w of words) {
    const lw = w.toLowerCase();
    if (MARKETING.has(lw) || STOP.has(lw)) continue;
    if (w.length < 3) continue;
    // Bỏ qua token là số thuần (không định danh).
    if (/^\d+$/.test(w)) continue;
    return lw;
  }
  return null;
}

/**
 * Điểm khớp giữa truy vấn và tên file.
 *
 * - `hit`      = số token truy vấn có trong tên file
 * - `coverage` = hit / tổng token truy vấn
 */
export function scoreMatch(
  query: string,
  fileTitle: string,
  required?: string | null,
): { score: number; hit: number; coverage: number } {
  const qTokens = tokenize(query);
  if (!qTokens.length) return { score: 0, hit: 0, coverage: 0 };
  const f = normTitle(fileTitle);
  const fTokens = new Set(tokenize(f));

  let hit = 0;
  for (const t of qTokens) if (fTokens.has(t)) hit++;

  const phrase = normTitle(query);
  const phraseHit = phrase.length >= 5 && f.includes(phrase);

  let score = hit * 3;
  if (phraseHit) score += 8;
  // Ảnh có nhiều token lạ -> trông không liên quan (vd: "Chinese model
  // holding a notebook computer").
  const extra = fTokens.size - hit;
  if (extra > 5) score -= 4;

  const coverage = qTokens.length ? hit / qTokens.length : 0;
  return { score, hit, coverage };
}

/** Tìm ứng viên ảnh trên Commons cho một model. */
export async function findCandidates(
  model: string,
  limit = 15,
): Promise<Candidate[]> {
  const seen = new Map<string, Candidate>();
  const req = requiredToken(model);

  for (const q of buildQueries(model)) {
    const d = await getJson(
      `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
        `&generator=search&gsrnamespace=6&gsrlimit=${limit}` +
        `&gsrsearch=${encodeURIComponent(`intitle:"${q}" filetype:bitmap`)}` +
        `&prop=imageinfo&iiprop=url|mime&iiurlwidth=1000`,
    );
    const pages = d?.query?.pages ?? {};
    for (const p of Object.values<any>(pages)) {
      const ii = (p.imageinfo ?? [])[0];
      if (!ii || !/^image\/(jpeg|png|webp)$/.test(String(ii.mime))) continue;
      const url = String(ii.thumburl ?? ii.url);
      const title = String(p.title ?? '').replace(/^File:/, '');
      // Ràng buộc token định danh: "MacBook Pro M4" không được khớp "POCO M4".
      if (req && !normTitle(title).includes(req)) continue;
      const { score, hit, coverage } = scoreMatch(q, title);
      if (hit < 1) continue;
      const file = (url.split('/').pop() ?? title).replace(/^\d+px-/, '');
      const prev = seen.get(file);
      if (!prev || prev.score < score) {
        seen.set(file, { file, url, title, score, hit, coverage, query: q });
      }
    }
  }

  return [...seen.values()].sort((a, b) => b.score - a.score).slice(0, limit);
}
