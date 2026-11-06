import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { adminApi } from '../../../services/api/admin';
import { ConfirmModal } from '../../../components/common/ConfirmModal';
import { useToast } from '../../../contexts/ToastContext/ToastContext';
import { formatNumber } from '../../../utils';
import type { Order, Payment } from '../../../types';
import './AdminOrderDetailPage.css';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  processing: 'Đang xử lý',
  shipping: 'Đang giao',
  delivered: 'Hoàn thành',
  cancelled: 'Đã hủy',
};

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'pending', label: 'Chờ xác nhận' },
  { value: 'confirmed', label: 'Đã xác nhận' },
  { value: 'processing', label: 'Đang xử lý' },
  { value: 'shipping', label: 'Đang giao' },
  { value: 'delivered', label: 'Hoàn thành' },
  { value: 'cancelled', label: 'Đã hủy' },
];

export const AdminOrderDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();

  const [order, setOrder] = useState<Order | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      try {
        const res = await adminApi.order(id);
        if (cancelled) return;
        setOrder(res.order);
        setPayments(res.payments);
        setNotFound(false);
      } catch (err) {
        console.error('Load admin order detail failed:', err);
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

    const handleChangeStatus = async (status: string) => {
    if (!order) return;
    setIsSubmitting(true);
    try {
      const updated = await adminApi.updateOrderStatus(order.id, status);
      setOrder(updated);
      toast({ title: 'Đã cập nhật trạng thái đơn', variant: 'success' });
      setPendingStatus(null);
    } catch (err) {
      console.error('Update order status failed:', err);
      toast({
        title: 'Cập nhật thất bại',
        message: err instanceof Error ? err.message : 'Vui lòng thử lại.',
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="admin-page">
        <p className="text-muted">Đang tải đơn hàng...</p>
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div className="admin-page">
        <div className="admin-page__header">
          <Link to="/admin/orders" className="btn btn-sm btn-secondary">
            ← Quay lại
          </Link>
        </div>
        <div className="admin-section">
          <p className="text-muted">Không tìm thấy đơn hàng.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <div className="admin-page-header__back">
          <Link to="/admin/orders" className="btn btn-sm btn-secondary">
            ← Quay lại
          </Link>
        </div>
        <div>
          <h1 className="admin-page__title">Chi tiết đơn hàng #{order.orderNumber}</h1>
          <p className="admin-page__subtitle">
            Đặt ngày {new Date(order.createdAt).toLocaleDateString('vi-VN')}
          </p>
        </div>
        <div className="admin-page-header__actions">
          <span className={`admin-status admin-status--${order.status}`}>
            {STATUS_LABELS[order.status] ?? order.status}
          </span>
        </div>
      </div>

      <div className="admin-section">
        <h3 className="admin-section__title">Cập nhật trạng thái</h3>
        <div className="admin-form-row">
          <select
            className="admin-form-select"
            value={order.status}
            disabled={order.status === 'delivered'}
            onChange={e => setPendingStatus(e.target.value)}
          >
            {STATUS_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="admin-section admin-section--split">
        <div className="admin-detail-card">
          <h3 className="admin-detail-card__title">Thông tin giao hàng</h3>
          <div className="admin-detail-card__row">
            <span>Người nhận</span>
            <strong>{order.customerName}</strong>
          </div>
          <div className="admin-detail-card__row">
            <span>Điện thoại</span>
            <strong>{order.customerPhone}</strong>
          </div>
          <div className="admin-detail-card__row">
            <span>Địa chỉ</span>
            <strong>{order.shippingAddress}</strong>
          </div>
          <div className="admin-detail-card__row">
            <span>Phương thức thanh toán</span>
            <span className="badge badge-secondary">{order.paymentMethod}</span>
          </div>
          <div className="admin-detail-card__row">
            <span>Trạng thái thanh toán</span>
            <span className="badge badge-secondary">{order.paymentStatus}</span>
          </div>
        </div>

        <div className="admin-detail-card">
          <h3 className="admin-detail-card__title">Tóm tắt đơn hàng</h3>
          <div className="admin-detail-card__row">
            <span>Tạm tính</span>
            <span>{formatNumber(order.subtotal)}đ</span>
          </div>
          <div className="admin-detail-card__row">
            <span>Phí vận chuyển</span>
            <span>{formatNumber(order.shippingFee)}đ</span>
          </div>
          {order.discount > 0 && (
            <div className="admin-detail-card__row">
              <span>Giảm giá</span>
              <span className="text-danger">-{formatNumber(order.discount)}đ</span>
            </div>
          )}
          <div className="admin-detail-card__row admin-detail-card__row--total">
            <span>Tổng cộng</span>
            <strong className="text-danger">{formatNumber(order.totalPrice)}đ</strong>
          </div>
        </div>
      </div>

      {}
      {payments.length > 0 && (
        <div className="admin-section">
          <h3 className="admin-section__title">Giao dịch thanh toán</h3>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã giao dịch</th>
                <th>Cửa hàng</th>
                <th style={{ textAlign: 'right' }}>Số tiền</th>
                <th style={{ textAlign: 'right' }}>Phí sàn</th>
                <th style={{ textAlign: 'center' }}>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id}>
                  <td><code className="ticket-id">{p.transactionId}</code></td>
                  <td>{p.storeName ?? '—'}</td>
                  <td style={{ textAlign: 'right' }}>{formatNumber(p.amount)}đ</td>
                  <td style={{ textAlign: 'right' }}>{formatNumber(p.platformFee ?? 0)}đ</td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="badge badge-secondary">{p.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="admin-section">
        <h3 className="admin-section__title">Sản phẩm trong đơn</h3>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Sản phẩm</th>
              <th style={{ textAlign: 'right' }}>Đơn giá</th>
              <th style={{ textAlign: 'center' }}>Số lượng</th>
              <th style={{ textAlign: 'right' }}>Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, idx) => (
              <tr key={idx}>
                <td>
                  <div className="order-item-cell">
                    <img src={item.product.images[0]} alt={item.product.name} className="order-item-thumb"
                      onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/48x48/cccccc/999999?text=No'; }} />
                    <span>{item.product.name}</span>
                  </div>
                </td>
                <td style={{ textAlign: 'right' }}>{formatNumber(item.product.price)}đ</td>
                <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                <td style={{ textAlign: 'right' }}>{formatNumber(item.product.price * item.quantity)}đ</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        open={!!pendingStatus}
        title="Cập nhật trạng thái đơn"
        message={
          pendingStatus === 'cancelled'
            ? 'Huỷ đơn sẽ hoàn tồn kho cho các sản phẩm chưa giao và hoàn tiền các giao dịch tương ứng. Xác nhận?'
            : `Chuyển trạng thái đơn sang "${STATUS_LABELS[pendingStatus ?? ''] ?? pendingStatus}"?`
        }
        confirmLabel="Xác nhận"
        variant={pendingStatus === 'cancelled' ? 'danger' : 'primary'}
        loading={isSubmitting}
        onConfirm={() => {
          if (pendingStatus) void handleChangeStatus(pendingStatus);
        }}
        onCancel={() => setPendingStatus(null)}
      />
    </div>
  );
};
