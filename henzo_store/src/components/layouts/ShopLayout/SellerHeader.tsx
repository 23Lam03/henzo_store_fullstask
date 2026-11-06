import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useSeller } from '../../../contexts/SellerContext';
import './SellerHeader.css';

interface SellerHeaderProps {
  onMenuToggle?: () => void;
}

const FALLBACK_AVATAR =
  'https://api.dicebear.com/7.x/identicon/svg?seed=store';

const BellIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const ChevronDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);

const PackageIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
  </svg>
);

const CreditCardIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
    <line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
);

const StarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

const SettingsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

const LogOutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const typeIcons: Record<string, React.ReactNode> = {
  order: <PackageIcon />,
  payment: <CreditCardIcon />,
  review: <StarIcon />,
};

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return `${diff} phút trước`;
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return `${Math.floor(diff / 86400)} ngày trước`;
};

export const SellerHeader = ({ onMenuToggle }: SellerHeaderProps) => {
  const { user, logout } = useAuth();
  const { store, notifications, markNotificationRead, markAllNotificationsRead, deleteNotification } = useSeller();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="seller-header">
      {}
      <div className="seller-header__left">
        {onMenuToggle && (
          <button className="seller-header__mobile-toggle" onClick={onMenuToggle} aria-label="Mở menu">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        )}
        <div className="seller-header__search">
          <SearchIcon />
          <input type="text" placeholder="Tìm kiếm đơn hàng, sản phẩm..." className="seller-header__search-input" />
        </div>
      </div>

      {}
      <div className="seller-header__right">
        {}
        <Link to="/seller/profile" className="seller-header__store-badge">
          <img src={store.avatar || FALLBACK_AVATAR} alt={store.name} className="seller-header__store-avatar" />
          <div className="seller-header__store-info">
            <span className="seller-header__store-name">{store.name}</span>
            {store.isVerified && (
              <span className="seller-header__verified">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                Đã xác minh
              </span>
            )}
          </div>
        </Link>

        {}
        <div className="seller-header__notif-wrapper" ref={notifRef}>
          <button
            className="seller-header__icon-btn"
            onClick={() => setNotifOpen(prev => !prev)}
            aria-label="Thông báo"
          >
            <BellIcon />
            {unreadCount > 0 && <span className="seller-header__badge">{unreadCount}</span>}
          </button>

          {notifOpen && (
            <div className="seller-header__notif-dropdown">
              <div className="seller-header__notif-header">
                <h4>Thông báo</h4>
                {unreadCount > 0 && (
                  <button className="seller-header__mark-all" onClick={markAllNotificationsRead}>
                    Đánh dấu đã đọc
                  </button>
                )}
              </div>
              <div className="seller-header__notif-list">
                {notifications.length === 0 ? (
                  <div className="seller-header__notif-empty">Không có thông báo nào</div>
                ) : (
                  notifications.slice(0, 8).map(notif => (
                    <div
                      key={notif.id}
                      className={`seller-header__notif-item ${!notif.isRead ? 'seller-header__notif-item--unread' : ''}`}
                      onClick={() => {
                        markNotificationRead(notif.id);
                        navigate(notif.link);
                        setNotifOpen(false);
                      }}
                    >
                      <div className="seller-header__notif-icon-wrap">
                        {typeIcons[notif.type] || <BellIcon />}
                      </div>
                      <div className="seller-header__notif-content">
                        <p className="seller-header__notif-title">{notif.title}</p>
                        <p className="seller-header__notif-message">{notif.message}</p>
                        <span className="seller-header__notif-time">
                          <ClockIcon /> {formatTime(notif.createdAt)}
                        </span>
                      </div>
                      <button
                        className="seller-header__notif-delete"
                        onClick={e => { e.stopPropagation(); deleteNotification(notif.id); }}
                        aria-label="Xóa thông báo"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </div>
                  ))
                )}
              </div>
              {notifications.length > 8 && (
                <Link to="/seller/notifications" className="seller-header__notif-footer" onClick={() => setNotifOpen(false)}>
                  Xem tất cả thông báo
                </Link>
              )}
            </div>
          )}
        </div>

        {}
        <div className="seller-header__profile-wrapper" ref={profileRef}>
          <button
            className="seller-header__profile-btn"
            onClick={() => setProfileOpen(prev => !prev)}
          >
            <img src={user?.avatar || store.avatar || FALLBACK_AVATAR} alt={user?.name} className="seller-header__avatar" />
            <ChevronDownIcon />
          </button>

          {profileOpen && (
            <div className="seller-header__profile-dropdown">
              <div className="seller-header__profile-info">
                <img src={user?.avatar || store.avatar || FALLBACK_AVATAR} alt={user?.name} className="seller-header__profile-avatar" />
                <div>
                  <p className="seller-header__profile-name">{user?.name}</p>
                  <p className="seller-header__profile-role">Người bán</p>
                </div>
              </div>
              <div className="seller-header__profile-divider" />
              <Link to="/seller/profile" className="seller-header__profile-menu-item" onClick={() => setProfileOpen(false)}>
                <SettingsIcon /> Hồ sơ cửa hàng
              </Link>
              <Link to="/" className="seller-header__profile-menu-item" onClick={() => setProfileOpen(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
                Xem cửa hàng
              </Link>
              <div className="seller-header__profile-divider" />
              <button className="seller-header__profile-menu-item seller-header__profile-menu-item--danger" onClick={handleLogout}>
                <LogOutIcon /> Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
