import { Link, useLocation } from 'react-router-dom';
import './Breadcrumb.css';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  customItems?: BreadcrumbItem[];
}

export const Breadcrumb = ({ items, customItems }: BreadcrumbProps) => {
  const location = useLocation();

  const getAutoBreadcrumb = (): BreadcrumbItem[] => {
    const paths = location.pathname.split('/').filter(Boolean);
    return paths.map((path, index) => {
      const href = '/' + paths.slice(0, index + 1).join('/');
      const label = path
        .replace(/-/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
      return { label, href };
    });
  };

  const breadcrumbItems = customItems || items || getAutoBreadcrumb();

  const showHome = !breadcrumbItems.some(
    item => item.label.toLowerCase() === 'trang chủ'
  );

  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      <ol className="breadcrumb__list">
        {showHome && (
          <li className="breadcrumb__item">
            <Link to="/" className="breadcrumb__link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              <span className="hide-mobile">Trang chủ</span>
            </Link>
          </li>
        )}
        {breadcrumbItems.map((item, index) => (
          <li key={index} className="breadcrumb__item breadcrumb__item--separator">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
            {item.href && index < breadcrumbItems.length - 1 ? (
              <Link to={item.href} className="breadcrumb__link">{item.label}</Link>
            ) : (
              <span className="breadcrumb__current">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};
