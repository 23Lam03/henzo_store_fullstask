import { useState } from 'react';
import type { Product } from '../../../types';
import './ProductGallery.css';

interface ProductGalleryProps {
  product: Product;
}

export const ProductGallery = ({ product }: ProductGalleryProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  };

  const activeImage = product.images[activeIndex] || product.images[0];

  return (
    <div className="gallery">
      <div
        className={`gallery__main ${isZoomed ? 'gallery__main--zoomed' : ''}`}
        onClick={() => setIsZoomed(!isZoomed)}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setIsZoomed(false)}
        style={{
          '--zoom-x': `${zoomPos.x}%`,
          '--zoom-y': `${zoomPos.y}%`,
        } as React.CSSProperties}
      >
        <img
          src={activeImage}
          alt={product.name}
          className="gallery__main-img"
          key={activeIndex}
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800';
          }}
        />
        <div className="gallery__zoom-hint">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
          </svg>
          {isZoomed ? 'Click để thu nhỏ' : 'Click để phóng to'}
        </div>
        {product.discount > 0 && (
          <span className="gallery__badge gallery__badge--sale">-{product.discount}%</span>
        )}
        {product.isNew && (
          <span className="gallery__badge gallery__badge--new">Mới</span>
        )}
      </div>

      {product.images.length > 1 && (
        <div className="gallery__thumbs">
          {product.images.map((img, idx) => (
            <button
              key={idx}
              className={`gallery__thumb ${idx === activeIndex ? 'gallery__thumb--active' : ''}`}
              onClick={() => setActiveIndex(idx)}
            >
              <img
                src={img}
                alt={`${product.name} - Ảnh ${idx + 1}`}
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=200';
                }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
