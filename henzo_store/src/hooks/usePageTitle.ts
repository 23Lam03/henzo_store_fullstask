import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { APP_NAME, PAGE_TITLES } from '../constants/routes';

const NOT_FOUND_TITLE = '404 - Không Tìm Thấy';
const FORBIDDEN_TITLE = '403 - Không Có Quyền Truy Cập';

const getPageTitle = (pathname: string): string => {

  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];

  const patterns: Array<{ pattern: RegExp; titleKey: string }> = [
    { pattern: /^\/products\/[^/]+$/, titleKey: '/products/:slug' },
    { pattern: /^\/categories\/[^/]+$/, titleKey: '/categories/:slug' },
    { pattern: /^\/brands\/[^/]+$/, titleKey: '/brands/:slug' },
    { pattern: /^\/blogs\/[^/]+$/, titleKey: '/blogs/:slug' },
    { pattern: /^\/shops\/[^/]+$/, titleKey: '/shops/:slug' },
    { pattern: /^\/orders\/[^/]+$/, titleKey: '/orders/:id' },
    { pattern: /^\/seller\/products\/edit\/[^/]+$/, titleKey: '/shop/products/edit/:id' },
    { pattern: /^\/seller\/products\/[^/]+$/, titleKey: '/shop/products' },
    { pattern: /^\/admin\/products\/edit\/[^/]+$/, titleKey: '/admin/products/edit/:id' },
  ];

  for (const { pattern, titleKey } of patterns) {
    if (pattern.test(pathname)) {
      return PAGE_TITLES[titleKey] || pathname;
    }
  }

  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return 'Trang Chủ';
  return segments
    .join(' / ')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
};

export const usePageTitle = () => {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    let title = getPageTitle(path);

    if (path === '/404' || path === '*') title = NOT_FOUND_TITLE;
    if (path === '/403') title = FORBIDDEN_TITLE;

    document.title = `${title} | ${APP_NAME}`;
  }, [location.pathname]);
};
