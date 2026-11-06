import { useState, useMemo } from 'react';
import { useAdmin } from '../../../contexts/AdminContext';
import { AdminDataTable } from '../../../components/admin/AdminDataTable';
import { adminApi } from '../../../services/api/admin';
import type { SupportTicket } from '../../../types';
import { formatNumber } from '../../../utils';
import { useToast } from '../../../contexts/ToastContext/ToastContext';
import './AdminSupportPage.css';

const STATUS_OPTIONS = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Mới', value: 'open' },
  { label: 'Đang xử lý', value: 'pending' },
  { label: 'Đã giải quyết', value: 'resolved' },
  { label: 'Đã đóng', value: 'closed' },
];

const PRIORITY_OPTIONS = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Cao', value: 'high' },
  { label: 'Trung bình', value: 'medium' },
  { label: 'Thấp', value: 'low' },
];

const TYPE_OPTIONS = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Đơn hàng', value: 'order' },
  { label: 'Thanh toán', value: 'payment' },
  { label: 'Sản phẩm', value: 'product' },
  { label: 'Tài khoản', value: 'account' },
  { label: 'Kỹ thuật', value: 'technical' },
  { label: 'Khác', value: 'other' },
];

const STATUS_LABELS: Record<string, string> = {
  open: 'Mới', pending: 'Đang xử lý', resolved: 'Đã giải quyết', closed: 'Đã đóng',
};
const PRIORITY_LABELS: Record<string, string> = { high: 'Cao', medium: 'Trung bình', low: 'Thấp', urgent: 'Khẩn cấp' };

const CATEGORY_LABELS: Record<string, string> = {
  order: 'Đơn hàng',
  payment: 'Thanh toán',
  product: 'Sản phẩm',
  account: 'Tài khoản',
  technical: 'Kỹ thuật',
  other: 'Khác',
};

