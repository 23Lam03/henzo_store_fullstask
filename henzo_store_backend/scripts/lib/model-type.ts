/**
 * Suy LOẠI sản phẩm từ tên model / danh mục — nguồn chuẩn dùng chung.
 *
 * ⚠️  Danh mục "Điện thoại" chứa CẢ tablet (iPad, Galaxy Tab), còn
 *     "PC Gaming" chứa cả linh kiện rời (SSD, RAM, PSU...). Lọc ảnh theo
 *     danh mục sẽ loại nhầm — ví dụ ảnh tablet bị coi là ảnh điện thoại.
 *     Vì vậy tablet được tách riêng trước.
 */

/** Loại sản phẩm chuẩn (trùng với key trong `type-image-pools.json`). */
export type ProductType =
  | 'Điện thoại'
  | 'Tablet'
  | 'Laptop'
  | 'Màn hình'
  | 'PC Gaming'
  | 'Chuột'
  | 'Bàn phím'
  | 'Tai nghe'
  | 'Phụ kiện';

const CATEGORY_TO_TYPE: Record<string, ProductType> = {
  'Điện thoại': 'Điện thoại',
  Laptop: 'Laptop',
  'Màn hình': 'Màn hình',
  'PC Gaming': 'PC Gaming',
  Chuột: 'Chuột',
  'Bàn phím': 'Bàn phím',
  'Tai nghe': 'Tai nghe',
  'Phụ kiện': 'Phụ kiện',
};

/**
 * Loại sản phẩm của 1 model.
 *
 * Ưu tiên danh mục trong DB (đáng tin cậy), nhưng tách tablet ra vì danh mục
 * "Điện thoại" lẫn tablet.
 *
 * Danh mục "Phụ kiện" gộp nhiều loại thật (bàn phím, webcam, mic, sạc...),
 * nên với danh mục này ta suy loại từ TÊN MODEL — nếu không, ảnh bàn phím
 * của sản phẩm "Phụ kiện" sẽ bị coi là sai loại.
 */
export function modelType(
  modelName: string,
  categoryName: string,
): ProductType {
  const m = modelName.toLowerCase();

  // ── Loại suy được từ tên model (đáng tin cậy hơn danh mục "Phụ kiện") ──
  if (/ipad|galaxy tab|tablet|matepad|xiaomi pad/.test(m)) return 'Tablet';
  if (/webcam|web cam|camera\b|c920|brio\b|streamcam/.test(m)) return 'Phụ kiện';
  if (/keyboard|bàn phím|keychron|k70|hhkb|mx keys|blackwidow|huntsman|azoth|vulcan|ducky|thinkpad.*keyboard|trackpoint/.test(m))
    return 'Bàn phím';
  if (/mouse|chuột|\bhm\b/.test(m)) return 'Chuột';
  if (/headset|headphone|tai nghe|airpods|wh-1000|wf-1000|quietcomfort|arctis|cloud (ii|iii|alpha)|hs60|hs80/.test(m))
    return 'Tai nghe';

  return CATEGORY_TO_TYPE[categoryName] ?? 'Phụ kiện';
}
