import { ProductCard } from '../../common/ProductCard';
import { RevealGroup } from '../../common/Reveal';
import type { Product } from '../../../types';
import './ProductGrid.css';

interface ProductGridProps {
  products: Product[];
  viewMode?: 'grid' | 'list';
  loading?: boolean;
}

export const ProductGrid = ({ products, viewMode = 'grid', loading }: ProductGridProps) => {
  if (loading) {
    return (
      <div className={`product-grid product-grid--${viewMode}`}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="product-grid__skeleton">
            <div className="skeleton" style={{ aspectRatio: '1/1', borderRadius: '20px' }} />
            <div className="skeleton" style={{ height: 16, marginTop: 12, borderRadius: 8 }} />
            <div className="skeleton" style={{ height: 16, width: '60%', marginTop: 8, borderRadius: 8 }} />
            <div className="skeleton" style={{ height: 20, width: '40%', marginTop: 12, borderRadius: 8 }} />
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="product-grid__empty">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <h3>Không tìm thấy sản phẩm</h3>
        <p>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
      </div>
    );
  }

  return (
    <RevealGroup
      // Khóa lại theo viewMode + danh sách để stagger chạy lại khi đổi bộ lọc.
      key={`${viewMode}-${products.length}`}
      className={`product-grid product-grid--${viewMode}`}
      threshold={0.05}
    >
      {products.map(product => (
        <ProductCard key={product.id} product={product} viewMode={viewMode} />
      ))}
    </RevealGroup>
  );
};
