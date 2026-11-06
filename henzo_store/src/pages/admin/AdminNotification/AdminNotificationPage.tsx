import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useToast } from '../../../contexts/ToastContext/ToastContext';
import { adminApi } from '../../../services/api/admin';
import './AdminNotificationPage.css';

type NotifType = 'promotion' | 'system' | 'warning';

interface AdminNotification {
  id: string;
  title: string;
  message: string;
  type: NotifType;
  isRead: boolean;
  createdAt: string;
}

const TYPE_COLORS: Record<NotifType, string> = {
  warning: '#B4322F',
  promotion: '#1F5557',
  system: '#2A6A85',
};

const TYPE_BG: Record<NotifType, string> = {
  warning: 'rgba(239,68,68,0.1)',
  promotion: 'rgba(31,85,87,0.1)',
  system: 'rgba(6,182,212,0.1)',
};

const TYPE_ICONS: Record<NotifType, ReactNode> = {
  warning: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  promotion: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  system: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
};

export const AdminNotificationPage = () => {
  const toast = useToast();
  const [typeFilter, setTypeFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', type: 'system', audience: 'all' });
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /** Tải thông báo từ API admin. */
  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await adminApi.notifications({ pageSize: 100 });
      setNotifications(res.notifications as AdminNotification[]);
      setCounts(res.counts ?? {});
    } catch (err) {
      console.error('Load admin notifications failed:', err);
      toast({
        title: 'Không tải được thông báo',
        message: err instanceof Error ? err.message : 'Vui lòng thử lại.',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered =
    typeFilter === 'all'
      ? notifications
      : notifications.filter(n => n.type === typeFilter);

  const handleCreate = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      toast({ title: 'Thiếu thông tin', message: 'Vui lòng nhập tiêu đề và nội dung.', variant: 'warning' });
      return;
    }
    setSaving(true);
    try {
      await adminApi.createNotification({
        title: form.title.trim(),
        message: form.message.trim(),
        type: form.type,
        audience: form.audience,
      });
      toast({ title: 'Đã gửi thông báo', message: 'Thông báo đã được gửi tới người dùng.', variant: 'success' });
      setShowCreate(false);
      setForm({ title: '', message: '', type: 'system', audience: 'all' });
      await loadNotifications();
    } catch (err) {
      console.error('Create notification failed:', err);
      toast({
        title: 'Gửi thất bại',
        message: err instanceof Error ? err.message : 'Vui lòng thử lại.',
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <div>
          <h1 className="admin-page__title">Quản Lý Thông Báo</h1>
          <p className="admin-page__subtitle">Tạo và gửi thông báo đến khách hàng, cửa hàng hoặc toàn hệ thống</p>
        </div>
        <div className="admin-page-header__actions">
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Tạo thông báo mới
          </button>
        </div>
      </div>

      <div className="admin-section">
        <div className="notif-management-header">
          <div className="notif-type-tabs">
            {['all', 'promotion', 'system', 'warning'].map(t => (
              <button
                key={t}
                className={`notif-tab ${typeFilter === t ? 'active' : ''}`}
                onClick={() => setTypeFilter(t)}
              >
                {t === 'all' ? 'Tất cả' : t === 'promotion' ? 'Khuyến mãi' : t === 'system' ? 'Hệ thống' : 'Cảnh báo'}
                {t !== 'all' && (
                  <span className="notif-tab__count">
                    {counts[t] ?? 0}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="notif-bulk-actions">
            <button className="btn btn-sm btn-outline" onClick={() => toast({ title: 'Tính năng đang phát triển', message: 'Gửi hàng loạt sẽ sớm có mặt!', variant: 'warning' })}>Gửi hàng loạt</button>
          </div>
        </div>

        <div className="notif-list">
          {loading ? (
            <p style={{ padding: 24, textAlign: 'center' }}>Đang tải thông báo...</p>
          ) : filtered.length === 0 ? (
            <p style={{ padding: 24, textAlign: 'center' }}>Chưa có thông báo nào.</p>
          ) : (
            filtered.map(n => (
              <div key={n.id} className={`notif-card ${!n.isRead ? 'notif-card--unread' : ''}`}>
                <div className="notif-card__icon" style={{ background: TYPE_BG[n.type], color: TYPE_COLORS[n.type] }}>
                  {TYPE_ICONS[n.type]}
                </div>
                <div className="notif-card__content">
                  <p className="notif-card__title">{n.title}</p>
                  <p className="notif-card__message">{n.message}</p>
                  <div className="notif-card__meta">
                    <span className={`notif-type-badge notif-type-badge--${n.type}`}>
                      {n.type === 'warning' ? 'Cảnh báo' : n.type === 'promotion' ? 'Khuyến mãi' : 'Hệ thống'}
                    </span>
                    <span className="notif-date">{new Date(n.createdAt).toLocaleDateString('vi-VN')}</span>
                    {!n.isRead && <span className="notif-unread-dot" />}
                  </div>
                </div>
                <div className="notif-card__actions">
                  <button className="btn btn-sm btn-outline" onClick={() => toast({ title: 'Đã gửi lại', message: `Thông báo #${n.id} đã được gửi lại thành công`, variant: 'success' })}>Gửi lại</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showCreate && (
        <div className="admin-modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h3 className="admin-modal__title">Tạo thông báo mới</h3>
              <button className="admin-modal__close" onClick={() => setShowCreate(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="admin-modal__body">
              <div className="admin-form">
                <div className="admin-form-group">
                  <label className="admin-form-label">Tiêu đề <span>*</span></label>
                  <input type="text" className="admin-form-input" placeholder="Nhập tiêu đề thông báo" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Nội dung <span>*</span></label>
                  <textarea className="admin-form-textarea" placeholder="Nhập nội dung thông báo" value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} />
                </div>
                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label className="admin-form-label">Loại thông báo</label>
                    <select className="admin-form-select" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                      <option value="system">Hệ thống</option>
                      <option value="promotion">Khuyến mãi</option>
                      <option value="warning">Cảnh báo</option>
                    </select>
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Đối tượng nhận</label>
                    <select className="admin-form-select" value={form.audience} onChange={e => setForm(f => ({ ...f, audience: e.target.value }))}>
                      <option value="all">Toàn hệ thống</option>
                      <option value="customers">Khách hàng</option>
                      <option value="stores">Cửa hàng</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className="admin-modal__footer">
              <button className="btn btn-outline" onClick={() => setShowCreate(false)}>Hủy</button>
              <button className="btn btn-primary" disabled={saving} onClick={handleCreate}>
                {saving ? 'Đang gửi...' : 'Gửi thông báo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
