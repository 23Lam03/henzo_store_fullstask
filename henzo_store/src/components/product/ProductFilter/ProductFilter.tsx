import { useState } from 'react';
import { Icon, type IconName } from '../../common/Icon';
import './ProductFilter.css';

interface FilterState {
  brands: string[];
  categories: string[];
  priceRange: [number, number];
  rating: number;
  inStock: boolean;
  hasDiscount: boolean;
}

interface ProductFilterProps {
  brands: { name: string; count: number }[];
  categories: { name: string; slug: string; count: number }[];
  onFilterChange: (filters: FilterState) => void;
  onReset: () => void;
}

const MAX_PRICE = 200000000;

const SECTIONS: { key: string; title: string; icon: IconName }[] = [
  { key: 'category', title: 'Danh mục', icon: 'grid' },
  { key: 'brand', title: 'Thương hiệu', icon: 'store' },
  { key: 'price', title: 'Khoảng giá', icon: 'wallet' },
  { key: 'rating', title: 'Đánh giá', icon: 'star' },
  { key: 'other', title: 'Lựa chọn khác', icon: 'settings' },
];

const PRICE_RANGES = [
  { label: 'Tất cả mức giá', min: 0, max: MAX_PRICE },
  { label: 'Dưới 5 triệu', min: 0, max: 5000000 },
  { label: '5 – 15 triệu', min: 5000000, max: 15000000 },
  { label: '15 – 30 triệu', min: 15000000, max: 30000000 },
  { label: '30 – 50 triệu', min: 30000000, max: 50000000 },
  { label: 'Trên 50 triệu', min: 50000000, max: MAX_PRICE },
];

