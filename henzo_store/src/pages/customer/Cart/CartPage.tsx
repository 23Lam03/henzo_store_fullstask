import { Link, useNavigate } from 'react-router-dom';
import { useCart, useAuth } from '../../../contexts';
import { ROUTES } from '../../../constants/routes';
import { EmptyState } from '../../../components/common/EmptyState';
import { Icon } from '../../../components/common/Icon';
import { Reveal, RevealGroup } from '../../../components/common/Reveal';
import './CartPage.css';

const fmt = (p: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(p);

export const CartPage = () => {
  const { items, updateQuantity, removeItem, toggleSelect, selectAll } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const selectedItems = items.filter(i => i.selected);
  const selectedTotal = selectedItems.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const selectedOriginalTotal = selectedItems.reduce((s, i) => s + i.product.originalPrice * i.quantity, 0);
  const selectedTotalQty = selectedItems.reduce((s, i) => s + i.quantity, 0);

  const allSelected = items.length > 0 && items.every(i => i.selected);

  if (!isAuthenticated) {
    return (
      <div className="cart-page cart-page--empty">
        <div className="container">
          <EmptyState
            icon="lock"
            title="Đăng nhập để xem giỏ hàng"
            description="Vui lòng đăng nhập để xem và quản lý giỏ hàng của bạn."
            action={{ label: 'Đăng nhập ngay', to: ROUTES.LOGIN }}
            secondaryAction={{ label: 'Đăng ký tài khoản', to: ROUTES.REGISTER }}
          />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="cart-page cart-page--empty">
        <div className="container">
          <EmptyState
            icon="cart"
            title="Giỏ hàng trống"
            description="Hãy thêm sản phẩm vào giỏ hàng để tiếp tục mua sắm."
            action={{ label: 'Khám phá sản phẩm', to: ROUTES.PRODUCTS }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="container">
        <h1 className="cart-page__title">
          <Icon name="cart" size={24} />
          Giỏ hàng
          <span className="cart-page__count">{selectedTotalQty} sản phẩm</span>
        </h1>

        <div className="cart-page__layout">
          <div className="cart-page__items">
            <div className="cart-header">
              <label className="cart-select-all">
                <input type="checkbox" checked={allSelected} onChange={() => selectAll(!allSelected)} />
                <span className="checkbox-custom" />
                Chọn tất cả ({selectedTotalQty})
              </label>
            </div>

            <RevealGroup as="div" className="cart-page__items-list">
            {items.map(item => (
              <div key={item.product.id} className="cart-item card">
                <label className="cart-item__check">
                  <input type="checkbox" checked={item.selected} onChange={() => toggleSelect(item.product.id)} />
                  <span className="checkbox-custom" />
                </label>

                <Link to={`/products/${item.product.slug}`} className="cart-item__image">
                  <img src={item.product.images[0]} alt={item.product.name} loading="lazy" />
                </Link>

                <div className="cart-item__info">
                  <Link to={`/products/${item.product.slug}`} className="cart-item__name">
                    {item.product.name}
                  </Link>
                  <span className="cart-item__brand">{item.product.brand}</span>

                  <div className="cart-item__price">
                    {item.product.discount > 0 && (
                      <span className="price-original">{fmt(item.product.originalPrice)}</span>
                    )}
                    <span className="price-current">{fmt(item.product.price)}</span>
                  </div>
                </div>

                <div className="cart-item__actions">
                  <div className="qty-control">
                    <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} disabled={item.quantity <= 1} aria-label="Giảm số lượng">
                      <Icon name="minus" size={14} />
                    </button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} disabled={item.quantity >= item.product.stock} aria-label="Tăng số lượng">
                      <Icon name="plus" size={14} />
                    </button>
                  </div>
                  <span className="cart-item__subtotal">
                    {item.selected ? fmt(item.product.price * item.quantity) : '—'}
                  </span>
                  <button className="cart-item__remove" onClick={() => removeItem(item.product.id)} aria-label="Xóa sản phẩm">
                    <Icon name="trash" size={17} />
                  </button>
                </div>
              </div>
            ))}
            </RevealGroup>
          </div>

          <Reveal direction="left" delay={120} className="cart-page__summary">
            <div className="cart-summary card">
              <h3 className="cart-summary__title">
                <Icon name="wallet" size={18} />
                Tóm tắt đơn hàng
              </h3>

              <div className="cart-summary__rows">
                <div className="cart-summary__row">
                  <span>Tạm tính ({selectedTotalQty} sản phẩm)</span>
                  <span>{fmt(selectedTotal)}</span>
                </div>

                <div className="cart-summary__row cart-summary__row--saving">
                  <span>Tiết kiệm</span>
                  <span>-{fmt(selectedOriginalTotal - selectedTotal)}</span>
                </div>

                <div className="cart-summary__row cart-summary__row--shipping">
                  <span>Phí vận chuyển</span>
                  <span className={selectedTotal >= 500000 ? 'is-free' : ''}>
                    {selectedTotal >= 500000 ? 'Miễn phí' : fmt(30000)}
                  </span>
                </div>
              </div>

              <div className="cart-summary__total">
                <span>Tổng cộng</span>
                <strong>{fmt(selectedTotal >= 500000 ? selectedTotal : selectedTotal + 30000)}</strong>
              </div>

              <button
                className="btn btn-primary btn-full btn-lg cart-summary__cta"
                disabled={selectedTotalQty === 0}
                onClick={() => navigate(ROUTES.CHECKOUT)}
              >
                <Icon name="arrow-right" size={17} />
                Tiến hành đặt hàng
              </button>

              <Link to={ROUTES.PRODUCTS} className="btn btn-secondary btn-full">
                <Icon name="cart" size={17} />
                Tiếp tục mua sắm
              </Link>

              <p className="cart-summary__note">
                <Icon name="shield" size={15} />
                Thanh toán an toàn · Đổi trả dễ dàng trong 30 ngày
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
};
