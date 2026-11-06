import { Link } from 'react-router-dom';
import { useWishlist, useCart } from '../../../contexts';
import { ROUTES } from '../../../constants/routes';
import './WishlistPage.css';

const fmt = (p: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(p);

export const WishlistPage = () => {
  const { items, removeItem } = useWishlist();
  const { addItem } = useCart();

  if (items.length === 0) {
    return (
      <div className="wishlist-page wishlist-page--empty">
        <div className="wishlist-empty">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          <h2>Danh sách yêu thích trống</h2>
          <p>Hãy thêm sản phẩm bạn thích vào danh sách yêu thích.</p>
          <Link to={ROUTES.PRODUCTS} className="btn btn-primary btn-lg">Khám phá sản phẩm</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="wishlist-page">
      <div className="container">
        <h1 className="wishlist-page__title">Danh sách yêu thích ({items.length})</h1>

        <div className="wishlist-grid">
          {items.map(item => (
            <div key={item.product.id} className="wishlist-item card">
              <Link to={`/products/${item.product.slug}`} className="wishlist-item__image">
                <img src={item.product.images[0]} alt={item.product.name} loading="lazy" />
                {item.product.discount > 0 && (
                  <span className="wishlist-item__badge">-{item.product.discount}%</span>
                )}
              </Link>

              <div className="wishlist-item__info">
                <span className="wishlist-item__brand">{item.product.brand}</span>
                <Link to={`/products/${item.product.slug}`} className="wishlist-item__name">
                  {item.product.name}
                </Link>

                <div className="wishlist-item__rating">
                  {[1,2,3,4,5].map(s => (
                    <span key={s} className={s <= Math.round(item.product.rating) ? 'star filled' : 'star'}>★</span>
                  ))}
                  <span className="wishlist-item__rating-num">({item.product.rating.toFixed(1)})</span>
                </div>

                <div className="wishlist-item__price">
                  {item.product.discount > 0 && (
                    <span className="price-original">{fmt(item.product.originalPrice)}</span>
                  )}
                  <span className="price-current">{fmt(item.product.price)}</span>
                </div>

                <div className="wishlist-item__actions">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      addItem(item.product, 1);
                      removeItem(item.product.id);
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                    </svg>
                    Thêm vào giỏ
                  </button>
                  <button className="wishlist-item__remove" onClick={() => removeItem(item.product.id)}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
