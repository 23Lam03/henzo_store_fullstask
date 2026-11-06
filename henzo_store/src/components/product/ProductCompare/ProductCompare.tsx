import { Link } from 'react-router-dom';
import type { Product } from '../../../types';
import { formatPrice } from '../../../utils';
import './ProductCompare.css';

interface ProductCompareProps {
  products: Product[];
  onRemove: (id: string) => void;
  maxProducts?: number;
}

export const ProductCompare = ({ products, onRemove, maxProducts = 4 }: ProductCompareProps) => {
  const specKeys = products.flatMap(p => Object.keys(p.specifications));
  const uniqueSpecs = [...new Set(specKeys)];

  const getSpecValue = (product: Product, key: string) => {
    return product.specifications[key] || '—';
  };

  if (products.length === 0) {
    return (
      <div className="product-compare product-compare--empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/>
        </svg>
        <h3>So sánh sản phẩm</h3>
        <p>Thêm sản phẩm để so sánh</p>
        <Link to="/products" className="btn btn-primary">Khám phá sản phẩm</Link>
      </div>
    );
  }

  return (
    <div className="product-compare">
      <div className="product-compare__header">
        <h3 className="product-compare__title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/>
          </svg>
          So sánh sản phẩm ({products.length}/{maxProducts})
        </h3>
        <Link to="/compare" className="btn btn-outline btn-sm">Xem đầy đủ</Link>
      </div>

      <div className="product-compare__table-wrap">
        <table className="product-compare__table">
          <thead>
            <tr>
              <th className="product-compare__label-cell">Sản phẩm</th>
              {products.map(p => (
                <th key={p.id} className="product-compare__product-cell">
                  <button className="product-compare__remove" onClick={() => onRemove(p.id)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                  <Link to={`/products/${p.slug}`}>
                    <img
                      src={p.images[0]}
                      alt={p.name}
                      className="product-compare__img"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=200';
                      }}
                    />
                  </Link>
                  <Link to={`/products/${p.slug}`} className="product-compare__name">{p.name}</Link>
                  <div className="product-compare__price">
                    <span className="product-compare__current-price">{formatPrice(p.price)}</span>
                    {p.discount > 0 && (
                      <>
                        <span className="product-compare__original-price">{formatPrice(p.originalPrice)}</span>
                        <span className="product-compare__discount">-{p.discount}%</span>
                      </>
                    )}
                  </div>
                  <div className="product-compare__rating">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#A9741A">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                    <span>{p.rating} ({p.reviewCount})</span>
                  </div>
                </th>
              ))}
              {products.length < maxProducts && (
                Array.from({ length: maxProducts - products.length }).map((_, i) => (
                  <th key={`empty-${i}`} className="product-compare__empty-cell">
                    <div className="product-compare__add-slot">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                      <span>Thêm sản phẩm</span>
                    </div>
                  </th>
                ))
              )}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="product-compare__label-cell">Thương hiệu</td>
              {products.map(p => (
                <td key={p.id} className="product-compare__value-cell">{p.brand}</td>
              ))}
              {products.length < maxProducts && <td colSpan={maxProducts - products.length} />}
            </tr>
            <tr>
              <td className="product-compare__label-cell">Danh mục</td>
              {products.map(p => (
                <td key={p.id} className="product-compare__value-cell">{p.categoryName}</td>
              ))}
              {products.length < maxProducts && <td colSpan={maxProducts - products.length} />}
            </tr>
            <tr>
              <td className="product-compare__label-cell">Tình trạng</td>
              {products.map(p => (
                <td key={p.id} className="product-compare__value-cell">
                  {p.stock > 0 ? (
                    <span className="product-compare__in-stock">Còn hàng</span>
                  ) : (
                    <span className="product-compare__out-stock">Hết hàng</span>
                  )}
                </td>
              ))}
              {products.length < maxProducts && <td colSpan={maxProducts - products.length} />}
            </tr>
            {uniqueSpecs.map(key => (
              <tr key={key}>
                <td className="product-compare__label-cell">{key}</td>
                {products.map(p => (
                  <td key={p.id} className="product-compare__value-cell">{getSpecValue(p, key)}</td>
                ))}
                {products.length < maxProducts && <td colSpan={maxProducts - products.length} />}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
