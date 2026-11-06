import { useState, useMemo } from 'react';
import { useSeller } from '../../../contexts/SellerContext';
import type { SellerSupportTicket } from '../../../types/seller';
import './ShopSupportPage.css';

const STATUS_TABS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'new', label: 'Mới' },
  { key: 'in_progress', label: 'Đang xử lý' },
  { key: 'replied', label: 'Đã phản hồi' },
  { key: 'resolved', label: 'Đã giải quyết' },
  { key: 'closed', label: 'Đóng' },
];

const STATUS_BADGE: Record<string, string> = {
  new: 'badge-danger', in_progress: 'badge-warning', replied: 'badge-primary',
  resolved: 'badge-success', closed: 'badge-dark',
};
const STATUS_LABEL: Record<string, string> = {
  new: 'Mới', in_progress: 'Đang xử lý', replied: 'Đã phản hồi',
  resolved: 'Đã giải quyết', closed: 'Đóng',
};
const PRIORITY_BADGE: Record<string, string> = {
  low: 'badge-dark', medium: 'badge-primary', high: 'badge-warning', urgent: 'badge-danger',
};
const PRIORITY_LABEL: Record<string, string> = {
  low: 'Thấp', medium: 'Trung bình', high: 'Cao', urgent: 'Khẩn cấp',
};
const CATEGORY_LABEL: Record<string, string> = {
  order: 'Đơn hàng', payment: 'Thanh toán', product: 'Sản phẩm',
  account: 'Tài khoản', technical: 'Kỹ thuật', other: 'Khác',
};

