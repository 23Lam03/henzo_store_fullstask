import { Link } from 'react-router-dom';
import type { RefObject } from 'react';
import './MegaMenu.css';

interface MegaMenuProps {
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    icon: string;
    featured?: boolean;
    children?: Array<{ id: string; name: string; slug: string; icon?: string }>;
  }>;
  onClose: () => void;
  innerRef?: RefObject<HTMLDivElement | null>;
}

const categoryIcons: Record<string, string> = {
  laptop: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
  smartphone: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12" y2="18"/></svg>`,
  tablet: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="12" y1="18" x2="12" y2="18"/></svg>`,
  headphones: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>`,
  watch: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="7"/><polyline points="12 9 12 12 13.5 13.5"/><path d="M16.51 17.35l-.35 3.83a2 2 0 0 1-2 1.82H9.83a2 2 0 0 1-2-1.82l-.35-3.83m.01-10.7.35-3.83A2 2 0 0 1 9.83 1h4.35a2 2 0 0 1 2 1.82l.35 3.83"/></svg>`,
  monitor: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
  camera: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>`,
  default: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>`,
};

export const MegaMenu = ({ categories, onClose, innerRef }: MegaMenuProps) => {
  return (
    <div className="mega-menu" ref={innerRef} onMouseLeave={onClose}>
      <div className="mega-menu__inner">
        <div className="mega-menu__categories">
          {categories.map(category => (
            <Link
              key={category.id}
              to={`/products?category=${category.slug}`}
              className="mega-menu__category"
              onClick={onClose}
            >
              <span
                className="mega-menu__category-icon"
                dangerouslySetInnerHTML={{ __html: categoryIcons[category.icon] || categoryIcons.default }}
              />
              <span className="mega-menu__category-name">{category.name}</span>
              {category.children && category.children.length > 0 && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              )}
            </Link>
          ))}
        </div>
        <div className="mega-menu__featured">
          <h4 className="mega-menu__featured-title">Danh Mục Nổi Bật</h4>
          <div className="mega-menu__featured-grid">
            {categories.filter(c => c.featured).map(category => (
              <Link
                key={category.id}
                to={`/products?category=${category.slug}`}
                className="mega-menu__featured-item"
                onClick={onClose}
              >
                <span
                  className="mega-menu__featured-icon"
                  dangerouslySetInnerHTML={{ __html: categoryIcons[category.icon] || categoryIcons.default }}
                />
                <span>{category.name}</span>
                {category.children && category.children.length > 0 && (
                  <p className="mega-menu__featured-count">{category.children.length} danh mục</p>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
