import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Breadcrumb } from '../../../components/breadcrumb';
import { BackToTop } from '../../../components/common/BackToTop';
import { Icon } from '../../../components/common/Icon';
import { ProductGallery } from '../../../components/product/ProductGallery';
import { ProductSpecification } from '../../../components/product/ProductSpecification';
import { ProductReview } from '../../../components/product/ProductReview';
import { ProductCard } from '../../../components/common/ProductCard';
import { Reveal, RevealGroup } from '../../../components/common/Reveal';
import { useCart, useReview, useAuth } from '../../../contexts';
import { useWishlist } from '../../../contexts/WishlistContext';
import { useCompare } from '../../../contexts/CompareContext';
import { useRecentlyViewed } from '../../../contexts/RecentlyViewedContext';
import { catalogApi } from '../../../services/api/catalog';
import { formatPrice } from '../../../utils';
import type { Product } from '../../../types';
import './ProductDetailPage.css';

const TABS = [
  { key: 'description', label: 'Tổng quan' },
  { key: 'specs', label: 'Thông số kỹ thuật' },
  { key: 'reviews', label: 'Đánh giá' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

const TRUST_POINTS = [
  { icon: 'shield', title: 'Chính hãng 100%', desc: 'Bảo hành tại nhà phân phối' },
  { icon: 'truck', title: 'Giao trong 24h', desc: 'Miễn phí nội thành' },
  { icon: 'refresh', title: 'Đổi trả 30 ngày', desc: 'Không cần lý do' },
  { icon: 'credit-card', title: 'Trả góp 0%', desc: 'Thẻ tín dụng quốc tế' },
] as const;

export const ProductDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlist();
  const { addItem: addToCompare, isInCompare, removeItem: removeFromCompare } = useCompare();
  const { addItem: addToRecentlyViewed } = useRecentlyViewed();
  const { getProductReviews, loadProductReviews } = useReview();

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<TabKey>('description');

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const { product: p, related: r } = await catalogApi.product(slug);
        if (cancelled) return;
        if (!p) { navigate('/products'); return; }
        setProduct(p);
        setRelated(r ?? []);
        addToRecentlyViewed(p);
        window.scrollTo(0, 0);
      } catch (err) {
        console.error('Load product failed:', err);
        if (!cancelled) navigate('/products');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [slug, navigate, addToRecentlyViewed]);

  const reviews = useMemo(() => product ? getProductReviews(product.id) : [], [product, getProductReviews]);
  const averageRating = reviews.length > 0
    ? +(reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
    : product?.rating || 0;

  useEffect(() => {
    if (product?.id) void loadProductReviews(product.id);
  }, [product?.id, loadProductReviews]);

  if (loading || !product) {
    return (
      <div className="container">
        <div className="pd-skeleton">
          <div className="pd-skeleton__media skeleton" />
          <div className="pd-skeleton__body">
            <div className="skeleton" style={{ height: 14, width: '30%' }} />
            <div className="skeleton" style={{ height: 34, width: '85%', marginTop: 18 }} />
            <div className="skeleton" style={{ height: 18, width: '45%', marginTop: 16 }} />
            <div className="skeleton" style={{ height: 62, marginTop: 28 }} />
            <div className="skeleton" style={{ height: 52, marginTop: 18 }} />
          </div>
        </div>
      </div>
    );
  }

  const inWishlist = isInWishlist(product.id);
  const inCompare = isInCompare(product.id);
  const isOutOfStock = product.stock === 0;
  const saving = product.originalPrice > product.price ? product.originalPrice - product.price : 0;

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/products/${slug}` } });
      return;
    }
    addItem(product, quantity);
  };

  const handleWishlist = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (inWishlist) removeFromWishlist(product.id);
    else addToWishlist(product);
  };

  const handleCompare = () => {
    if (inCompare) removeFromCompare(product.id);
    else addToCompare(product);
  };

  const changeQuantity = (next: number) => {
    setQuantity(Math.max(1, Math.min(product.stock || 1, next)));
  };

  return (
    <div className="pd-root">
      <div className="container">
        <Breadcrumb
          items={[
            { label: 'Trang chủ', href: '/' },
            { label: product.categoryName, href: `/categories/${product.categoryId}` },
            { label: product.name },
          ]}
        />

        <div className="pd-main">
          <Reveal direction="right" className="pd-media">
            <ProductGallery product={product} />
          </Reveal>

          <Reveal direction="left" delay={90} className="pd-buybox">
            <div className="pd-eyebrow">
              <span className="pd-eyebrow__brand">{product.brand}</span>
              <span className="pd-eyebrow__sku">SKU {product.id.toUpperCase()}</span>
            </div>

            <h1 className="pd-title">{product.name}</h1>

            <div className="pd-metrics">
              <div className="pd-metric">
                <div className="pd-metric__stars" aria-label={`Đánh giá ${averageRating}/5`}>
              {Array.from({ length: 5 }).map((_, i) => (
                    <Icon key={i} name="star" size={15} className={i < Math.round(averageRating) ? 'is-filled' : 'is-empty'} />
                  ))}
                </div>
                <strong>{averageRating}</strong>
                <span>{reviews.length} đánh giá</span>
              </div>
              <span className="pd-metric__sep" />
              <div className="pd-metric">
                <strong>{product.sold}+</strong>
                <span>đã bán</span>
              </div>
              <span className="pd-metric__sep" />
              <div className="pd-metric pd-metric--stock">
                {isOutOfStock ? (
                  <span className="pd-stock pd-stock--out">Hết hàng</span>
                ) : (
                  <span className="pd-stock">
                    <span className="pd-stock__dot" />
                    Còn {product.stock} sản phẩm
                  </span>
                )}
              </div>
            </div>

            <div className="pd-price-card">
              <div className="pd-price-card__main">
                <span className="pd-price">{formatPrice(product.price)}</span>
                {product.originalPrice > product.price && (
                  <span className="pd-price__old">{formatPrice(product.originalPrice)}</span>
                )}
              </div>
              <div className="pd-price-card__side">
                {product.discount > 0 && (
                  <span className="pd-saving">Tiết kiệm {formatPrice(saving)}</span>
                )}
                <span className="pd-price-card__note">Giá đã gồm VAT</span>
              </div>
            </div>

            <div className="pd-specs-inline">
              {Object.entries(product.specifications).slice(0, 4).map(([key, value]) => (
                <div key={key} className="pd-specs-inline__item">
                  <span>{key}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>

            <div className="pd-purchase">
              <div className="pd-purchase__row">
                <span className="pd-purchase__label">Số lượng</span>
                <div className="pd-stepper">
                  <button type="button" onClick={() => changeQuantity(quantity - 1)} disabled={quantity <= 1} aria-label="Giảm số lượng">
                    <Icon name="minus" size={16} />
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    min={1}
                    max={product.stock}
                    onChange={(e) => changeQuantity(parseInt(e.target.value, 10) || 1)}
                    aria-label="Số lượng"
                  />
                  <button type="button" onClick={() => changeQuantity(quantity + 1)} disabled={quantity >= product.stock} aria-label="Tăng số lượng">
                    <Icon name="plus" size={16} />
                  </button>
                </div>
                {product.stock > 0 && product.stock <= 20 && (
                  <span className="pd-purchase__hint">Chỉ còn {product.stock} sản phẩm</span>
                )}
              </div>

              <div className="pd-purchase__actions">
                <button className="btn btn-primary btn-lg pd-buy" onClick={handleAddToCart} disabled={isOutOfStock}>
                  <Icon name="cart" size={19} />
                  {isOutOfStock ? 'Tạm hết hàng' : 'Thêm vào giỏ hàng'}
                </button>

                <button
                  className={`pd-icon-btn ${inWishlist ? 'is-active is-danger' : ''}`}
                  onClick={handleWishlist}
                  title={inWishlist ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}
                  aria-label="Yêu thích"
                >
                  <Icon name="heart" size={19} />
                </button>

                <button
                  className={`pd-icon-btn ${inCompare ? 'is-active' : ''}`}
                  onClick={handleCompare}
                  title={inCompare ? 'Xóa khỏi so sánh' : 'Thêm vào so sánh'}
                  aria-label="So sánh"
                >
                  <Icon name="grid" size={19} />
                </button>
              </div>
            </div>

            <ul className="pd-trust">
              {TRUST_POINTS.map(point => (
                <li key={point.title} className="pd-trust__item">
                  <Icon name={point.icon} size={18} />
                  <div>
                    <strong>{point.title}</strong>
                    <span>{point.desc}</span>
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <div className="pd-tabs" role="tablist">
          {TABS.map(tab => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={activeTab === tab.key}
              className={`pd-tabs__btn ${activeTab === tab.key ? 'is-active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
              {tab.key === 'reviews' && reviews.length > 0 && (
                <span className="pd-tabs__count">{reviews.length}</span>
              )}
            </button>
          ))}
        </div>

        <div className="pd-tabpanel" key={activeTab}>
          {activeTab === 'description' && (
            <div className="pd-description">
              <p className="pd-description__text">{product.description}</p>
              <div className="pd-description__note">
                <Icon name="info" size={17} />
                <span>Mô tả được nhà phân phối cung cấp. Màu sắc và thông số thực tế có thể chênh lệch nhẹ so với hình ảnh.</span>
              </div>
            </div>
          )}
          {activeTab === 'specs' && <ProductSpecification product={product} />}
          {activeTab === 'reviews' && <ProductReview reviews={reviews} productId={product.id} />}
        </div>

        {related.length > 0 && (
          <Reveal as="section" direction="up" className="pd-related">
            <div className="section-head">
              <h2 className="section-head__title">Sản phẩm liên quan</h2>
              <a className="section-head__link" href={`/products?category=${product.categoryId}`}>
                Xem tất cả
                <Icon name="arrow-right" size={15} />
              </a>
            </div>
            <RevealGroup className="pd-related__grid">
              {related.map(item => <ProductCard key={item.id} product={item} />)}
            </RevealGroup>
          </Reveal>
        )}
      </div>
      <BackToTop />
    </div>
  );
};
