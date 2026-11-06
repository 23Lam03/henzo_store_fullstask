import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Header } from '../../header/Header';
import { Footer } from '../../footer/Footer';
import { Sidebar } from '../../sidebar/Sidebar';
import type { SidebarItem } from '../../sidebar/Sidebar';
import { Breadcrumb } from '../../breadcrumb/Breadcrumb';
import { BackToTop } from '../../common/BackToTop/BackToTop';
import { usePageTitle } from '../../../hooks';
import './CustomerLayout.css';

const customerMenuItems: SidebarItem[] = [
  { id: 'dash', label: 'Tổng quan', icon: 'dashboard', href: '/account' },
  { id: 'orders', label: 'Đơn hàng', icon: 'orders', href: '/account/orders' },
  { id: 'wishlist', label: 'Yêu thích', icon: 'heart', href: '/wishlist' },
  { id: 'reviews', label: 'Đánh giá', icon: 'reviews', href: '/account/reviews' },
  { id: 'support', label: 'Hỗ trợ', icon: 'support', href: '/account/support' },
  { id: 'settings', label: 'Cài đặt', icon: 'settings', href: '/account/settings', children: [
    { id: 'profile', label: 'Hồ sơ', href: '/account/settings' },
    { id: 'password', label: 'Đổi mật khẩu', href: '/account/settings/password' },
    { id: 'address', label: 'Địa chỉ', href: '/account/settings/address' },
  ]},
];

const IconMenu = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);

export const CustomerLayout = () => {
  usePageTitle();
  const [showSidebar, setShowSidebar] = useState(false);
  const location = useLocation();
  const isAccountPage = location.pathname.startsWith('/account') || location.pathname.startsWith('/wishlist');

  return (
    <div className="customer-layout">
      <Header />
      {isAccountPage ? (
        <div className="customer-layout__with-sidebar">
          <button
            className="customer-layout__sidebar-toggle btn btn-secondary"
            onClick={() => setShowSidebar(!showSidebar)}
          >
            <IconMenu /> Menu
          </button>
          {showSidebar && (
            <>
              <div className="customer-layout__sidebar-overlay" onClick={() => setShowSidebar(false)} />
              <Sidebar items={customerMenuItems} title="Tài Khoản" onClose={() => setShowSidebar(false)} />
            </>
          )}
          <div className="customer-layout__main">
            <Breadcrumb />
            <div className="customer-layout__content">
              <Outlet />
            </div>
          </div>
        </div>
      ) : (
        <main className="customer-layout__content">
          <Outlet />
        </main>
      )}
      <Footer />
      <BackToTop />
    </div>
  );
};
