import { useState, useEffect, useCallback } from 'react';
import { supportApi } from '../../../services/api/support';
import { useToast } from '../../../contexts';
import './CustomerSupportPage.css';

const CATEGORY_OPTIONS = [
  { value: '', label: 'Tất cả loại' },
  { value: 'order', label: 'Đơn hàng' },
  { value: 'payment', label: 'Thanh toán' },
  { value: 'product', label: 'Sản phẩm' },
  { value: 'account', label: 'Tài khoản' },
  { value: 'technical', label: 'Kỹ thuật' },
  { value: 'other', label: 'Khác' },
];

const STATUS_TABS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'open', label: 'Đang mở' },
  { key: 'replied', label: 'Đã phản hồi' },
  { key: 'resolved', label: 'Đã giải quyết' },
  { key: 'closed', label: 'Đã đóng' },
];

const STATUS_BADGE: Record<string, string> = {
  open: 'badge-warning',
  replied: 'badge-primary',
  resolved: 'badge-success',
  closed: 'badge-dark',
};

const STATUS_LABEL: Record<string, string> = {
  open: 'Đang mở',
  replied: 'Đã phản hồi',
  resolved: 'Đã giải quyết',
  closed: 'Đã đóng',
};

const PRIORITY_BADGE: Record<string, string> = {
  low: 'badge-dark',
  medium: 'badge-primary',
  high: 'badge-warning',
  urgent: 'badge-danger',
};

const PRIORITY_LABEL: Record<string, string> = {
  low: 'Thấp',
  medium: 'Trung bình',
  high: 'Cao',
  urgent: 'Khẩn cấp',
};

const CATEGORY_LABEL: Record<string, string> = {
  order: 'Đơn hàng',
  payment: 'Thanh toán',
  product: 'Sản phẩm',
  account: 'Tài khoản',
  technical: 'Kỹ thuật',
  other: 'Khác',
};

interface Message {
  sender: 'customer' | 'system';
  content: string;
  createdAt: string;
}

