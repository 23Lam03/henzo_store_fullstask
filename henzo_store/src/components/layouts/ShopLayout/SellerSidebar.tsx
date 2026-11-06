import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import './SellerSidebar.css';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: number;
  children?: NavItem[];
}

const DashboardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
  </svg>
);

const ProductIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 0 1-8 0"/>
  </svg>
);

const OrderIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
  </svg>
);

const InventoryIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

const PaymentIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
);

const ReviewIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

const PromotionIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);

const ShippingIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13" rx="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
    <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
  </svg>
);

const ReportIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
);

const SupportIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const FinanceIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
);

const BellIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);

const SettingsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Tổng quan', icon: <DashboardIcon />, href: '/seller' },
  {
    id: 'products', label: 'Sản phẩm', icon: <ProductIcon />, href: '/seller/products',
    children: [
      { id: 'post', label: 'Đăng sản phẩm', href: '/seller/products/create', icon: <ProductIcon /> },
      { id: 'list', label: 'Danh sách sản phẩm', href: '/seller/products', icon: <ProductIcon /> },
      { id: 'inv', label: 'Quản lý kho', href: '/seller/inventory', icon: <InventoryIcon /> },
    ]
  },
  { id: 'orders', label: 'Đơn hàng', icon: <OrderIcon />, href: '/seller/orders' },
  { id: 'payments', label: 'Thanh toán', icon: <PaymentIcon />, href: '/seller/payments' },
  { id: 'reviews', label: 'Đánh giá', icon: <ReviewIcon />, href: '/seller/reviews' },
  { id: 'promotions', label: 'Khuyến mãi', icon: <PromotionIcon />, href: '/seller/promotions' },
  { id: 'shipping', label: 'Vận chuyển', icon: <ShippingIcon />, href: '/seller/shipping' },
  { id: 'reports', label: 'Báo cáo', icon: <ReportIcon />, href: '/seller/reports' },
  { id: 'support', label: 'Hỗ trợ', icon: <SupportIcon />, href: '/seller/support' },
  { id: 'finance', label: 'Tài chính', icon: <FinanceIcon />, href: '/seller/finance' },
  { id: 'notifications', label: 'Thông báo', icon: <BellIcon />, href: '/seller/notifications' },
  { id: 'profile', label: 'Hồ sơ cửa hàng', icon: <SettingsIcon />, href: '/seller/profile' },
];

interface Props {
  collapsed?: boolean;
  pendingOrders?: number;
  unreadReviews?: number;
  openTickets?: number;
}

export const SellerSidebar = ({ collapsed = false, pendingOrders = 0, unreadReviews = 0, openTickets = 0 }: Props) => {
  const location = useLocation();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['products']));

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const isActive = (href: string) => {
    if (href === '/seller') return location.pathname === '/seller';
    return location.pathname.startsWith(href);
  };

  const renderItem = (item: NavItem, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const active = isActive(item.href);
    const expanded = expandedIds.has(item.id);

    const badgeMap: Record<string, number> = {
      orders: pendingOrders,
      reviews: unreadReviews,
      support: openTickets,
    };
    const badge = badgeMap[item.id] || 0;

    if (hasChildren) {
      return (
        <li key={item.id} className="seller-sidebar__item-group">
          <button
            className={`seller-sidebar__item ${active ? 'seller-sidebar__item--active' : ''}`}
            onClick={() => toggleExpand(item.id)}
            style={{ paddingLeft: `${16 + depth * 16}px` }}
          >
            <span className="seller-sidebar__icon">{item.icon}</span>
            {!collapsed && (
              <>
                <span className="seller-sidebar__label">{item.label}</span>
                <span className="seller-sidebar__chevron">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points={expanded ? "18 15 12 9 6 15" : "6 9 12 15 18 9"} />
                  </svg>
                </span>
              </>
            )}
          </button>
          {!collapsed && expanded && (
            <ul className="seller-sidebar__submenu">
              {item.children!.map(child => renderItem(child, depth + 1))}
            </ul>
          )}
        </li>
      );
    }

    return (
      <li key={item.id}>
        <NavLink
          to={item.href}
          end={item.href === '/seller'}
          className={`seller-sidebar__item ${active ? 'seller-sidebar__item--active' : ''}`}
          style={{ paddingLeft: `${16 + depth * 16}px` }}
        >
          <span className="seller-sidebar__icon">{item.icon}</span>
          {!collapsed && (
            <>
              <span className="seller-sidebar__label">{item.label}</span>
              {badge > 0 && <span className="seller-sidebar__badge">{badge > 99 ? '99+' : badge}</span>}
            </>
          )}
        </NavLink>
      </li>
    );
  };

  return (
    <nav className="seller-sidebar">
      <ul className="seller-sidebar__menu">
        {navItems.map(item => renderItem(item))}
      </ul>
    </nav>
  );
};
