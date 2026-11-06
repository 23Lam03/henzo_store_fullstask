import { Link } from 'react-router-dom';
import { useCart } from '../../../contexts/CartContext';
import { formatPrice } from '../../../utils';
import './MiniCart.css';

const IconX = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const IconCart = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  </svg>
);

export const MiniCart = ({ onClose }: { onClose: () => void }) => {
  const { items, totalPrice, totalItems, removeItem } = useCart();

  return (
    <div className="mini-cart animate-fade-down">
      <div className="mini-cart__header">
        <h3 className="mini-cart__title">Giỏ Hàng</h3>
        <span className="mini-cart__count">{totalItems} sản phẩm</span>
      </div>

      <div className="mini-cart__body">
        {items.length === 0 ? (
          <div className="mini-cart__empty">
            <IconCart />
            <p>Giỏ hàng trống</p>
            <Link to="/products" className="btn btn-primary btn-sm" onClick={onClose}>
              Mua sắm ngay
            </Link>
          </div>
        ) : (
          <div className="mini-cart__items">
            {items.slice(0, 4).map(item => (
              <div key={item.product.id} className="mini-cart__item">
                <img src={item.product.images[0]} alt={item.product.name} className="mini-cart__item-img" />
                <div className="mini-cart__item-info">
                  <p className="mini-cart__item-name">{item.product.name}</p>
                  <p className="mini-cart__item-meta">
                    {item.quantity} × <strong>{formatPrice(item.product.price)}</strong>
                  </p>
                </div>
                <button className="mini-cart__item-remove" onClick={() => removeItem(item.product.id)}>
                  <IconX />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {items.length > 0 && (
        <div className="mini-cart__footer">
          <div className="mini-cart__total">
            <span>Tạm tính:</span>
            <strong>{formatPrice(totalPrice)}</strong>
          </div>
          <Link to="/cart" className="btn btn-primary btn-full" onClick={onClose}>
            Xem giỏ hàng
          </Link>
          <Link to="/checkout" className="btn btn-outline btn-full" onClick={onClose}>
            Thanh toán ngay
          </Link>
        </div>
      )}
    </div>
  );
};
