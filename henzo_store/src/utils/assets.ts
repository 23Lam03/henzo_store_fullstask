const BASE = import.meta.env.BASE_URL || '/';

export const assetUrl = (path: string): string => {
  const clean = path.replace(/^\/+/, '');
  return `${BASE}${clean}`;
};

export const bannerUrl = (file: string): string => assetUrl(`images/banners/${file}`);
