import { Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import './UserMenu.css';

const IconUser = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);

const IconPackage = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
  </svg>
);

const IconHeart = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

const IconSettings = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

const IconLogout = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const IconShield = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

export const UserMenu = ({ onClose }: { onClose: () => void }) => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    onClose();
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Quản trị viên';
      case 'SHOP': return 'Cửa hàng';
      default: return 'Khách hàng';
    }
  };

  return (
    <div className="user-menu animate-fade-down">
      {user && (
        <div className="user-menu__profile">
          <img src={user.avatar} alt={user.name} className="user-menu__avatar" />
          <div className="user-menu__info">
            <p className="user-menu__name">{user.name}</p>
            <span className="user-menu__role">{getRoleLabel(user.role)}</span>
          </div>
        </div>
      )}

      <div className="user-menu__links">
        {user?.role === 'ADMIN' && (
          <Link to="/admin" className="user-menu__link user-menu__link--admin" onClick={onClose}>
            <IconShield /> Trang quản trị
          </Link>
        )}
        {user?.role === 'SHOP' && (
          <Link to="/seller" className="user-menu__link user-menu__link--admin" onClick={onClose}>
            <IconShield /> Trang cửa hàng
          </Link>
        )}
        {user?.role === 'CUSTOMER' && (
          <>
            <Link to="/account" className="user-menu__link" onClick={onClose}>
              <IconUser /> Tài khoản của tôi
            </Link>
            <Link to="/account/orders" className="user-menu__link" onClick={onClose}>
              <IconPackage /> Đơn hàng
            </Link>
            <Link to="/wishlist" className="user-menu__link" onClick={onClose}>
              <IconHeart /> Yêu thích
            </Link>
            <Link to="/account/settings" className="user-menu__link" onClick={onClose}>
              <IconSettings /> Cài đặt
            </Link>
          </>
        )}
        {(user?.role !== 'CUSTOMER') && (
          <Link to="/" className="user-menu__link" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            Về trang chủ
          </Link>
        )}
      </div>

      <div className="user-menu__footer">
        {user ? (
          <button className="user-menu__logout" onClick={handleLogout}>
            <IconLogout /> Đăng xuất
          </button>
        ) : (
          <Link to="/login" className="btn btn-primary btn-full" onClick={onClose}>
            Đăng nhập
          </Link>
        )}
      </div>
    </div>
  );
};
