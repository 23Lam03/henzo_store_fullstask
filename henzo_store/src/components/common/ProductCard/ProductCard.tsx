import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../../contexts/CartContext';
import { useWishlist } from '../../../contexts/WishlistContext';
import { useAuth } from '../../../contexts/AuthContext';
import { formatPrice } from '../../../utils';
import type { Product } from '../../../types';
import './ProductCard.css';

interface ProductCardProps {
  product: Product;
  viewMode?: 'grid' | 'list';
}

/** Ảnh dự phòng khi ảnh thật không tải được. */
const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400';

export const ProductCard = ({ product, viewMode = 'grid' }: ProductCardProps) => {
  const { addItem } = useCart();
  const {
    addItem: addToWishlist,
    removeItem: removeFromWishlist,
    isInWishlist,
  } = useWishlist();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const inWishlist = isInWishlist(product.id);

  // Nhịp đập nhẹ khi bấm yêu thích
  const [beat, setBeat] = useState(false);
  const beatTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => {
    if (beatTimer.current) window.clearTimeout(beatTimer.current);
  }, []);

  const triggerBeat = () => {
    setBeat(false);
    if (beatTimer.current) window.clearTimeout(beatTimer.current);
    // Ép trình duyệt vẽ lại để animation chạy lại từ đầu
    requestAnimationFrame(() => setBeat(true));
    beatTimer.current = window.setTimeout(() => setBeat(false), 560);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login', { state: { from: window.location.pathname } });
      return;
    }
    addItem(product, 1);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (inWishlist) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
    triggerBeat();
  };

  const productUrl = `/products/${product.slug}`;
  const hasDiscount = product.discount > 0;
  const isNew = product.isNew;
  const isHot = product.isHot;
  const isOutOfStock = product.stock === 0;

  const renderStars = () => (
    <div className="product-card__stars" aria-label={`Đánh giá ${product.rating}/5`}>
      <span className="product-card__stars-icons">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg
            key={i}
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill={i < Math.round(product.rating) ? '#A9741A' : '#D9D3C7'}
            aria-hidden="true"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        ))}
      </span>
      <span className="product-card__rating-text">{product.rating.toFixed(1)}</span>
      <span className="product-card__review-count">
        ({product.reviewCount.toLocaleString('vi-VN')})
      </span>
    </div>
  );

  const renderPriceGroup = () => (
    <div className="product-card__price-group">
      <div className="product-card__price-row">
        <span className="product-card__price">{formatPrice(product.price)}</span>
        {hasDiscount && (
          <span className="product-card__discount">-{product.discount}%</span>
        )}
      </div>
      <div className="product-card__price-sub">
        {hasDiscount ? (
          <span className="product-card__original-price">
            {formatPrice(product.originalPrice)}
          </span>
        ) : (
          <span className="product-card__original-price product-card__original-price--empty">
            &nbsp;
          </span>
        )}
      </div>
    </div>
  );

  /* ── LIST VIEW ───────────────────────────────────────────────────────── */
  if (viewMode === 'list') {
    return (
      <div className="product-card product-card--list">
        <Link
          to={productUrl}
          className="product-card__image-wrap product-card__image-wrap--list"
        >
          <img
            src={product.images[0]}
            alt={product.name}
            className="product-card__img"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
            }}
          />
          <div className="product-card__badges">
            {hasDiscount && (
              <span className="product-card__badge product-card__badge--sale">
                -{product.discount}%
              </span>
            )}
            {isNew && (
              <span className="product-card__badge product-card__badge--new">Mới</span>
            )}
            {isHot && (
              <span className="product-card__badge product-card__badge--hot">Hot</span>
            )}
          </div>
        </Link>

        <div className="product-card__info product-card__info--list">
          <span className="product-card__brand">{product.brand}</span>
          <Link to={productUrl} className="product-card__name product-card__name--list">
            {product.name}
          </Link>
          {renderStars()}
          <p className="product-card__desc">{product.description}</p>
          <div className="product-card__specs">
            {Object.entries(product.specifications)
              .slice(0, 4)
              .map(([key, val]) => (
                <span key={key} className="product-card__spec-tag">
                  {key}: {val}
                </span>
              ))}
          </div>
        </div>

        <div className="product-card__actions product-card__actions--list">
          {renderPriceGroup()}
          <div className="product-card__stock">
            {isOutOfStock ? (
              <span className="product-card__stock--out">Hết hàng</span>
            ) : (
              <span className="product-card__stock--available">
                Còn {product.stock} sản phẩm
              </span>
            )}
          </div>
          <div className="product-card__buttons">
            <button
              className="btn btn-primary btn-sm"
              onClick={handleAddToCart}
              disabled={isOutOfStock}
            >
              Thêm vào giỏ
            </button>
            <button
              className={`product-card__wishlist-btn product-card__wishlist-btn--inline ${
                inWishlist ? 'active' : ''
              } ${beat ? 'hz-beat' : ''}`}
              onClick={handleWishlist}
              title={inWishlist ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill={inWishlist ? '#B4322F' : 'none'}
                stroke={inWishlist ? '#B4322F' : 'currentColor'}
                strokeWidth="2"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── GRID VIEW ───────────────────────────────────────────────────────── */
  return (
    <div className="product-card">
      <Link to={productUrl} className="product-card__image-wrap">
        <img
          src={product.images[0]}
          alt={product.name}
          className="product-card__img"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
          }}
        />
        <div className="product-card__badges">
          {hasDiscount && (
            <span className="product-card__badge product-card__badge--sale">
              -{product.discount}%
            </span>
          )}
          {isNew && (
            <span className="product-card__badge product-card__badge--new">Mới</span>
          )}
          {isHot && (
            <span className="product-card__badge product-card__badge--hot">Hot</span>
          )}
        </div>
        {isOutOfStock && (
          <span className="product-card__out-of-stock">Hết hàng</span>
        )}
        <div className="product-card__overlay">
          <button
            className="product-card__quick-add"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            Thêm vào giỏ
          </button>
        </div>
      </Link>

      <button
        className={`product-card__wishlist-btn ${inWishlist ? 'active' : ''} ${beat ? 'hz-beat' : ''}`}
        onClick={handleWishlist}
        title={inWishlist ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill={inWishlist ? '#B4322F' : 'none'}
          stroke={inWishlist ? '#B4322F' : 'currentColor'}
          strokeWidth="2"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </button>

      <div className="product-card__body">
        <span className="product-card__brand">{product.brand}</span>
        <Link to={productUrl} className="product-card__name">
          {product.name}
        </Link>
        {renderStars()}
        {renderPriceGroup()}
        <div className="product-card__meta">
          <span className="product-card__sold">Đã bán {product.sold}+</span>
          {isOutOfStock ? (
            <span className="product-card__stock--out">Hết hàng</span>
          ) : (
            <span className="product-card__stock--available">Còn {product.stock}</span>
          )}
        </div>
      </div>
    </div>
  );
};