export const ProductFilter = ({ brands, categories, onFilterChange, onReset }: ProductFilterProps) => {
  const [filters, setFilters] = useState<FilterState>({
    brands: [],
    categories: [],
    priceRange: [0, MAX_PRICE],
    rating: 0,
    inStock: false,
    hasDiscount: false,
  });

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const applyFilters = (newFilters: FilterState) => {
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const toggleBrand = (brand: string) => {
    const next = filters.brands.includes(brand)
      ? filters.brands.filter(b => b !== brand)
      : [...filters.brands, brand];
    applyFilters({ ...filters, brands: next });
  };

  const toggleCategory = (slug: string) => {
    const next = filters.categories.includes(slug)
      ? filters.categories.filter(c => c !== slug)
      : [...filters.categories, slug];
    applyFilters({ ...filters, categories: next });
  };

  const activeCount =
    filters.brands.length +
    filters.categories.length +
    (filters.priceRange[0] !== 0 || filters.priceRange[1] !== MAX_PRICE ? 1 : 0) +
    (filters.rating > 0 ? 1 : 0) +
    (filters.inStock ? 1 : 0) +
    (filters.hasDiscount ? 1 : 0);

  const toggleSection = (key: string) => {
    setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const resetAll = () => {
    setFilters({ brands: [], categories: [], priceRange: [0, MAX_PRICE], rating: 0, inStock: false, hasDiscount: false });
    onReset();
  };

  const renderSection = (
    key: string,
    body: React.ReactNode,
  ) => {
    const section = SECTIONS.find(s => s.key === key)!;
    const isCollapsed = collapsed[key];
    return (
      <section key={key} className="product-filter__section">
        <button
          type="button"
          className={`product-filter__section-header ${isCollapsed ? 'is-collapsed' : ''}`}
          onClick={() => toggleSection(key)}
          aria-expanded={!isCollapsed}
        >
          <span className="product-filter__section-title">
            <Icon name={section.icon} size={15} />
            {section.title}
          </span>
          <Icon name="chevron-down" size={15} className="product-filter__chevron" />
        </button>
        <div className={`product-filter__section-body ${isCollapsed ? 'is-collapsed' : ''}`}>{body}</div>
      </section>
    );
  };

  return (
    <aside className="product-filter">
      <div className="product-filter__header">
        <h3 className="product-filter__title">
          <Icon name="filter" size={17} />
          Bộ lọc
          {activeCount > 0 && <span className="product-filter__active-badge">{activeCount}</span>}
        </h3>
        {activeCount > 0 && (
          <button type="button" className="product-filter__reset" onClick={resetAll}>
            Đặt lại
          </button>
        )}
      </div>

      {renderSection(
        'category',
        <div className="product-filter__list">
          {categories.map(cat => (
            <label
              key={cat.slug}
              className={`product-filter__item ${filters.categories.includes(cat.slug) ? 'is-active' : ''}`}
            >
              <input
                type="checkbox"
                className="product-filter__checkbox"
                checked={filters.categories.includes(cat.slug)}
                onChange={() => toggleCategory(cat.slug)}
              />
              <span className="product-filter__mark">
                <Icon name="check" size={12} strokeWidth={3} />
              </span>
              <span className="product-filter__label">{cat.name}</span>
            </label>
          ))}
        </div>,
      )}

      {renderSection(
        'brand',
        <div className="product-filter__list">
          {brands.map(brand => (
            <label
              key={brand.name}
              className={`product-filter__item ${filters.brands.includes(brand.name) ? 'is-active' : ''}`}
            >
              <input
                type="checkbox"
                className="product-filter__checkbox"
                checked={filters.brands.includes(brand.name)}
                onChange={() => toggleBrand(brand.name)}
              />
              <span className="product-filter__mark">
                <Icon name="check" size={12} strokeWidth={3} />
              </span>
              <span className="product-filter__label">{brand.name}</span>
              <span className="product-filter__count">{brand.count}</span>
            </label>
          ))}
        </div>,
      )}

      {renderSection(
        'price',
        <div className="product-filter__price-list">
          {PRICE_RANGES.map(pr => {
            const selected = filters.priceRange[0] === pr.min && filters.priceRange[1] === pr.max;
            return (
              <button
                key={pr.label}
                type="button"
                className={`product-filter__price-btn ${selected ? 'is-active' : ''}`}
                onClick={() => applyFilters({ ...filters, priceRange: [pr.min, pr.max] })}
              >
                {pr.label}
              </button>
            );
          })}
        </div>,
      )}

      {renderSection(
        'rating',
        <div className="product-filter__rating-list">
          {[4, 3, 2, 1].map(stars => (
            <label
              key={stars}
              className={`product-filter__rating-item ${filters.rating === stars ? 'is-active' : ''}`}
            >
              <input
                type="radio"
                className="product-filter__radio"
                name="rating-filter"
                checked={filters.rating === stars}
                onChange={() => applyFilters({ ...filters, rating: filters.rating === stars ? 0 : stars })}
              />
              <span className="product-filter__radio-mark" />
              <span className="product-filter__stars">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Icon key={i} name="star" size={13} className={i < stars ? 'is-filled' : 'is-empty'} />
                ))}
              </span>
              <span className="product-filter__rating-text">Từ {stars} sao</span>
            </label>
          ))}
        </div>,
      )}

      {renderSection(
        'other',
        <div className="product-filter__toggles">
          <label className={`product-filter__toggle-item ${filters.inStock ? 'is-active' : ''}`}>
            <input
              type="checkbox"
              className="product-filter__toggle"
              checked={filters.inStock}
              onChange={() => applyFilters({ ...filters, inStock: !filters.inStock })}
            />
            <span className="product-filter__toggle-track"><span className="product-filter__toggle-thumb" /></span>
            <span>Chỉ hiển thị sản phẩm còn hàng</span>
          </label>
          <label className={`product-filter__toggle-item ${filters.hasDiscount ? 'is-active' : ''}`}>
            <input
              type="checkbox"
              className="product-filter__toggle"
              checked={filters.hasDiscount}
              onChange={() => applyFilters({ ...filters, hasDiscount: !filters.hasDiscount })}
            />
            <span className="product-filter__toggle-track"><span className="product-filter__toggle-thumb" /></span>
            <span>Chỉ hiển thị sản phẩm giảm giá</span>
          </label>
        </div>,
      )}
    </aside>
  );
};
