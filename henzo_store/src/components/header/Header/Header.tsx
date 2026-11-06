import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../../contexts/CartContext';
import { useWishlist } from '../../../contexts/WishlistContext';
import { useNotification } from '../../../contexts/NotificationContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useScrollY, useWindowSize, useClickOutside } from '../../../hooks';
import { MegaMenu } from '../MegaMenu/MegaMenu';
import { MiniCart } from '../MiniCart/MiniCart';
import { NotificationCenter } from '../NotificationCenter/NotificationCenter';
import { UserMenu } from '../UserMenu/UserMenu';
import { SearchBar } from '../SearchBar/SearchBar';
import { Icon } from '../../common/Icon';
import { BrandMark } from '../../common/BrandMark/BrandMark';
import { CATEGORIES } from '../../../constants';
import './Header.css';

const IconCompare = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
);

export const Header = () => {
  const scrollY = useScrollY();
  const { width } = useWindowSize();
  const { totalItems: cartCount } = useCart();
  const { count: wishlistCount } = useWishlist();
  const { unreadCount } = useNotification();
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, user } = useAuth();

  const [isScrolled, setIsScrolled] = useState(false);
  const [showMegaMenu, setShowMegaMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showMiniCart, setShowMiniCart] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const megaMenuRef = useRef<HTMLDivElement>(null!);
  const miniCartRef = useRef<HTMLDivElement>(null!);
  const notifRef = useRef<HTMLDivElement>(null!);
  const userMenuRef = useRef<HTMLDivElement>(null!);
  const mobileMenuRef = useRef<HTMLDivElement>(null!);

  const isMobile = width < 768;
  const isTransparent = scrollY < 50;

    const [bumped, setBumped] = useState<'cart' | 'wish' | 'notif' | null>(null);
  const bumpTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (bumpTimer.current) window.clearTimeout(bumpTimer.current);
    };
  }, []);

  const triggerBump = (kind: 'cart' | 'wish' | 'notif') => {
    setBumped(kind);
    if (bumpTimer.current) window.clearTimeout(bumpTimer.current);
    bumpTimer.current = window.setTimeout(() => setBumped(null), 480);
  };

  const prevCart = useRef(cartCount);
  const prevWish = useRef(wishlistCount);
  const prevNotif = useRef(unreadCount);

  useEffect(() => {
    if (cartCount !== prevCart.current) {
      triggerBump('cart');
      prevCart.current = cartCount;
    }
    if (wishlistCount !== prevWish.current) {
      triggerBump('wish');
      prevWish.current = wishlistCount;
    }
    if (unreadCount !== prevNotif.current) {
      triggerBump('notif');
      prevNotif.current = unreadCount;
    }
  }, [cartCount, wishlistCount, unreadCount]);

  useEffect(() => {
    setIsScrolled(scrollY > 50);
  }, [scrollY]);

  useClickOutside(megaMenuRef as React.RefObject<HTMLElement>, () => setShowMegaMenu(false));
  useClickOutside(miniCartRef as React.RefObject<HTMLElement>, () => setShowMiniCart(false));
  useClickOutside(notifRef as React.RefObject<HTMLElement>, () => setShowNotifications(false));
  useClickOutside(userMenuRef as React.RefObject<HTMLElement>, () => setShowUserMenu(false));
  useClickOutside(mobileMenuRef as React.RefObject<HTMLElement>, () => setShowMobileMenu(false));

  return (
    <>
      <header
        className={`header ${isScrolled ? 'header--scrolled' : ''} ${isTransparent && !isScrolled ? 'header--transparent' : ''}`}
      >
        {}
        <div className="header__masthead">
          <div className="header__masthead-inner">
            <span className="header__masthead-issue">Số 12 · Mùa Tết 2026</span>
            <span className="header__masthead-items">
              <span>Miễn phí giao hàng cho đơn từ 500.000₫</span>
              <span>Bảo hành chính hãng tới 24 tháng</span>
              <span>Đổi trả 30 ngày không cần lý do</span>
            </span>
            <Link to="/promotions" className="header__masthead-link">
              Xem ưu đãi
            </Link>
          </div>
        </div>
        <div className="container">
          <div className="header__inner">
            <Link to="/" className="header__logo">
              <BrandMark size={34} />
              <span className="header__logo-text hide-mobile">Henzo<em>Store</em></span>
            </Link>

            <nav className="header__nav">
              <Link to="/" className="header__nav-link">Trang Chủ</Link>
              <div
                className="header__nav-item header__nav-item--dropdown"
                onMouseEnter={() => setShowMegaMenu(true)}
                onMouseLeave={() => setShowMegaMenu(false)}
              >
                {}
                {showMegaMenu && (
                  <MegaMenu
                    categories={CATEGORIES.map(c => ({ ...c, children: c.children?.map(ch => ({ ...ch })) }))}
                    onClose={() => setShowMegaMenu(false)}
                    innerRef={megaMenuRef}
                  />
                )}
              </div>
              <Link to="/promotions" className="header__nav-link">Khuyến Mãi</Link>
              <Link to="/contact" className="header__nav-link">Liên Hệ</Link>
            </nav>

            {!isMobile && (
              <div className="header__search">
                <SearchBar />
              </div>
            )}

            <div className="header__actions">
              {isMobile && (
                <button className="header__action-btn" onClick={() => setShowSearch(!showSearch)} aria-label="Tìm kiếm">
                  <Icon name="search" size={19} />
                </button>
              )}

              <Link to="/wishlist" className="header__action-btn header__action-btn--with-badge" aria-label="Yêu thích">
                <Icon name="heart" size={19} />
                {wishlistCount > 0 && (
                  <span className={`header__badge ${bumped === 'wish' ? 'is-bumped' : ''}`}>
                    {wishlistCount}
                  </span>
                )}
              </Link>

              <Link to="/compare" className="header__action-btn header__compare-btn" aria-label="So sánh sản phẩm">
                <IconCompare />
              </Link>

              <div className="header__action-wrapper" ref={notifRef}>
                <button
                  className="header__action-btn header__action-btn--with-badge"
                  onClick={() => setShowNotifications(!showNotifications)}
                  aria-label="Thông báo"
                >
                  <Icon name="bell" size={19} />
                  {unreadCount > 0 && (
                    <span className={`header__badge ${bumped === 'notif' ? 'is-bumped' : ''}`}>
                      {unreadCount}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <NotificationCenter onClose={() => setShowNotifications(false)} />
                )}
              </div>

              <div className="header__action-wrapper" ref={miniCartRef}>
                <button
                  className="header__action-btn header__action-btn--with-badge"
                  onClick={() => setShowMiniCart(!showMiniCart)}
                  aria-label="Giỏ hàng"
                >
                  <Icon name="cart" size={19} />
                  {cartCount > 0 && (
                    <span className={`header__badge ${bumped === 'cart' ? 'is-bumped' : ''}`}>
                      {cartCount}
                    </span>
                  )}
                </button>
                {showMiniCart && <MiniCart onClose={() => setShowMiniCart(false)} />}
              </div>

              <div className="header__action-wrapper" ref={userMenuRef}>
                {isAuthenticated ? (
                  <button
                    className="header__action-btn header__user-btn"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                  >
                    <img src={user?.avatar} alt={user?.name} className="header__user-avatar" onError={(e) => { (e.target as HTMLImageElement).src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=fallback'; }} />
                    <span className="header__user-name">{user?.name}</span>
                  </button>
                ) : (
                  <Link to="/login" className="header__action-btn" aria-label="Đăng nhập">
                    <Icon name="user" size={19} />
                  </Link>
                )}
                {showUserMenu && <UserMenu onClose={() => setShowUserMenu(false)} />}
              </div>

              <button
                className="header__action-btn header__theme-btn"
                onClick={toggleTheme}
                aria-label={theme === 'dark' ? 'Chế độ sáng' : 'Chế độ tối'}
              >
                <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={19} />
              </button>

              <button
                className="header__action-btn header__menu-btn"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                aria-label="Menu"
                aria-expanded={showMobileMenu}
              >
                <Icon name={showMobileMenu ? 'close' : 'menu'} size={21} />
              </button>
            </div>
          </div>

        {isMobile && showSearch && (
          <div className="header__mobile-search">
            <SearchBar autoFocus />
          </div>
        )}
        </div>
      </header>

      {showMobileMenu && (
        <>
          <div className="header__mobile-menu" ref={mobileMenuRef}>
            <div className="header__mobile-menu-header">
              <Link to="/" className="header__logo" onClick={() => setShowMobileMenu(false)}>
                <BrandMark size={34} />
                <span className="header__logo-text">Henzo<em>Store</em></span>
              </Link>
              <button className="header__action-btn" onClick={() => setShowMobileMenu(false)} aria-label="Đóng menu">
                <Icon name="close" size={21} />
              </button>
            </div>
            <nav className="header__mobile-nav">
              <Link to="/" className="header__mobile-nav-link" onClick={() => setShowMobileMenu(false)}>Trang Chủ</Link>
              <Link to="/products" className="header__mobile-nav-link" onClick={() => setShowMobileMenu(false)}>Sản Phẩm</Link>
              <Link to="/promotions" className="header__mobile-nav-link" onClick={() => setShowMobileMenu(false)}>Khuyến Mãi</Link>
              <Link to="/wishlist" className="header__mobile-nav-link" onClick={() => setShowMobileMenu(false)}>Yêu Thích ({wishlistCount})</Link>
              <Link to="/cart" className="header__mobile-nav-link" onClick={() => setShowMobileMenu(false)}>Giỏ Hàng ({cartCount})</Link>
              <Link to="/account" className="header__mobile-nav-link" onClick={() => setShowMobileMenu(false)}>Tài Khoản</Link>
              <div className="header__mobile-nav-divider" />
              <div className="header__mobile-categories">
                <p className="header__mobile-categories-title">Danh Mục</p>
                {CATEGORIES.map(cat => (
                  <Link
                    key={cat.id}
                    to={`/products?category=${cat.slug}`}
                    className="header__mobile-nav-link header__mobile-nav-link--sub"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </nav>
            <div className="header__mobile-menu-footer">
              <button className="btn btn-outline btn-full" onClick={toggleTheme}>
                <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={17} />
                {theme === 'dark' ? 'Chế Độ Sáng' : 'Chế Độ Tối'}
              </button>
            </div>
          </div>
          <div className="header__backdrop" onClick={() => setShowMobileMenu(false)} />
        </>
      )}
    </>
  );
};