export const AdminSupportPage = () => {
  const { tickets, updateTicketStatus, refresh } = useAdmin();
  const toast = useToast();
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [replying, setReplying] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const enrichedTickets: (SupportTicket & { senderName: string; typeLabel: string })[] = useMemo(
    () =>
      tickets.map(t => ({
        ...t,
        senderName: t.senderName || t.customerEmail || 'Khách hàng',
        typeLabel: CATEGORY_LABELS[t.category ?? 'other'] ?? 'Khác',
      })),
    [tickets],
  );

  const filtered = enrichedTickets.filter(t =>
    (statusFilter === 'all' || t.status === statusFilter) &&
    (priorityFilter === 'all' || t.priority === priorityFilter) &&
    (typeFilter === 'all' || t.category === typeFilter)
  );

  const openCount = tickets.filter(t => t.status === 'open').length;
  const pendingCount = tickets.filter(t => t.status === 'pending').length;

    const handleResolve = async (id: string) => {
    try {
      await updateTicketStatus(id, 'resolved');
      toast({ title: 'Đã giải quyết', message: `Ticket #${id} đã được đánh dấu giải quyết`, variant: 'success' });
    } catch (err) {
      toast({
        title: 'Cập nhật thất bại',
        message: err instanceof Error ? err.message : 'Vui lòng thử lại.',
        variant: 'error',
      });
    }
  };

    const handleSendReply = async () => {
    if (!replying || !replyText.trim()) return;
    setIsSubmitting(true);
    try {
      await adminApi.replyTicket(replying.id, replyText.trim());
      toast({ title: 'Đã gửi phản hồi', variant: 'success' });
      setReplying(null);
      setReplyText('');
      await refresh();
    } catch (err) {
      console.error('Reply ticket failed:', err);
      toast({
        title: 'Gửi phản hồi thất bại',
        message: err instanceof Error ? err.message : 'Vui lòng thử lại.',
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

    const handleClose = async (id: string) => {
    try {
      await adminApi.closeTicket(id);
      toast({ title: 'Đã đóng phiếu hỗ trợ', variant: 'success' });
      await refresh();
    } catch (err) {
      console.error('Close ticket failed:', err);
      toast({
        title: 'Đóng ticket thất bại',
        message: err instanceof Error ? err.message : 'Vui lòng thử lại.',
        variant: 'error',
      });
    }
  };

  const columns = [
    { key: 'id', label: 'Mã ticket', width: '90px',
      render: (_: unknown, r: SupportTicket & { senderName: string; typeLabel: string }) => <code className="ticket-id">{(r as SupportTicket).id}</code>,
    },
    {
      key: 'senderName', label: 'Người gửi', sortable: true,
      render: (_: unknown, r: SupportTicket & { senderName: string }) => (
        <div className="sender-cell">
          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${(r as SupportTicket).id}`} alt="" className="admin-avatar admin-avatar--sm" />
          <div>
            <p className="sender-name">{(r as SupportTicket & { senderName: string }).senderName}</p>
            <p className="sender-type">{(r as SupportTicket & { senderName: string; typeLabel: string }).typeLabel}</p>
          </div>
        </div>
      ),
    },
    { key: 'subject', label: 'Chủ đề', render: (_: unknown, r: SupportTicket) => <span className="ticket-subject">{(r as SupportTicket).subject}</span> },
    {
      key: 'priority', label: 'Ưu tiên', align: 'center' as const, width: '100px',
      render: (_: unknown, r: SupportTicket) => {
        const p = (r as SupportTicket).priority;
        return <span className={`admin-status ${p === 'high' ? 'admin-status--cancelled' : p === 'medium' ? 'admin-status--pending' : 'admin-status--active'}`}>{PRIORITY_LABELS[p]}</span>;
      },
    },
    {
      key: 'status', label: 'Trạng thái', align: 'center' as const, width: '130px',
      render: (_: unknown, r: SupportTicket) => {
        const s = (r as SupportTicket).status;
        return <span className={`admin-status ${s === 'open' ? 'admin-status--new' : s === 'pending' ? 'admin-status--pending' : s === 'resolved' ? 'admin-status--completed' : 'admin-status--locked'}`}>{STATUS_LABELS[s]}</span>;
      },
    },
    { key: 'createdAt', label: 'Ngày gửi', sortable: true, width: '120px',
      render: (_: unknown, r: SupportTicket) => new Date((r as SupportTicket).createdAt).toLocaleDateString('vi-VN'),
    },
  ];

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <div>
          <h1 className="admin-page__title">Quản Lý Hỗ Trợ</h1>
          <p className="admin-page__subtitle">Xử lý các yêu cầu hỗ trợ từ cửa hàng và khách hàng</p>
        </div>
        <div className="admin-page-header__actions">
          <span className="admin-page__meta">{formatNumber(tickets.length)} ticket</span>
        </div>
      </div>

      <div className="admin-stats admin-stats--3">
        <div className="admin-stat-card">
          <div className="admin-stat-card__icon" style={{ background: 'rgba(6, 182, 212, 0.1)', color: '#2A6A85' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <div className="admin-stat-card__info">
            <p className="admin-stat-card__label">Ticket mới</p>
            <p className="admin-stat-card__value">{openCount}</p>
            <span className="admin-stat-card__change admin-stat-card__change--up">Cần xử lý ngay</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-card__icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#A9741A' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          </div>
          <div className="admin-stat-card__info">
            <p className="admin-stat-card__label">Đang xử lý</p>
            <p className="admin-stat-card__value">{pendingCount}</p>
            <span className="admin-stat-card__change admin-stat-card__change--up">Trong tiến trình</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-card__icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#2F7D52' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <div className="admin-stat-card__info">
            <p className="admin-stat-card__label">Đã giải quyết</p>
            <p className="admin-stat-card__value">{tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length}</p>
            <span className="admin-stat-card__change admin-stat-card__change--up">Tổng</span>
          </div>
        </div>
      </div>

      <div className="admin-section">
        <div className="support-filter-bar">
          <div className="support-filter-group">
            <label>Trạng thái:</label>
            <select className="admin-form-select support-filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="support-filter-group">
            <label>Ưu tiên:</label>
            <select className="admin-form-select support-filter-select" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
              {PRIORITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="support-filter-group">
            <label>Loại:</label>
            <select className="admin-form-select support-filter-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
        <AdminDataTable
          columns={columns}
          data={filtered}
          rowKey="id"
          searchable
          searchableFields={['subject', 'senderName', 'message']}
          actions={(record) => (
            <>
              <button
                className="btn btn-sm btn-primary"
                onClick={() => {
                  setReplying(record as SupportTicket);
                  setReplyText('');
                }}
              >
                Trả lời
              </button>
              {(record as SupportTicket).status !== 'resolved' && (record as SupportTicket).status !== 'closed' && (
                <button className="btn btn-sm btn-secondary" onClick={() => void handleResolve((record as SupportTicket).id)}>Giải quyết</button>
              )}
              {(record as SupportTicket).status !== 'closed' && (
                <button
                  className="btn btn-sm btn-outline"
                  style={{ color: 'var(--color-danger)' }}
                  onClick={() => void handleClose((record as SupportTicket).id)}
                >
                  Đóng
                </button>
              )}
            </>
          )}
          emptyText="Không có ticket nào"
        />
      </div>

      {}
      {replying && (
        <div className="admin-modal-overlay" onClick={() => setReplying(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h2 className="admin-modal__title">Trả lời: {replying.subject}</h2>
              <button className="admin-modal__close" onClick={() => setReplying(null)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="admin-modal__body">
              <div className="admin-form-group">
                <label className="admin-form-label">Nội dung phản hồi <span>*</span></label>
                <textarea
                  className="admin-form-textarea"
                  rows={6}
                  placeholder="Nhập nội dung phản hồi cho khách hàng..."
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                />
              </div>
            </div>
            <div className="admin-modal__footer">
              <button className="btn btn-secondary" onClick={() => setReplying(null)}>Hủy</button>
              <button
                className="btn btn-primary"
                onClick={() => void handleSendReply()}
                disabled={isSubmitting || !replyText.trim()}
              >
                {isSubmitting ? 'Đang gửi...' : 'Gửi phản hồi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
