import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { Sidebar } from '../../sidebar/Sidebar';
import type { SidebarItem } from '../../sidebar/Sidebar';
import { BackToTop } from '../../common/BackToTop/BackToTop';
import { BrandMark } from '../../common/BrandMark/BrandMark';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { usePageTitle } from '../../../hooks';
import './AdminLayout.css';

const adminMenuItems: SidebarItem[] = [
  { id: 'dash', label: 'Tổng quan', icon: 'dashboard', href: '/admin' },
  { id: 'stores', label: 'Cửa hàng', icon: 'stores', href: '/admin/stores' },
  { id: 'products', label: 'Sản phẩm', icon: 'products', href: '/admin/products' },
  { id: 'orders', label: 'Đơn hàng', icon: 'orders', href: '/admin/orders' },
  { id: 'customers', label: 'Khách hàng', icon: 'customers', href: '/admin/customers' },
  { id: 'payments', label: 'Thanh toán', icon: 'payments', href: '/admin/payments' },
  { id: 'reports', label: 'Báo cáo', icon: 'reports', href: '/admin/reports' },
  { id: 'notifications', label: 'Thông báo', icon: 'notifications', href: '/admin/notifications' },
  { id: 'support', label: 'Hỗ trợ', icon: 'support', href: '/admin/support' },
  { id: 'reviews', label: 'Đánh giá', icon: 'reviews', href: '/admin/reviews' },
  { id: 'promotions', label: 'Khuyến mãi', icon: 'promotions', href: '/admin/promotions' },
  { id: 'access', label: 'Phân quyền', icon: 'access', href: '/admin/access' },
  { id: 'finance', label: 'Tài chính', icon: 'finance', href: '/admin/finance' },
];

const ADMIN_NOTIFICATIONS = [
  { id: '1', title: 'Cửa hàng mới đăng ký', message: 'TechPro Shop vừa đăng ký bán hàng trên nền tảng.', time: '5 phút trước', unread: true, type: 'store' },
  { id: '2', title: 'Khiếu nại mới', message: 'Nguyễn Văn A gửi khiếu nại về đơn hàng #HDN-20250603-001.', time: '15 phút trước', unread: true, type: 'order' },
  { id: '3', title: 'Sản phẩm vi phạm', message: 'MacBook Pro M4 bị báo cáo vi phạm bản quyền hình ảnh.', time: '1 giờ trước', unread: false, type: 'product' },
  { id: '4', title: 'Thanh toán thành công', message: 'Thanh toán 45,000,000đ từ VNPay cho đơn hàng #HDN-20250602-089.', time: '2 giờ trước', unread: false, type: 'payment' },
  { id: '5', title: 'Khuyến mãi sắp kết thúc', message: 'Flash Sale Cuối Tuần kết thúc sau 2 ngày nữa.', time: '3 giờ trước', unread: false, type: 'promo' },
];

