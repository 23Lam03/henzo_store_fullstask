import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';
import { catalogApi } from '../../../services/api/catalog';
import { Icon } from '../../../components/common/Icon';
import type { Store } from '../../../types';
import './ShopPage.css';

export const ShopPage = () => {
  const [shops, setShops] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await catalogApi.stores({ pageSize: 50 });
        if (!cancelled && Array.isArray(res)) setShops(res);
      } catch (err) {
        console.error('Load stores failed:', err);
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
    <div className="shop-page container">
      <div className="page-header">
        <h1 className="page-header__title">Cửa hàng</h1>
        <p className="page-header__subtitle">Khám phá các cửa hàng uy tín trên HenzoStore</p>
      </div>

      {loading ? (
        <div className="shops-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="shop-card shop-card--skeleton" />
          ))}
        </div>
      ) : (
        <div className="shops-grid">
          {shops.map(shop => (
            <Link
              key={shop.id || shop.slug}
              to={`${ROUTES.SHOP_DETAIL.replace(':slug', shop.slug ?? shop.id)}`}
              className="shop-card"
            >
              <div
                className="shop-card__banner"
                style={shop.banner ? { backgroundImage: `url(${shop.banner})` } : undefined}
              >
                <div className="shop-card__overlay" />
                <div className="shop-card__avatar">
                  {shop.avatar && (
                    <img
                      src={shop.avatar}
                      alt={shop.name}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                </div>
                {shop.isVerified && (
                  <span className="shop-card__verified">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                    Đã xác minh
                  </span>
                )}
              </div>
              <div className="shop-card__body">
                <div className="shop-card__header">
                  <h3 className="shop-card__name">{shop.name}</h3>
                  <span className="shop-card__rating">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--color-warning)" stroke="none">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    {shop.rating}
                    <span>({(shop.reviewCount ?? 0).toLocaleString()})</span>
                  </span>
                </div>
                {shop.tagline && <p className="shop-card__tagline">{shop.tagline}</p>}
                <div className="shop-card__meta">
                  <span><Icon name="package" size={14} /> {shop.productCount} sản phẩm</span>
                  <span><Icon name="map-pin" size={14} /> {shop.address}</span>
                  <span><Icon name="calendar" size={14} /> Tham gia {new Date(shop.createdAt).getFullYear()}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
