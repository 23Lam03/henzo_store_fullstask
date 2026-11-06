import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useOrder } from '../../../contexts';
import { useToast } from '../../../contexts/ToastContext/ToastContext';
import { ConfirmModal } from '../../../components/common/ConfirmModal';
import { ROUTES } from '../../../constants/routes';
import './OrderDetailPage.css';

const fmt = (p: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(p);

const formatDateTime = (date: string) => new Intl.DateTimeFormat('vi-VN', {
  hour: '2-digit',
  minute: '2-digit',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
}).format(new Date(date));

const addHours = (date: string, hours: number) => {
  const d = new Date(date);
  d.setHours(d.getHours() + hours);
  return d.toISOString();
};

const TIMELINE_STEPS = [
  { step: 'order', label: 'Đặt hàng' },
  { step: 'confirmed', label: 'Xác nhận đơn' },
  { step: 'processing', label: 'Đang xử lý' },
  { step: 'shipping', label: 'Đang giao' },
  { step: 'delivered', label: 'Giao thành công' },
] as const;

const STATUS_PROGRESS = {
  pending: 1,
  confirmed: 2,
  processing: 3,
  shipping: 4,
  delivered: 5,
  cancelled: 1,
} as const;

const buildTimeline = (createdAt: string, status: keyof typeof STATUS_PROGRESS) => {
  if (status === 'cancelled') {
    return [
      { step: 'order', label: 'Đặt hàng', time: formatDateTime(createdAt), done: true },
      { step: 'cancelled', label: 'Đã hủy đơn', time: formatDateTime(addHours(createdAt, 2)), done: true },
    ];
  }

  const progress = STATUS_PROGRESS[status];

  return TIMELINE_STEPS.map((item, index) => {
    const stepNumber = index + 1;
    return {
      ...item,
      done: stepNumber <= progress,
      time: stepNumber <= progress ? formatDateTime(addHours(createdAt, index === 0 ? 0 : index)) : '',
    };
  });
};

export const OrderDetailPage = () => {
  const { id } = useParams();
  const { getOrderById, cancelOrder } = useOrder();
  const toast = useToast();
  const [pendingCancel, setPendingCancel] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const order = id ? getOrderById(id) : undefined;

    const handleCancelOrder = async () => {
    if (!order) return;
    setIsSubmitting(true);
    try {
      await cancelOrder(order.id, 'Khách hàng huỷ đơn');
      toast({ title: 'Đã huỷ đơn hàng', variant: 'success' });
      setPendingCancel(false);
    } catch (err) {
      console.error('Cancel order failed:', err);
      toast({
        title: 'Huỷ đơn thất bại',
        message: err instanceof Error ? err.message : 'Vui lòng thử lại.',
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!order) {
    return (
      <div className="order-detail-page">
        <div className="container">
          <div className="order-detail-page__breadcrumb">
            <Link to={ROUTES.ORDERS}>← Lịch sử đơn hàng</Link>
          </div>
          <div className="card" style={{ padding: '32px' }}>
            <h2>Không tìm thấy đơn hàng</h2>
            <p>Đơn hàng này không tồn tại hoặc đã bị xóa.</p>
          </div>
        </div>
      </div>
    );
  }

  const timeline = buildTimeline(order.createdAt, order.status);
  const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0) || 1;

  return (
    <div className="order-detail-page">
      <div className="container">
        <div className="order-detail-page__breadcrumb">
          <Link to={ROUTES.ORDERS}>← Lịch sử đơn hàng</Link>
        </div>

        <h1 className="order-detail-page__title">Chi tiết đơn hàng {order.orderNumber}</h1>

        <div className="order-detail-layout">
          <div className="order-detail-main">
            <div className="order-timeline card">
              <h3>Trạng thái đơn hàng</h3>
              <div className="timeline">
                {timeline.map((t, i) => (
                  <div key={t.step} className={`timeline-item ${t.done ? 'done' : ''} ${i === timeline.length - 1 ? 'last' : ''}`}>
                    <div className="timeline-item__dot">
                      {t.done && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                    </div>
                    <div className="timeline-item__info">
                      <span className="timeline-item__label">{t.label}</span>
                      {t.time && <span className="timeline-item__time">{t.time}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="order-items card">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
                <h3>Sản phẩm đã đặt ({totalItems})</h3>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {order.status === 'shipping' && (
                    <Link to={ROUTES.ORDER_TRACKING.replace(':id', order.id)} className="btn btn-primary btn-sm">Theo dõi đơn hàng</Link>
                  )}
                  {order.status === 'delivered' && order.items[0]?.product && (
                    <Link to={ROUTES.PRODUCT_DETAIL.replace(':slug', order.items[0].product.slug)} className="btn btn-outline btn-sm">Đánh giá sản phẩm</Link>
                  )}
                  {order.status === 'pending' && (
                    <button className="btn btn-outline btn-sm" onClick={() => setPendingCancel(true)}>
                      Huỷ đơn hàng
                    </button>
                  )}
                </div>
              </div>

              {order.items.length > 0 ? order.items.map(item => (
                <div key={item.product.id} className="order-item">
                  <img src={item.product.images[0]} alt={item.product.name} />
                  <div className="order-item__info">
                    <span className="order-item__brand">{item.product.brand}</span>
                    <span className="order-item__name">{item.product.name}</span>
                    <span className="order-item__qty">x{item.quantity}</span>
                  </div>
                  <span className="order-item__price">{fmt(item.product.price * item.quantity)}</span>
                </div>
              )) : (
                <p>Đơn hàng mẫu chưa có chi tiết sản phẩm.</p>
              )}
            </div>
          </div>

          <div className="order-detail-sidebar">
            <div className="order-summary card">
              <h3>Tổng cộng</h3>
              <div className="order-summary__row order-summary__row--total"><span>Tổng</span><span>{fmt(order.totalPrice)}</span></div>
            </div>

            <div className="order-info card">
              <h3>Thông tin đơn hàng</h3>
              <div className="order-info__row"><span>Ngày đặt</span><span>{new Date(order.createdAt).toLocaleDateString('vi-VN')}</span></div>
              <div className="order-info__row"><span>Phương thức</span><span>{order.paymentMethod}</span></div>
              <div className="order-info__row"><span>Địa chỉ giao</span><span>{order.shippingAddress}</span></div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={pendingCancel}
        title="Huỷ đơn hàng"
        message="Bạn có chắc muốn huỷ đơn hàng này? Tồn kho sẽ được hoàn lại cho cửa hàng."
        confirmLabel="Huỷ đơn"
        variant="danger"
        loading={isSubmitting}
        onConfirm={() => void handleCancelOrder()}
        onCancel={() => setPendingCancel(false)}
      />
    </div>
  );
};
