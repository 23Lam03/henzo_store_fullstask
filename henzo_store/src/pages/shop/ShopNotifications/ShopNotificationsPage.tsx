import { useSeller } from '../../../contexts/SellerContext';
import './ShopNotificationsPage.css';

const TYPE_CONFIG: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  order: {
    label: 'Đơn hàng', cls: 'seller-notif--order',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
  },
  product: {
    label: 'Sản phẩm', cls: 'seller-notif--product',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg>,
  },
  payment: {
    label: 'Thanh toán', cls: 'seller-notif--payment',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  },
  system: {
    label: 'Hệ thống', cls: 'seller-notif--system',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  },
  review: {
    label: 'Đánh giá', cls: 'seller-notif--review',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  },
  promotion: {
    label: 'Khuyến mãi', cls: 'seller-notif--promotion',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  },
};

const formatTime = (dateStr: string) => {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff} phút trước`;
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return `${Math.floor(diff / 86400)} ngày trước`;
};

export const ShopNotificationsPage = () => {
  const { notifications, markNotificationRead, markAllNotificationsRead, deleteNotification } = useSeller();
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const grouped = (Object.keys(TYPE_CONFIG) as Array<keyof typeof TYPE_CONFIG>).map(type => ({
    type,
    ...TYPE_CONFIG[type],
    items: notifications.filter(n => n.type === type),
  })).filter(g => g.items.length > 0);

  return (
    <div className="seller-notifications admin-page">
      <div className="admin-page__header">
        <div>
          <h1 className="admin-page__title">Thông báo</h1>
          <p className="admin-page__subtitle">
            {unreadCount > 0 ? `Bạn có <strong>${unreadCount}</strong> thông báo chưa đọc` : 'Tất cả thông báo đã được đọc'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-secondary btn-sm" onClick={markAllNotificationsRead}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="admin-section">
          <div className="seller-empty" style={{ padding: 80 }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            <p>Không có thông báo nào</p>
          </div>
        </div>
      ) : (
        <div className="seller-notifications__groups">
          {grouped.map(group => (
            <div key={group.type} className="seller-notif-group">
              <div className="seller-notif-group__header">
                <span className={`seller-notif-group__icon ${group.cls}`}>{group.icon}</span>
                <span className="seller-notif-group__label">{group.label}</span>
                <span className="seller-notif-group__count">{group.items.length}</span>
              </div>
              <div className="seller-notif-group__list">
                {group.items.map(notif => (
                  <div
                    key={notif.id}
                    className={`seller-notif-item ${!notif.isRead ? 'seller-notif-item--unread' : ''}`}
                    onClick={() => markNotificationRead(notif.id)}
                  >
                    <div className={`seller-notif-item__icon ${group.cls}`}>{group.icon}</div>
                    <div className="seller-notif-item__content">
                      <p className="seller-notif-item__title">{notif.title}</p>
                      <p className="seller-notif-item__message">{notif.message}</p>
                      <span className="seller-notif-item__time">{formatTime(notif.createdAt)}</span>
                    </div>
                    {!notif.isRead && <span className="seller-notif-item__dot" />}
                    <button
                      className="seller-notif-item__delete"
                      onClick={e => { e.stopPropagation(); deleteNotification(notif.id); }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
