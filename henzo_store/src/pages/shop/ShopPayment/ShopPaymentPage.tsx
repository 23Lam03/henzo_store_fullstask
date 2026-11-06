import { useState, useMemo } from 'react';
import { useSeller } from '../../../contexts/SellerContext';
import { PLATFORM_FEE_LABEL } from '../../../constants';
import './ShopPaymentPage.css';

const formatVND = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);
const formatNum = (n: number) => new Intl.NumberFormat('vi-VN').format(n);

const STATUS_FILTERS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'success', label: 'Thành công' },
  { key: 'pending', label: 'Chờ xử lý' },
  { key: 'refunded', label: 'Hoàn tiền' },
  { key: 'failed', label: 'Thất bại' },
];

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cod: 'COD', banking: 'CK ngân hàng', vnpay: 'VNPay', momo: 'MoMo', zalopay: 'ZaloPay',
};

const STATUS_BADGE: Record<string, string> = {
  success: 'badge-success', pending: 'badge-warning', refunded: 'badge-danger', failed: 'badge-danger',
};
const STATUS_LABEL: Record<string, string> = {
  success: 'Thành công', pending: 'Chờ xử lý', refunded: 'Hoàn tiền', failed: 'Thất bại',
};

export const ShopPaymentPage = () => {
  const { payments } = useSeller();
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 15;

  const filtered = useMemo(() => {
    let list = statusFilter === 'all' ? payments : payments.filter(p => p.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => p.transactionId.toLowerCase().includes(q) || p.orderCode.toLowerCase().includes(q));
    }
    return list;
  }, [payments, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const summary = {
    total: payments.length,
    success: payments.filter(p => p.status === 'success').length,
    totalRevenue: payments.filter(p => p.status === 'success').reduce((s, p) => s + p.amount, 0),
    totalFee: payments.filter(p => p.status === 'success').reduce((s, p) => s + p.platformFee, 0),
    totalNet: payments.filter(p => p.status === 'success').reduce((s, p) => s + p.netAmount, 0),
  };

  return (
    <div className="seller-payment admin-page">
      <div className="admin-page__header">
        <div>
          <h1 className="admin-page__title">Quản lý thanh toán</h1>
          <p className="admin-page__subtitle">Theo dõi giao dịch và doanh thu</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="admin-stats admin-stats--4">
        <div className="seller-payment-stat">
          <div className="seller-payment-stat__icon" style={{ background: 'rgba(31,85,87,0.1)', color: '#1F5557' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
          </div>
          <div>
            <p className="seller-payment-stat__label">Tổng giao dịch</p>
            <p className="seller-payment-stat__value">{formatNum(summary.total)}</p>
          </div>
        </div>
        <div className="seller-payment-stat">
          <div className="seller-payment-stat__icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#2F7D52' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div>
            <p className="seller-payment-stat__label">Thành công</p>
            <p className="seller-payment-stat__value">{formatNum(summary.success)}</p>
          </div>
        </div>
        <div className="seller-payment-stat">
          <div className="seller-payment-stat__icon" style={{ background: 'rgba(239,68,68,0.1)', color: '#B4322F' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <div>
            <p className="seller-payment-stat__label">Tổng doanh thu</p>
            <p className="seller-payment-stat__value">{formatVND(summary.totalRevenue)}</p>
          </div>
        </div>
        <div className="seller-payment-stat">
          <div className="seller-payment-stat__icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#A9741A' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <div>
            <p className="seller-payment-stat__label">Doanh thu thực nhận</p>
            <p className="seller-payment-stat__value">{formatVND(summary.totalNet)}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="seller-payment__toolbar">
        <div className="seller-tabs" style={{ borderBottom: 'none', marginBottom: 0 }}>
          {STATUS_FILTERS.map(f => (
            <button key={f.key} className={`seller-tab ${statusFilter === f.key ? 'seller-tab--active' : ''}`} onClick={() => { setStatusFilter(f.key); setPage(1); }}>
              {f.label}
              {f.key !== 'all' && (
                <span className="seller-tab__count">{payments.filter(p => p.status === f.key).length}</span>
              )}
            </button>
          ))}
        </div>
        <div className="seller-payment__search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" placeholder="Tìm mã giao dịch, mã đơn..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="seller-orders__search-input" />
        </div>
      </div>

      {/* Table */}
      <div className="admin-section">
        <div className="seller-table-wrap">
          <table className="seller-table">
            <thead>
              <tr>
                <th>Mã giao dịch</th>
                <th>Đơn hàng</th>
                <th>Số tiền</th>
                <th>Phí sàn ({PLATFORM_FEE_LABEL})</th>
                <th>Thực nhận</th>
                <th>Phương thức</th>
                <th>Trạng thái</th>
                <th>Ngày</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={8}><div className="seller-empty"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg><p>Không có giao dịch nào</p></div></td></tr>
              ) : paginated.map(p => (
                <tr key={p.id}>
                  <td><span className="seller-order-code">{p.transactionId}</span></td>
                  <td><span className="seller-order-code">{p.orderCode}</span></td>
                  <td><strong>{formatVND(p.amount)}</strong></td>
                  <td style={{ color: 'var(--color-warning)' }}>-{formatVND(p.platformFee)}</td>
                  <td><strong style={{ color: 'var(--color-success)' }}>{formatVND(p.netAmount)}</strong></td>
                  <td><span className="seller-payment-method">{PAYMENT_METHOD_LABELS[p.paymentMethod] || p.paymentMethod}</span></td>
                  <td><span className={`badge ${STATUS_BADGE[p.status]}`}>{STATUS_LABEL[p.status]}</span></td>
                  <td>{new Date(p.createdAt).toLocaleDateString('vi-VN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length > perPage && (
          <div className="seller-pagination">
            <span className="seller-pagination__info">Hiển thị {(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} của {filtered.length}</span>
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
      </div>
    </div>
  );
};
