import { useMemo, useState } from 'react';
import { useNotification } from '../../../contexts';
import { Icon, type IconName } from '../../../components/common/Icon';
import './NotificationPage.css';

const TYPE_ICONS: Record<string, IconName> = {
  order: 'package',
  promotion: 'sparkles',
  voucher: 'ticket',
  system: 'settings',
};

const TYPE_LABELS: Record<string, string> = {
  order: 'Đơn hàng', promotion: 'Khuyến mãi', voucher: 'Voucher', system: 'Hệ thống',
};

export const NotificationPage = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotification();
  const [filter, setFilter] = useState('all');

  const filtered = useMemo(
    () => (filter === 'all' ? notifications : notifications.filter(n => n.type === filter)),
    [notifications, filter],
  );

  const filters = [
    { id: 'all', label: 'Tất cả' },
    { id: 'order', label: 'Đơn hàng' },
    { id: 'promotion', label: 'Khuyến mãi' },
    { id: 'voucher', label: 'Voucher' },
    { id: 'system', label: 'Hệ thống' },
  ];

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Hôm nay';
    if (days === 1) return 'Hôm qua';
    if (days < 7) return `${days} ngày trước`;
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="notification-page">
      <div className="container">
        <div className="notification-page__header">
          <h1 className="notification-page__title">Thông báo</h1>
          {unreadCount > 0 && (
            <button className="btn btn-secondary btn-sm" onClick={() => void markAllAsRead()}>
              Đánh dấu tất cả đã đọc
            </button>
          )}
        </div>

        <div className="notification-filters">
          {filters.map(f => (
            <button key={f.id} className={`filter-tab ${filter === f.id ? 'active' : ''}`} onClick={() => setFilter(f.id)}>
              {f.label}
            </button>
          ))}
        </div>

        <div className="notification-list">
          {filtered.length === 0 ? (
            <div className="notification-empty">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2.12 2.12 0 0 1-3.46 0"/>
              </svg>
              <p>Không có thông báo nào.</p>
            </div>
          ) : (
            filtered.map(n => (
              <div
                key={n.id}
                className={`notif-card card ${!n.isRead ? 'unread' : ''}`}
                onClick={() => { if (!n.isRead) void markAsRead(n.id); }}
              >
                <div className="notif-card__icon">
                  <Icon name={TYPE_ICONS[n.type] ?? 'bell'} size={20} />
                </div>
                <div className="notif-card__content">
                  <div className="notif-card__header">
                    <span className="notif-card__type">{TYPE_LABELS[n.type] ?? n.type}</span>
                    {!n.isRead && <span className="notif-card__dot" />}
                  </div>
                  <h3 className="notif-card__title">{n.title}</h3>
                  <p className="notif-card__msg">{n.message}</p>
                  <span className="notif-card__time">{formatTime(n.createdAt)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
