import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';
import { catalogApi } from '../../../services/api/catalog';
import { getCategoryIcon } from '../../../constants/categoryIcons';
import { Icon } from '../../../components/common/Icon';
import type { ProductCategory } from '../../../types';
import './CategoriesPage.css';

export const CategoriesPage = () => {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await catalogApi.categories();
        if (!cancelled && Array.isArray(res)) setCategories(res);
      } catch (err) {
        console.error('Load categories failed:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="categories-page">
      <div className="page-header">
        <div className="container">
          <h1 className="page-header__title">Danh mục sản phẩm</h1>
          <p className="page-header__desc">
            Chọn danh mục để khám phá {categories.length} nhóm sản phẩm công nghệ chính hãng
          </p>
        </div>
      </div>

      <div className="container">
        {loading ? (
          <div className="categories-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="category-card category-card--skeleton" />
            ))}
          </div>
        ) : (
          <div className="categories-grid">
            {categories.map(cat => (
              <Link
                key={cat.id || cat.slug}
                to={`${ROUTES.CATEGORY_DETAIL.replace(':slug', cat.slug)}`}
                className="category-card"
              >
                <div
                  className="category-card__image"
                  style={cat.banner ? { backgroundImage: `url(${cat.banner})` } : undefined}
                >
                  <div className="category-card__overlay">
                    <div className="category-card__icon">
                      <Icon name={getCategoryIcon(cat.slug)} size={34} />
                    </div>
                  </div>
                </div>
                <div className="category-card__body">
                  <h3 className="category-card__name">{cat.name}</h3>
                  {cat.description && <p className="category-card__desc">{cat.description}</p>}
                  <span className="category-card__count">{cat.productCount} sản phẩm</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
