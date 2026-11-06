import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SellerSidebar } from './SellerSidebar';
import { SellerHeader } from './SellerHeader';
import { BackToTop } from '../../common/BackToTop/BackToTop';
import { BrandMark } from '../../common/BrandMark/BrandMark';
import { useSeller } from '../../../contexts/SellerContext';
import { usePageTitle } from '../../../hooks';
import './ShopLayout.css';

export const ShopLayout = () => {
  usePageTitle();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { tickets, reviews, orderStatusCounts } = useSeller();

    const pendingOrders = ['pending', 'confirmed', 'preparing']
    .reduce((sum, s) => sum + (orderStatusCounts[s] ?? 0), 0);
  const unreadReviews = reviews.filter(r => !r.isHidden).length;
  const openTickets = tickets.filter(t => ['new', 'in_progress', 'replied'].includes(t.status)).length;

  return (
    <div className="shop-layout">
      {}
      <aside className={`shop-layout__sidebar ${collapsed ? 'shop-layout__sidebar--collapsed' : ''} ${mobileOpen ? 'shop-layout__sidebar--mobile-open' : ''}`}>
        <div className="shop-layout__sidebar-header">
          <Link to="/seller" className="shop-layout__logo">
            <div className="shop-layout__logo-icon">
              <BrandMark size={22} tone="dark" />
            </div>
            {!collapsed && (
              <div className="shop-layout__logo-text-wrap">
                <span className="shop-layout__logo-text">Seller Center</span>
                <span className="shop-layout__logo-sub">Henzo Store</span>
              </div>
            )}
          </Link>
          <button
            className="shop-layout__collapse-btn hide-mobile"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {collapsed ? (
                <polyline points="9 18 15 12 9 6"/>
              ) : (
                <polyline points="15 18 9 12 15 6"/>
              )}
            </svg>
          </button>
        </div>
        <SellerSidebar
          collapsed={collapsed}
          pendingOrders={pendingOrders}
          unreadReviews={unreadReviews}
          openTickets={openTickets}
        />
      </aside>

      {}
      {mobileOpen && (
        <div className="shop-layout__mobile-overlay" onClick={() => setMobileOpen(false)} />
      )}

      {}
      <div className={`shop-layout__main ${collapsed ? 'shop-layout__main--collapsed' : ''}`}>
        <SellerHeader onMenuToggle={() => setMobileOpen(true)} />
        <div className="shop-layout__content">
          <Outlet />
        </div>
      </div>
      <BackToTop />
    </div>
  );
};
