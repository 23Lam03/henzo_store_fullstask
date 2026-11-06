import { Link } from 'react-router-dom';
import { useNotification } from '../../../contexts/NotificationContext';
import { useAuth } from '../../../contexts/AuthContext';
import { formatDate } from '../../../utils';
import './NotificationCenter.css';

const IconOrder = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
  </svg>
);

const IconPromotion = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

const IconVoucher = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
);

const IconSystem = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
  </svg>
);

const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const typeIcons = {
  order: IconOrder,
  promotion: IconPromotion,
  voucher: IconVoucher,
  system: IconSystem,
};

const typeLabels = {
  order: 'Đơn hàng',
  promotion: 'Khuyến mãi',
  voucher: 'Voucher',
  system: 'Hệ thống',
};

export const NotificationCenter = ({ onClose }: { onClose: () => void }) => {
  const { isAuthenticated } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotification();

  return (
    <div className="notif-center animate-fade-down">
      <div className="notif-center__header">
        <div className="notif-center__title-row">
          <h3 className="notif-center__title">Thông Báo</h3>
          {unreadCount > 0 && (
            <span className="badge badge-danger">{unreadCount} mới</span>
          )}
        </div>
        {unreadCount > 0 && (
          <button className="notif-center__mark-all" onClick={markAllAsRead}>
            <IconCheck /> Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>
      <div className="notif-center__list">
        {!isAuthenticated ? (
          <div className="notif-center__empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
            <p>Vui lòng đăng nhập để xem thông báo</p>
            <Link to="/login" className="btn btn-primary btn-sm" onClick={onClose}>
              Đăng Nhập
            </Link>
          </div>
        ) : notifications.length === 0 ? (
          <div className="notif-center__empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <p>Không có thông báo nào</p>
          </div>
        ) : (
          notifications.map(notif => {
            const Icon = typeIcons[notif.type];
            return (
              <div
                key={notif.id}
                className={`notif-center__item ${!notif.isRead ? 'notif-center__item--unread' : ''}`}
                onClick={() => markAsRead(notif.id)}
              >
                <div className="notif-center__item-icon">
                  <Icon />
                </div>
                <div className="notif-center__item-content">
                  <div className="notif-center__item-header">
                    <span className="notif-center__item-type">{typeLabels[notif.type]}</span>
                    {!notif.isRead && <span className="notif-center__unread-dot" />}
                  </div>
                  <h4 className="notif-center__item-title">{notif.title}</h4>
                  <p className="notif-center__item-message">{notif.message}</p>
                  <span className="notif-center__item-time">{formatDate(notif.createdAt, 'relative')}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
      <div className="notif-center__footer">
        <Link to="/notifications" className="notif-center__view-all" onClick={onClose}>
          Xem tất cả thông báo
        </Link>
      </div>
    </div>
  );
};
