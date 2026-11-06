
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

export function modelType(
  modelName: string,
  categoryName: string,
): ProductType {
  const m = modelName.toLowerCase();

  if (/ipad|galaxy tab|tablet|matepad|xiaomi pad/.test(m)) return 'Tablet';
  if (/webcam|web cam|camera\b|c920|brio\b|streamcam/.test(m)) return 'Phụ kiện';
  if (/keyboard|bàn phím|keychron|k70|hhkb|mx keys|blackwidow|huntsman|azoth|vulcan|ducky|thinkpad.*keyboard|trackpoint/.test(m))
    return 'Bàn phím';
  if (/mouse|chuột|\bhm\b/.test(m)) return 'Chuột';
  if (/headset|headphone|tai nghe|airpods|wh-1000|wf-1000|quietcomfort|arctis|cloud (ii|iii|alpha)|hs60|hs80/.test(m))
    return 'Tai nghe';

  return CATEGORY_TO_TYPE[categoryName] ?? 'Phụ kiện';
}