export const AdminLayout = () => {
  usePageTitle();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const unreadCount = ADMIN_NOTIFICATIONS.filter(n => n.unread).length;

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) navigate(`/search?q=${encodeURIComponent(searchVal)}`);
  };

  return (
    <div className="admin-layout">
      <aside className={`admin-layout__sidebar ${collapsed ? 'admin-layout__sidebar--collapsed' : ''} ${mobileOpen ? 'admin-layout__sidebar--mobile-open' : ''}`}>
        <div className="admin-layout__sidebar-header">
          <Link to="/admin" className="admin-layout__logo">
            <BrandMark size={32} tone="dark" />
            {!collapsed && <span className="admin-layout__logo-text">Admin Panel</span>}
          </Link>
          <button className="admin-layout__collapse-btn hide-mobile" onClick={() => setCollapsed(!collapsed)} aria-label="Toggle sidebar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {collapsed ? (
                <polyline points="9 18 15 12 9 6"/>
              ) : (
                <polyline points="15 18 9 12 15 6"/>
              )}
            </svg>
          </button>
        </div>
        <Sidebar items={adminMenuItems} title={collapsed ? '' : 'Quản Trị'} />
      </aside>

      {mobileOpen && (
        <div className="admin-layout__mobile-overlay" onClick={() => setMobileOpen(false)} />
      )}

      <div className={`admin-layout__main ${collapsed ? 'admin-layout__main--collapsed' : ''}`}>
        <header className="admin-layout__topbar">
          <button className="admin-layout__mobile-toggle hide-desktop" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>

          <form className="admin-layout__topbar-search hide-mobile" onSubmit={handleSearch}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm, đơn hàng, khách hàng..."
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
            />
          </form>

          <div className="admin-layout__topbar-actions">
            {/* Theme Switcher */}
            <button
              className="admin-layout__theme-btn"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              title={theme === 'dark' ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
            >
              {theme === 'dark' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              )}
            </button>

            {/* Notification Bell */}
            <div className="admin-layout__notif-wrapper" ref={notifRef}>
              <button
                className="admin-layout__notif-btn"
                onClick={() => { setNotifOpen(!notifOpen); setUserMenuOpen(false); }}
                aria-label="Notifications"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                {unreadCount > 0 && <span className="admin-layout__notif-badge">{unreadCount}</span>}
              </button>

              {notifOpen && (
                <div className="admin-layout__notif-panel">
                  <div className="admin-layout__notif-panel-header">
                    <h3>Thông báo</h3>
                    <Link to="/admin/notifications" className="admin-layout__notif-panel-link" onClick={() => setNotifOpen(false)}>
                      Xem tất cả
                    </Link>
                  </div>
                  <div className="admin-layout__notif-list">
                    {ADMIN_NOTIFICATIONS.map(n => (
                      <div key={n.id} className={`admin-layout__notif-item ${n.unread ? 'unread' : ''}`}>
                        <div className={`admin-layout__notif-icon admin-layout__notif-icon--${n.type}`}>
                          {n.type === 'store' && (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                          )}
                          {n.type === 'order' && (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                          )}
                          {n.type === 'product' && (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
                          )}
                          {n.type === 'payment' && (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                          )}
                          {n.type === 'promo' && (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                          )}
                        </div>
                        <div className="admin-layout__notif-content">
                          <p className="admin-layout__notif-title">{n.title}</p>
                          <p className="admin-layout__notif-msg">{n.message}</p>
                          <span className="admin-layout__notif-time">{n.time}</span>
                        </div>
                        {n.unread && <span className="admin-layout__notif-dot" />}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="admin-layout__user-wrapper" ref={userMenuRef}>
              <div
                className="admin-layout__user"
                onClick={() => { setUserMenuOpen(!userMenuOpen); setNotifOpen(false); }}
              >
                {user && (
                  <>
                    <img src={user.avatar} alt={user.name} className="admin-layout__user-avatar" />
                    <span className="admin-layout__user-name hide-mobile">{user.name}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="hide-mobile">
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </>
                )}
              </div>

              {userMenuOpen && (
                <div className="admin-layout__user-dropdown">
                  <div className="admin-layout__user-dropdown__info">
                    {user && (
                      <>
                        <img src={user.avatar} alt={user.name} className="admin-layout__user-dropdown__avatar" />
                        <div>
                          <p className="admin-layout__user-dropdown__name">{user.name}</p>
                          <p className="admin-layout__user-dropdown__role">{user.role === 'ADMIN' ? 'Quản trị viên' : user.role === 'SHOP' ? 'Cửa hàng' : user.role}</p>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="admin-layout__user-dropdown-divider" />
                  <Link to="/" className="admin-layout__user-dropdown-item" onClick={() => setUserMenuOpen(false)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                    Về trang chủ
                  </Link>
                  <div className="admin-layout__user-dropdown-divider" />
                  <button className="admin-layout__user-dropdown-item admin-layout__user-dropdown-item--danger" onClick={handleLogout}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="admin-layout__content">
          <Outlet />
        </div>
      </div>
      <BackToTop />
    </div>
  );
};