interface Ticket {
  id: string;
  ticketCode: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('vi-VN', {
  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
});

const formatTime = (dateStr: string) => {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return `${Math.floor(diff / 86400)} ngày trước`;
};

export const CustomerSupportPage = () => {
  const toast = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [newSubject, setNewSubject] = useState('');
  const [newCategory, setNewCategory] = useState('order');
  const [newPriority, setNewPriority] = useState('medium');
  const [newMessage, setNewMessage] = useState('');
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  /** Tải danh sách phiếu hỗ trợ từ server. */
  const loadTickets = useCallback(async () => {
    try {
      const data = await supportApi.list();
      setTickets(data as unknown as Ticket[]);
    } catch (err) {
      console.error('Load support tickets failed:', err);
      toast({
        title: 'Không tải được yêu cầu hỗ trợ',
        message: err instanceof Error ? err.message : 'Vui lòng thử lại.',
        variant: 'error',
      });
    }
  }, [toast]);

  useEffect(() => {
    void loadTickets();
  }, [loadTickets]);

  const filtered = tickets.filter(t => {
    if (tab !== 'all' && t.status !== tab) return false;
    if (category && t.category !== category) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!t.subject.toLowerCase().includes(q) && !t.ticketCode.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const openCount = tickets.filter(t => t.status === 'open').length;

  const handleCreateTicket = async () => {
    if (!newSubject.trim() || !newMessage.trim()) return;
    setIsSubmitting(true);
    try {
      const created = await supportApi.create({
        subject: newSubject.trim(),
        message: newMessage.trim(),
        category: newCategory,
        priority: newPriority,
      });
      setTickets(prev => [created as unknown as Ticket, ...prev]);
      setNewSubject('');
      setNewMessage('');
      setShowCreate(false);
      toast({ title: 'Đã gửi yêu cầu', message: 'Chúng tôi sẽ phản hồi sớm nhất.', variant: 'success' });
    } catch (err) {
      toast({
        title: 'Gửi yêu cầu thất bại',
        message: err instanceof Error ? err.message : 'Vui lòng thử lại.',
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !selectedTicket) return;
    setIsSubmitting(true);
    try {
      const updated = await supportApi.update(selectedTicket.id, {
        content: replyText.trim(),
      });
      const next = updated as unknown as Ticket;
      setTickets(prev => prev.map(t => (t.id === next.id ? next : t)));
      setSelectedTicket(next);
      setReplyText('');
    } catch (err) {
      toast({
        title: 'Gửi phản hồi thất bại',
        message: err instanceof Error ? err.message : 'Vui lòng thử lại.',
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="customer-support">
      {/* Header */}
      <div className="customer-support__header">
        <div>
          <h1 className="customer-support__title">Hỗ trợ khách hàng</h1>
          <p className="customer-support__subtitle">
            {openCount > 0 ? `Bạn có ${openCount} yêu cầu đang chờ xử lý` : 'Tất cả yêu cầu đã được xử lý'}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Gửi yêu cầu mới
        </button>
      </div>

      {/* Create Ticket Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-box__header">
              <h2 className="modal-box__title">Gửi yêu cầu hỗ trợ</h2>
              <button className="modal-box__close" onClick={() => setShowCreate(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="modal-box__body">
              <div className="input-group">
                <label className="input-label">Chủ đề <span>*</span></label>
                <input
                  type="text"
                  className="input"
                  placeholder="Mô tả ngắn gọn vấn đề của bạn..."
                  value={newSubject}
                  onChange={e => setNewSubject(e.target.value)}
                />
              </div>
              <div className="form-row-2">
                <div className="input-group">
                  <label className="input-label">Loại vấn đề</label>
                  <select className="input" value={newCategory} onChange={e => setNewCategory(e.target.value)}>
                    {CATEGORY_OPTIONS.filter(c => c.value).map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Mức độ ưu tiên</label>
                  <select className="input" value={newPriority} onChange={e => setNewPriority(e.target.value)}>
                    <option value="low">Thấp</option>
                    <option value="medium">Trung bình</option>
                    <option value="high">Cao</option>
                    <option value="urgent">Khẩn cấp</option>
                  </select>
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Nội dung <span>*</span></label>
                <textarea
                  className="input input-textarea"
                  rows={5}
                  placeholder="Mô tả chi tiết vấn đề của bạn..."
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-box__footer">
              <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Hủy</button>
              <button className="btn btn-primary" onClick={() => void handleCreateTicket()} disabled={isSubmitting}>
                {isSubmitting ? 'Đang gửi…' : 'Gửi yêu cầu'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="modal-overlay" onClick={() => setSelectedTicket(null)}>
          <div className="modal-box modal-box--wide" onClick={e => e.stopPropagation()}>
            <div className="modal-box__header">
              <div>
                <h2 className="modal-box__title">{selectedTicket.subject}</h2>
                <div className="modal-box__meta">
                  <span className={`badge ${PRIORITY_BADGE[selectedTicket.priority]}`}>
                    {PRIORITY_LABEL[selectedTicket.priority]}
                  </span>
                  <span className={`badge ${STATUS_BADGE[selectedTicket.status]}`}>
                    {STATUS_LABEL[selectedTicket.status]}
                  </span>
                  <span className="modal-box__ticket-code">{selectedTicket.ticketCode}</span>
                  <span className="modal-box__date">Gửi: {formatDate(selectedTicket.createdAt)}</span>
                </div>
              </div>
              <button className="modal-box__close" onClick={() => setSelectedTicket(null)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="modal-box__body modal-box__body--chat">
              <div className="support-chat">
                {selectedTicket.messages.map((msg, i) => (
                  <div key={i} className={`support-chat__bubble support-chat__bubble--${msg.sender}`}>
                    <div className="support-chat__avatar">
                      {msg.sender === 'customer' ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                          <circle cx="12" cy="7" r="4"/>
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                        </svg>
                      )}
                    </div>
                    <div className="support-chat__content">
                      <div className="support-chat__sender">
                        {msg.sender === 'customer' ? 'Bạn' : 'HenzoStore Support'}
                      </div>
                      <div className="support-chat__text">{msg.content}</div>
                      <div className="support-chat__time">{formatDate(msg.createdAt)}</div>
                    </div>
                  </div>
                ))}
              </div>
              {selectedTicket.status !== 'closed' && selectedTicket.status !== 'resolved' && (
                <div className="support-reply">
                  <textarea
                    className="input input-textarea"
                    rows={3}
                    placeholder="Nhập phản hồi của bạn..."
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                  />
                  <button className="btn btn-primary" onClick={() => void handleReply()} disabled={!replyText.trim() || isSubmitting}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                    Gửi phản hồi
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="customer-support__filters">
        <div className="support-tabs">
          {STATUS_TABS.map(t => (
            <button
              key={t.key}
              className={`support-tab ${tab === t.key ? 'active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
              {t.key === 'open' && openCount > 0 && (
                <span className="support-tab__badge">{openCount}</span>
              )}
            </button>
          ))}
        </div>
        <div className="support-toolbar">
          <div className="support-search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Tìm kiếm yêu cầu..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="input support-category-select"
            value={category}
            onChange={e => setCategory(e.target.value)}
          >
            {CATEGORY_OPTIONS.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Ticket List */}
      <div className="support-list">
        {filtered.length === 0 ? (
          <div className="support-empty">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <h3>Không có yêu cầu hỗ trợ nào</h3>
            <p>Không tìm thấy yêu cầu nào phù hợp với bộ lọc của bạn.</p>
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>Gửi yêu cầu mới</button>
          </div>
        ) : (
          filtered.map(ticket => (
            <div
              key={ticket.id}
              className={`support-ticket-card ${ticket.status === 'open' ? 'support-ticket-card--unread' : ''}`}
              onClick={() => setSelectedTicket(ticket)}
            >
              <div className="support-ticket-card__header">
                <div className="support-ticket-card__badges">
                  <span className={`badge ${PRIORITY_BADGE[ticket.priority]}`}>
                    {PRIORITY_LABEL[ticket.priority]}
                  </span>
                  <span className={`badge ${STATUS_BADGE[ticket.status]}`}>
                    {STATUS_LABEL[ticket.status]}
                  </span>
                  <span className="support-ticket-card__category">{CATEGORY_LABEL[ticket.category]}</span>
                </div>
                <span className="support-ticket-card__time">{formatTime(ticket.updatedAt)}</span>
              </div>
              <h3 className="support-ticket-card__subject">{ticket.subject}</h3>
              <div className="support-ticket-card__footer">
                <span className="support-ticket-card__code">{ticket.ticketCode}</span>
                <span className="support-ticket-card__replies">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  {ticket.messages.length} tin nhắn
                </span>
                <span className="support-ticket-card__view">Xem chi tiết →</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
