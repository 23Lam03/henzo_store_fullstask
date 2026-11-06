import { useState } from 'react';
import { useAdmin } from '../../../contexts/AdminContext';
import { AdminDataTable } from '../../../components/admin/AdminDataTable';
import { adminApi } from '../../../services/api/admin';
import type { Payment } from '../../../types';
import { formatNumber } from '../../../utils';
import { useToast } from '../../../contexts/ToastContext/ToastContext';
import { ConfirmModal } from '../../../components/common/ConfirmModal';
import './AdminPaymentPage.css';

const STATUS_OPTIONS = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Hoàn thành', value: 'completed' },
  { label: 'Đang chờ', value: 'pending' },
  { label: 'Thất bại', value: 'failed' },
  { label: 'Đã hoàn tiền', value: 'refunded' },
];

const METHOD_LABELS: Record<string, string> = {
  'COD': 'COD',
  'Chuyển khoản': 'Chuyển khoản',
  'VNPay': 'VNPay',
  'ZaloPay': 'ZaloPay',
  'MoMo': 'MoMo',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Đang chờ',
  completed: 'Hoàn thành',
  // Backend trả 'success' cho giao dịch của khách, 'completed' cho bảng admin.
  success: 'Hoàn thành',
  failed: 'Thất bại',
  refunded: 'Đã hoàn tiền',
};

