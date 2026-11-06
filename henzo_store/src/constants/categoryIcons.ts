import type { IconName } from '../components/common/Icon';

/**
 * Icon SVG cho từng danh mục sản phẩm.
 *
 * Dùng chung cho HomePage, CategoriesPage, CategoryPage và các menu để
 * danh mục luôn hiển thị cùng một bộ icon (không phụ thuộc emoji từ API).
 */
export const CATEGORY_ICONS: Record<string, IconName> = {
  'dien-thoai': 'phone',
  'dong-ho': 'clock',
  laptop: 'laptop',
  'pc-gaming': 'desktop',
  'man-hinh': 'monitor',
  chuot: 'mouse',
  'ban-phim': 'keyboard',
  'tai-nghe': 'headphones',
  'phu-kien': 'plug',
  camera: 'monitor',
  'may-anh': 'monitor',
  'loa': 'headphones',
  'may-tinh': 'desktop',
  'tablet': 'monitor',
  'smart-watch': 'clock',
  'thiet-bi-am-thanh': 'headphones',
  'gaming': 'flash',
  'phu-kien-gaming': 'plug',
};

export const DEFAULT_CATEGORY_ICON: IconName = 'package';

/** Lấy icon theo slug danh mục, fallback về icon chung. */
export const getCategoryIcon = (slug?: string): IconName =>
  (slug && CATEGORY_ICONS[slug]) || DEFAULT_CATEGORY_ICON;
