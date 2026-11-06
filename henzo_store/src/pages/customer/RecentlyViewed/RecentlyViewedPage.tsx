import { Link } from 'react-router-dom';
import { useRecentlyViewed } from '../../../contexts';
import { ROUTES } from '../../../constants/routes';
import './RecentlyViewedPage.css';

const fmt = (p: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(p);

export const RecentlyViewedPage = () => {
  const { items, removeItem, clearAll } = useRecentlyViewed();

  if (items.length === 0) {
    return (
      <div className="recently-page recently-page--empty">
        <div className="recently-empty">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          <h2>Chưa có sản phẩm đã xem</h2>
          <p>Hãy khám phá và xem chi tiết các sản phẩm để lưu lịch sử xem.</p>
          <Link to={ROUTES.PRODUCTS} className="btn btn-primary btn-lg">Khám phá sản phẩm</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="recently-page">
      <div className="container">
        <div className="recently-page__header">
          <h1 className="recently-page__title">Sản phẩm đã xem gần đây ({items.length})</h1>
          <button className="btn btn-ghost btn-sm" onClick={clearAll}>Xóa tất cả</button>
        </div>

        <div className="recently-grid">
          {items.map(item => (
            <div key={item.id} className="recently-item card">
              <button className="recently-item__remove" onClick={() => removeItem(item.id)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
              <Link to={`/products/${item.slug}`} className="recently-item__image">
                <img src={item.images[0]} alt={item.name} loading="lazy" />
              </Link>
              <div className="recently-item__info">
                <span className="recently-item__brand">{item.brand}</span>
                <Link to={`/products/${item.slug}`} className="recently-item__name">{item.name}</Link>
                <div className="recently-item__rating">
                  {[1,2,3,4,5].map(s => (
                    <span key={s} className={s <= Math.round(item.rating) ? 'star filled' : 'star'}>★</span>
                  ))}
                  <span className="recently-item__rating-num">({item.rating})</span>
                </div>
                <div className="recently-item__price">
                  <span className="price-current">{fmt(item.price)}</span>
                  {item.discount > 0 && <span className="price-original">{fmt(item.originalPrice)}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