export const ShopSupportPage = () => {
  const { tickets, updateTicketStatus, addTicketMessage } = useSeller();
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedTicket, setSelectedTicket] = useState<SellerSupportTicket | null>(null);
  const [replyText, setReplyText] = useState('');
  const perPage = 10;

  const filtered = useMemo(() => {
    let list = tab === 'all' ? tickets : tickets.filter(t => t.status === tab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t => t.ticketCode.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q) || t.customerName.toLowerCase().includes(q));
    }
    return list;
  }, [tickets, tab, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const counts: Record<string, number> = { all: tickets.length };
  STATUS_TABS.slice(1).forEach(t => { counts[t.key] = tickets.filter(tk => tk.status === t.key).length; });

  const handleReply = () => {
    if (!replyText.trim() || !selectedTicket) return;
    addTicketMessage(selectedTicket.id, replyText);
    setReplyText('');
  };

  return (
    <div className="seller-support admin-page">
      <div className="admin-page__header">
        <div>
          <h1 className="admin-page__title">Hỗ trợ khách hàng</h1>
          <p className="admin-page__subtitle">Quản lý ticket hỗ trợ</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="seller-tabs">
        {STATUS_TABS.map(t => (
          <button key={t.key} className={`seller-tab ${tab === t.key ? 'seller-tab--active' : ''}`} onClick={() => { setTab(t.key); setPage(1); }}>
            {t.label}
            {counts[t.key] > 0 && <span className="seller-tab__count">{counts[t.key]}</span>}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="seller-support__search">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" placeholder="Tìm theo mã ticket, chủ đề, khách hàng..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="seller-support__search-input" />
      </div>

      {/* Tickets List */}
      <div className="seller-tickets-list">
        {paginated.length === 0 ? (
          <div className="admin-section">
            <div className="seller-empty" style={{ padding: 60 }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              <p>Không có ticket nào</p>
            </div>
          </div>
        ) : paginated.map(ticket => {
          const lastMsg = ticket.messages[ticket.messages.length - 1];
          return (
            <div
              key={ticket.id}
              className={`seller-ticket-card ${ticket.status === 'new' ? 'seller-ticket-card--new' : ''} ${selectedTicket?.id === ticket.id ? 'seller-ticket-card--selected' : ''}`}
              onClick={() => setSelectedTicket(ticket)}
            >
              <div className="seller-ticket-card__header">
                <div className="seller-ticket-card__badges">
                  <span className="seller-ticket-code">{ticket.ticketCode}</span>
                  <span className={`badge ${STATUS_BADGE[ticket.status]}`}>{STATUS_LABEL[ticket.status]}</span>
                  <span className={`badge ${PRIORITY_BADGE[ticket.priority]}`}>{PRIORITY_LABEL[ticket.priority]}</span>
                  <span className="badge badge-dark">{CATEGORY_LABEL[ticket.category] || ticket.category}</span>
                </div>
                <span className="seller-ticket-date">{new Date(ticket.updatedAt).toLocaleDateString('vi-VN')}</span>
              </div>
              <h3 className="seller-ticket-card__subject">{ticket.subject}</h3>
              <div className="seller-ticket-card__footer">
                <span className="seller-ticket-customer">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  {ticket.customerName}
                </span>
                <span className="seller-ticket-preview">{lastMsg?.content?.slice(0, 80)}...</span>
                <span className="seller-ticket-messages">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  {ticket.messages.length}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {filtered.length > perPage && (
        <div className="seller-pagination" style={{ justifyContent: 'center' }}>
          <div className="seller-pagination__buttons">
            <button className="seller-pagination__btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg></button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let p = i + 1;
              if (totalPages > 7) { if (page <= 4) p = i + 1; else if (page >= totalPages - 3) p = totalPages - 6 + i; else p = page - 3 + i; }
              return <button key={i} className={`seller-pagination__btn ${page === p ? 'seller-pagination__btn--active' : ''}`} onClick={() => setPage(p)}>{p}</button>;
            })}
            <button className="seller-pagination__btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg></button>
          </div>
        </div>
      )}

      {/* Ticket Detail Panel */}
      {selectedTicket && (
        <>
          <div className="admin-detail-panel-overlay" onClick={() => setSelectedTicket(null)} />
          <div className="admin-detail-panel">
            <div className="admin-detail-panel__header">
              <div>
                <h2 className="admin-detail-panel__title">{selectedTicket.ticketCode}</h2>
                <p className="admin-detail-panel__subtitle">{selectedTicket.subject}</p>
              </div>
              <button className="admin-detail-panel__close" onClick={() => setSelectedTicket(null)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="admin-detail-panel__body">
              {/* Info */}
              <div className="admin-detail-section">
                <h4 className="admin-detail-section__title">Thông tin</h4>
                <div className="admin-detail-row">
                  <span className="admin-detail-label">Khách hàng</span>
                  <span className="admin-detail-value">{selectedTicket.customerName}</span>
                </div>
                <div className="admin-detail-row">
                  <span className="admin-detail-label">Email</span>
                  <span className="admin-detail-value">{selectedTicket.customerEmail}</span>
                </div>
                <div className="admin-detail-row">
                  <span className="admin-detail-label">Trạng thái</span>
                  <span className={`badge ${STATUS_BADGE[selectedTicket.status]}`}>{STATUS_LABEL[selectedTicket.status]}</span>
                </div>
                <div className="admin-detail-row">
                  <span className="admin-detail-label">Mức độ</span>
                  <span className={`badge ${PRIORITY_BADGE[selectedTicket.priority]}`}>{PRIORITY_LABEL[selectedTicket.priority]}</span>
                </div>
                <div className="admin-detail-row">
                  <span className="admin-detail-label">Chủ đề</span>
                  <span className="admin-detail-value">{CATEGORY_LABEL[selectedTicket.category] || selectedTicket.category}</span>
                </div>
              </div>

              {/* Messages */}
              <div className="admin-detail-section">
                <h4 className="admin-detail-section__title">Tin nhắn ({selectedTicket.messages.length})</h4>
                <div className="seller-ticket-messages-list">
                  {selectedTicket.messages.map(msg => (
                    <div key={msg.id} className={`seller-msg ${msg.sender === 'seller' ? 'seller-msg--outgoing' : 'seller-msg--incoming'}`}>
                      <div className="seller-msg__header">
                        <span className="seller-msg__sender">{msg.senderName}</span>
                        <span className="seller-msg__time">{new Date(msg.createdAt).toLocaleString('vi-VN')}</span>
                      </div>
                      <p className="seller-msg__content">{msg.content}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reply */}
              {selectedTicket.status !== 'closed' && selectedTicket.status !== 'resolved' && (
                <div className="seller-ticket-reply">
                  <textarea
                    className="admin-form-textarea"
                    placeholder="Viết phản hồi của bạn..."
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    rows={3}
                  />
                  <div className="seller-ticket-reply__actions">
                    <button className="btn btn-secondary btn-sm"
                      onClick={() => updateTicketStatus(selectedTicket.id, 'resolved')}>
                      Đánh dấu đã giải quyết
                    </button>
                    <button className="btn btn-primary" onClick={handleReply} disabled={!replyText.trim()}>
                      Gửi phản hồi
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
