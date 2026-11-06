import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';
import { ProductGrid } from '../../../components/product/ProductGrid';
import { catalogApi } from '../../../services/api/catalog';
import { Icon } from '../../../components/common/Icon';
import type { Product, Store } from '../../../types';
import './ShopDetailPage.css';

export const ShopDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [shop, setShop] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'reviews' | 'about'>('products');

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const detail = await catalogApi.store(slug);
        if (cancelled) return;
        setShop(detail);
        setProducts(detail.products ?? []);
        setNotFound(false);
      } catch (err) {
        console.error('Load shop failed:', err);
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (notFound) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '80px 0' }}>
        <h2>Cửa hàng không tồn tại</h2>
        <Link to={ROUTES.SHOPS} className="btn btn-primary" style={{ marginTop: '24px' }}>Quay lại cửa hàng</Link>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '80px 0' }}>
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  const joinedYear = new Date(shop.createdAt).getFullYear();

  return (
    <div className="shop-detail-page">
      <div className="shop-detail-hero" style={{ backgroundImage: `url(${shop.banner ?? ''})` }}>
        <div className="shop-detail-hero__overlay" />
        <div className="container shop-detail-hero__content">
          <div className="shop-detail-hero__avatar">
            <img src={shop.avatar} alt={shop.name} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          </div>
          <div className="shop-detail-hero__info">
            <div className="shop-detail-hero__name-row">
              <h1 className="shop-detail-hero__name">{shop.name}</h1>
              {shop.isVerified && (
                <span className="shop-detail-hero__verified">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                  Đã xác minh
                </span>
              )}
            </div>
            {shop.tagline && <p className="shop-detail-hero__tagline">{shop.tagline}</p>}
            <div className="shop-detail-hero__stats">
              <span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--color-warning)" stroke="none">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
                {shop.rating} ({(shop.reviewCount ?? 0).toLocaleString()} đánh giá)
              </span>
              <span><Icon name="package" size={14} /> {shop.productCount} sản phẩm</span>
              <span><Icon name="map-pin" size={14} /> {shop.address}</span>
              <span><Icon name="users" size={14} /> {(shop.followerCount ?? 0).toLocaleString()} theo dõi</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="shop-detail-tabs">
          {(['products', 'reviews', 'about'] as const).map(tab => (
            <button
              key={tab}
              className={`shop-detail-tab ${activeTab === tab ? 'shop-detail-tab--active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'products' ? 'Sản phẩm' : tab === 'reviews' ? 'Đánh giá' : 'Giới thiệu'}
            </button>
          ))}
        </div>

        {activeTab === 'products' && (
          <div className="shop-detail-products">
            <ProductGrid products={products} viewMode="grid" loading={loading} />
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="shop-detail-reviews">
            <div className="shop-reviews-summary card">
              <div className="shop-reviews-summary__score">
                <span className="shop-reviews-summary__score-value">{shop.rating}</span>
                <span className="shop-reviews-summary__score-max">/5</span>
              </div>
              <div className="shop-reviews-summary__info">
                <p className="shop-reviews-summary__count">
                  Dựa trên {(shop.reviewCount ?? 0).toLocaleString()} đánh giá
                </p>
                <div className="shop-reviews-summary__bars">
                  {[5, 4, 3, 2, 1].map(star => (
                    <div key={star} className="shop-reviews-summary__bar-row">
                      <span>{star} ★</span>
                      <div className="shop-reviews-summary__bar">
                        <div className="shop-reviews-summary__bar-fill" style={{ width: star === 5 ? '85%' : star === 4 ? '10%' : star === 3 ? '3%' : '1%' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <p className="shop-detail-empty">Chưa có đánh giá nào được hiển thị.</p>
          </div>
        )}

        {activeTab === 'about' && (
          <div className="shop-detail-about">
            <div className="card shop-about-card">
              <h3 className="shop-about-card__title">Giới thiệu cửa hàng</h3>
              <p className="shop-about-card__desc">{shop.description}</p>
              <div className="shop-about-card__meta">
                <div className="shop-about-card__meta-item">
                  <span className="shop-about-card__meta-label">Tham gia</span>
                  <span className="shop-about-card__meta-value">{joinedYear}</span>
                </div>
                <div className="shop-about-card__meta-item">
                  <span className="shop-about-card__meta-label">Tỷ lệ phản hồi</span>
                  <span className="shop-about-card__meta-value">98%</span>
                </div>
                <div className="shop-about-card__meta-item">
                  <span className="shop-about-card__meta-label">Thời gian phản hồi</span>
                  <span className="shop-about-card__meta-value">Trong vài phút</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
