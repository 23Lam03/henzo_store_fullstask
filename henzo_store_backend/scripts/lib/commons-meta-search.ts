/**
 * TÌM ẢNH FALLBACK CHO MODEL CHƯA CÓ ẢNH RIÊNG — DÙNG METADATA COMMONS.
 *
 * Với các model 2024-2026 chưa có ảnh riêng trên Commons, ta tìm ảnh CÙNG
 * HÃNG + CÙNG LOẠI. Để chắc chắn ảnh đúng hãng/đúng dòng sản phẩm (vì tên
 * file Commons thường không chứa tên hãng, vd "ST100VoidPro" là tai nghe
 * Corsair), ta đọc thêm `extmetadata` (ImageDescription/Categories) rồi
 * chấm điểm theo nội dung đó.
 */
import { getJson } from '../lib/commons-files';
import { normalizeFileTitle, tokenize } from '../lib/image-match';

export interface MetaCandidate {
  file: string;
  url: string;
  title: string;
  description: string;
  score: number;
  matched: string[];
}

/** Ảnh không dùng được làm ảnh sản phẩm. */
const BAD =
  /\b(shop|store|mall|market|street|banner|poster|logo|chart|graph|diagram|map|comparison|versus|people|person|hand|hands|woman|man\b|boy|girl|protest|meeting|conference|booth|package|unboxing|manual|instruction|advertis|crowd|panorama|landscape|building|room|office|workshop|repairer|technician|todd|child|model\b|fashion|modeling|actress|actor|politician|president)\b/i;

/**
 * Tên file chứa từ không liên quan tới sản phẩm (người, địa danh, sự kiện).
 * Commons có rất nhiều ảnh "Con người tên là Corsair/Logitech/Acer" — loại hết.
 */
const NAME_SUSPECT =
  /\b(todd|person|woman|man|girl|boy|child|people|crowd|street|paseo|cahul|pascua|nagoya|shenzhen|mongkok|zai|nie|grand|opening|mall|stand|booth|assembly|ceremony|parade|protest|fashion|runway|model|modeling|promo|price|bangladesh|sales|discount|deal|shop sign)\b/i;

const stripHtml = (s: string): string =>
  s
    .replace(/<[^>]*>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** Trích xuất text mô tả từ extmetadata của Commons. */
function describe(page: any): string {
  const meta = page?.imageinfo?.[0]?.extmetadata ?? {};
  const parts = [
    stripHtml(String(meta.ImageDescription?.value ?? '')),
    stripHtml(String(meta.ObjectName?.value ?? '')),
    stripHtml(String(meta.Categories?.value ?? '')),
    stripHtml(String(meta.Credit?.value ?? '')),
  ];
  return parts.join(' ').toLowerCase();
}

/**
 * Chấm điểm ứng viên theo:
 *  - brand phải xuất hiện trong TÊN FILE (bắt buộc) — tránh ảnh của người
 *    trùng tên hãng (vd "Thelma Todd in Corsair").
 *  - các token định danh của model xuất hiện -> ảnh đúng dòng.
 *  - tên file gọn (ảnh sản phẩm chụp riêng).
 */
export function scoreMeta(
  title: string,
  description: string,
  brand: string,
  modelTokens: string[],
): { score: number; matched: string[] } {
  if (BAD.test(title) || NAME_SUSPECT.test(title)) return { score: 0, matched: [] };
  const t = normalizeFileTitle(title);
  const d = description;

  // BẮT BUỘC: brand nằm trong tên file.
  const brandLower = brand.toLowerCase().trim();
  const brandTokens = tokenize(brand);
  const hasBrandInTitle =
    t.includes(brandLower) || brandTokens.some((b) => t.includes(b));
  if (!hasBrandInTitle) return { score: 0, matched: [] };

  let score = 8;
  const matched: string[] = [];

  // Token định danh của model xuất hiện -> ảnh đúng dòng.
  for (const tok of modelTokens) {
    if (tok.length < 3) continue;
    if (t.includes(tok)) {
      score += 7;
      matched.push(tok);
    } else if (d.includes(tok)) {
      score += 2;
      matched.push(tok);
    }
  }

  // Tên file gọn -> nhiều khả năng là ảnh chụp sản phẩm.
  const words = t.split(' ').filter(Boolean).length;
  if (words <= 5) score += 4;
  else if (words > 12) score -= 4;

  return { score, matched };
}

/** Tìm ứng viên theo truy vấn từ khoá, có đọc extmetadata. */
export async function searchWithMeta(
  query: string,
  limit = 12,
): Promise<MetaCandidate[]> {
  const d = await getJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
      `&generator=search&gsrnamespace=6&gsrlimit=${limit}` +
      `&gsrsearch=${encodeURIComponent(query)}` +
      `&prop=imageinfo&iiprop=url|mime|extmetadata&iiurlwidth=1000&iiextmetadatafilter=ImageDescription|ObjectName|Categories|Credit`,
  );
  const out: MetaCandidate[] = [];
  const seen = new Set<string>();
  for (const page of Object.values<any>(d?.query?.pages ?? {})) {
    const ii = (page.imageinfo ?? [])[0];
    if (!ii || !/^image\/(jpeg|png|webp)$/.test(String(ii.mime))) continue;
    const url = String(ii.thumburl ?? ii.url);
    const title = String(page.title ?? '').replace(/^File:/, '');
    const file = (url.split('/').pop() ?? title).replace(/^\d+px-/, '');
    if (seen.has(file)) continue;
    seen.add(file);
    out.push({
      file,
      url,
      title,
      description: describe(page),
      score: 0,
      matched: [],
    });
  }
  return out;
}
