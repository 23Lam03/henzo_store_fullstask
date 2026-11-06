/**
 * URL helper cho asset tĩnh.
 *
 * Vite được cấu hình với `base: '/henzo_store/'`, nên đường dẫn tuyệt đối
 * `/images/...` sẽ không resolve đúng khi app được deploy dưới sub-path.
 * Hàm này gắn BASE_URL một cách an toàn.
 */
const BASE = import.meta.env.BASE_URL || '/';

/** Trả về đường dẫn đầy đủ cho asset nằm trong thư mục `public/`. */
export const assetUrl = (path: string): string => {
  const clean = path.replace(/^\/+/, '');
  return `${BASE}${clean}`;
};

/** Đường dẫn ảnh banner dùng ở trang chủ. */
export const bannerUrl = (file: string): string => assetUrl(`images/banners/${file}`);