export const AdminPaymentPage = () => {
  const { payments, refresh } = useAdmin();
  const toast = useToast();
  const [filter, setFilter] = useState('all');
  const [pendingRefund, setPendingRefund] = useState<Payment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Modal chi tiết — trước đây điều hướng tới route `/admin/payments/:id` không tồn tại.
  const [detail, setDetail] = useState<Payment | null>(null);

  /** Hoàn tiền — trước đây chỉ hiện toast "đang xử lý" mà không gọi API. */
  const handleRefund = async (payment: Payment) => {
    setIsSubmitting(true);
    try {
      await adminApi.refundPayment(payment.id);
      toast({ title: 'Đã hoàn tiền', variant: 'success' });
      await refresh();
    } catch (err) {
      console.error('Refund payment failed:', err);
      toast({
        title: 'Hoàn tiền thất bại',
        message: err instanceof Error ? err.message : 'Vui lòng thử lại.',
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
      setPendingRefund(null);
    }
  };

  const filtered = filter === 'all' ? payments : payments.filter(p => p.status === filter);

  const completedPayments = payments.filter(p => p.status === 'completed');
  const pendingPayments = payments.filter(p => p.status === 'pending');
  const totalRevenue = completedPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalPending = pendingPayments.reduce((sum, p) => sum + p.amount, 0);

  const columns = [
    { key: 'transactionId', label: 'Mã giao dịch', width: '150px',
      render: (_: unknown, r: Payment) => <code className="txn-id">{(r as Payment).transactionId}</code>,
    },
    { key: 'orderId', label: 'Mã đơn hàng', width: '140px',
      render: (_: unknown, r: Payment) => <code className="order-id-small">{(r as Payment).orderId.replace('order-', 'HDN-')}</code>,
    },
    {
      key: 'amount', label: 'Số tiền', sortable: true, align: 'right' as const, width: '150px',
      render: (_: unknown, r: Payment) => <span className="payment-amount">{formatNumber((r as Payment).amount)}đ</span>,
    },
    { key: 'method', label: 'Phương thức', align: 'center' as const, width: '130px',
      render: (_: unknown, r: Payment) => (
        <span className={`badge ${(r as Payment).method === 'COD' ? 'badge-warning' : 'badge-primary'}`}>
          {METHOD_LABELS[(r as Payment).method] || (r as Payment).method}
        </span>
      ),
    },
    {
      key: 'status', label: 'Trạng thái', align: 'center' as const, width: '130px',
      render: (_: unknown, r: Payment) => {
        const s = (r as Payment).status;
        return <span className={`admin-status admin-status--${s === 'completed' ? 'completed' : s === 'pending' ? 'pending' : s === 'failed' ? 'failed' : 'locked'}`}>{STATUS_LABELS[s]}</span>;
      },
    },
    { key: 'createdAt', label: 'Thời gian', sortable: true, width: '160px',
      render: (_: unknown, r: Payment) => new Date((r as Payment).createdAt).toLocaleString('vi-VN'),
    },
  ];

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <div>
          <h1 className="admin-page__title">Quản Lý Thanh Toán</h1>
          <p className="admin-page__subtitle">Theo dõi và quản lý các giao dịch thanh toán trên hệ thống</p>
        </div>
        <div className="admin-page-header__actions">
          <span className="admin-page__meta">{formatNumber(payments.length)} giao dịch</span>
        </div>
      </div>

      <div className="admin-stats admin-stats--3">
        <div className="admin-stat-card">
          <div className="admin-stat-card__icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#2F7D52' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <div className="admin-stat-card__info">
            <p className="admin-stat-card__label">Doanh thu hoàn thành</p>
            <p className="admin-stat-card__value">{formatNumber(totalRevenue)}đ</p>
            <span className="admin-stat-card__change admin-stat-card__change--up">{completedPayments.length} giao dịch</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-card__icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#A9741A' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div className="admin-stat-card__info">
            <p className="admin-stat-card__label">Đang chờ xử lý</p>
            <p className="admin-stat-card__value">{formatNumber(totalPending)}đ</p>
            <span className="admin-stat-card__change admin-stat-card__change--up">{pendingPayments.length} giao dịch</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-card__icon" style={{ background: 'rgba(31, 85, 87, 0.1)', color: '#1F5557' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
          </div>
          <div className="admin-stat-card__info">
            <p className="admin-stat-card__label">Tổng giao dịch</p>
            <p className="admin-stat-card__value">{formatNumber(payments.length)}</p>
            <span className="admin-stat-card__change admin-stat-card__change--up">Tất cả</span>
          </div>
        </div>
      </div>

      <div className="admin-section">
        <AdminDataTable
          columns={columns}
          data={filtered}
          rowKey="id"
          filterable
          filterOptions={STATUS_OPTIONS}
          currentFilter={filter}
          onFilterChange={setFilter}
          searchable
          searchableFields={['transactionId', 'orderId']}
          actions={(record) => (
            <>
              <button className="btn btn-sm btn-secondary" onClick={() => setDetail(record as Payment)}>Chi tiết</button>
              {(record as Payment).status === 'completed' && (
                <button className="btn btn-sm btn-outline" onClick={() => setPendingRefund(record as Payment)}>Hoàn tiền</button>
              )}
            </>
          )}
          emptyText="Không có giao dịch nào"
        />

        <ConfirmModal
          open={!!pendingRefund}
          title="Xác nhận hoàn tiền"
          message="Bạn có chắc muốn hoàn tiền cho giao dịch này? Hành động này không thể hoàn tác."
          confirmLabel="Hoàn tiền"
          variant="danger"
          loading={isSubmitting}
          onConfirm={() => {
            if (pendingRefund) void handleRefund(pendingRefund);
          }}
          onCancel={() => setPendingRefund(null)}
        />

        {/* Modal chi tiết giao dịch */}
        {detail && (
          <div className="admin-modal-overlay" onClick={() => setDetail(null)}>
            <div className="admin-modal" onClick={e => e.stopPropagation()}>
              <div className="admin-modal__header">
                <h2 className="admin-modal__title">Chi tiết giao dịch</h2>
                <button className="admin-modal__close" onClick={() => setDetail(null)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              <div className="admin-modal__body">
                <div className="admin-detail-section">
                  <div className="admin-detail-row">
                    <span className="admin-detail-label">Mã giao dịch</span>
                    <span className="admin-detail-value"><code>{detail.transactionId}</code></span>
                  </div>
                  <div className="admin-detail-row">
                    <span className="admin-detail-label">Mã đơn hàng</span>
                    <span className="admin-detail-value">{detail.orderCode || detail.orderId}</span>
                  </div>
                  <div className="admin-detail-row">
                    <span className="admin-detail-label">Cửa hàng</span>
                    <span className="admin-detail-value">{detail.storeName || '—'}</span>
                  </div>
                </div>
                <div className="admin-detail-section">
                  <h4 className="admin-detail-section__title">Số tiền</h4>
                  <div className="admin-detail-row">
                    <span className="admin-detail-label">Tổng thanh toán</span>
                    <span className="admin-detail-value">{formatNumber(detail.amount)}đ</span>
                  </div>
                  <div className="admin-detail-row">
                    <span className="admin-detail-label">Phí sàn</span>
                    <span className="admin-detail-value">{formatNumber(detail.platformFee ?? 0)}đ</span>
                  </div>
                  <div className="admin-detail-row">
                    <span className="admin-detail-label">Cửa hàng nhận</span>
                    <span className="admin-detail-value">{formatNumber(detail.netAmount ?? detail.amount)}đ</span>
                  </div>
                </div>
                <div className="admin-detail-section">
                  <div className="admin-detail-row">
                    <span className="admin-detail-label">Phương thức</span>
                    <span className="admin-detail-value">{METHOD_LABELS[detail.method] || detail.method}</span>
                  </div>
                  <div className="admin-detail-row">
                    <span className="admin-detail-label">Trạng thái</span>
                    <span className="admin-detail-value">{STATUS_LABELS[detail.status] ?? detail.status}</span>
                  </div>
                  <div className="admin-detail-row">
                    <span className="admin-detail-label">Thời gian</span>
                    <span className="admin-detail-value">{new Date(detail.createdAt).toLocaleString('vi-VN')}</span>
                  </div>
                  {detail.note && (
                    <div className="admin-detail-row">
                      <span className="admin-detail-label">Ghi chú</span>
                      <span className="admin-detail-value">{detail.note}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="admin-modal__footer">
                <button className="btn btn-secondary" onClick={() => setDetail(null)}>Đóng</button>
                {detail.status === 'completed' && (
                  <button
                    className="btn btn-danger"
                    onClick={() => {
                      setPendingRefund(detail);
                      setDetail(null);
                    }}
                  >
                    Hoàn tiền
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
