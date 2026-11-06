import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';
import { catalogApi } from '../../../services/api/catalog';
import type { Brand } from '../../../types';
import './BrandsPage.css';

const FALLBACK_BRANDS: Brand[] = [
  { id: 'apple', name: 'Apple', slug: 'apple', logo: '', productCount: 0, color: '#1d1d1f' },
  { id: 'samsung', name: 'Samsung', slug: 'samsung', logo: '', productCount: 0, color: '#1428A0' },
  { id: 'asus', name: 'ASUS', slug: 'asus', logo: '', productCount: 0, color: '#0057B8' },
  { id: 'msi', name: 'MSI', slug: 'msi', logo: '', productCount: 0, color: '#E3001B' },
  { id: 'logitech', name: 'Logitech', slug: 'logitech', logo: '', productCount: 0, color: '#00B8FC' },
  { id: 'sony', name: 'Sony', slug: 'sony', logo: '', productCount: 0, color: '#0066CC' },
  { id: 'razer', name: 'Razer', slug: 'razer', logo: '', productCount: 0, color: '#00FF00' },
  { id: 'xiaomi', name: 'Xiaomi', slug: 'xiaomi', logo: '', productCount: 0, color: '#FF6900' },
  { id: 'oppo', name: 'OPPO', slug: 'oppo', logo: '', productCount: 0, color: '#00A056' },
  { id: 'acer', name: 'Acer', slug: 'acer', logo: '', productCount: 0, color: '#004B8D' },
  { id: 'huawei', name: 'Huawei', slug: 'huawei', logo: '', productCount: 0, color: '#CF0A2C' },
  { id: 'corsair', name: 'Corsair', slug: 'corsair', logo: '', productCount: 0, color: '#FFD200' },
];

export const BrandsPage = () => {
  const [brands, setBrands] = useState<Brand[]>(FALLBACK_BRANDS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await catalogApi.brands();
        if (!cancelled && Array.isArray(res) && res.length > 0) setBrands(res);
      } catch (err) {
        console.error('Load brands failed:', err);
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
    <div className="brands-page container">
      <div className="page-header">
        <h1 className="page-header__title">Thương hiệu nổi bật</h1>
        <p className="page-header__subtitle">Khám phá sản phẩm từ các thương hiệu công nghệ hàng đầu thế giới</p>
      </div>

      {loading ? (
        <div className="brands-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="brand-card brand-card--skeleton" />
          ))}
        </div>
      ) : (
        <div className="brands-grid">
          {brands.map(brand => (
            <Link
              key={brand.id || brand.slug}
              to={`${ROUTES.BRAND_DETAIL.replace(':slug', brand.slug)}`}
              className="brand-card"
            >
              <div
                className="brand-card__banner"
                style={brand.banner ? { backgroundImage: `url(${brand.banner})` } : undefined}
              >
                <div className="brand-card__overlay" style={{ '--brand-color': brand.color } as React.CSSProperties} />
                <div className="brand-card__logo-area">
                  {brand.logo && (
                    <img
                      src={brand.logo}
                      alt={brand.name}
                      className="brand-card__logo"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                </div>
              </div>
              <div className="brand-card__body">
                <h3 className="brand-card__name">{brand.name}</h3>
                {brand.tagline && <p className="brand-card__tagline">{brand.tagline}</p>}
                <span className="brand-card__count">{brand.productCount} sản phẩm</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
