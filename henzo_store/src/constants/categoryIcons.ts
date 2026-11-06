import type { IconName } from '../components/common/Icon';

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

export const getCategoryIcon = (slug?: string): IconName =>
  (slug && CATEGORY_ICONS[slug]) || DEFAULT_CATEGORY_ICON;
