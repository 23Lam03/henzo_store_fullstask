import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useOrder } from '../../../contexts';
import { ROUTES } from '../../../constants/routes';
import './ShippingTrackingPage.css';

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

const statusToStep = {
  pending: 1,
  confirmed: 2,
  processing: 3,
  shipping: 5,
  delivered: 6,
  cancelled: 1,
} as const;

export const ShippingTrackingPage = () => {
  const { id } = useParams();
  const { getOrderById } = useOrder();
  const order = id ? getOrderById(id) : undefined;

  const tracking = useMemo(() => {
    if (!order) return [];

    const currentStep = statusToStep[order.status];

    return [
      { step: 'ordered', label: 'Đơn hàng đã đặt', time: formatDateTime(order.createdAt), location: 'Hệ thống HenzoStore', done: currentStep >= 1, current: currentStep === 1 },
      { step: 'confirmed', label: 'Đã xác nhận', time: currentStep >= 2 ? formatDateTime(addHours(order.createdAt, 1)) : '', location: currentStep >= 2 ? 'Trung tâm xác nhận đơn hàng' : '', done: currentStep >= 2, current: currentStep === 2 },
      { step: 'processing', label: 'Đang chuẩn bị', time: currentStep >= 3 ? formatDateTime(addHours(order.createdAt, 2)) : '', location: currentStep >= 3 ? 'Kho xử lý đơn hàng' : '', done: currentStep >= 3, current: currentStep === 3 },
      { step: 'handover', label: 'Bàn giao vận chuyển', time: (currentStep as number) >= 4 ? formatDateTime(addHours(order.createdAt, 4)) : '', location: (currentStep as number) >= 4 ? 'Bưu cục tiếp nhận' : '', done: (currentStep as number) >= 4, current: (currentStep as number) === 4 },
      { step: 'shipping', label: 'Đang vận chuyển', time: currentStep >= 5 ? formatDateTime(addHours(order.createdAt, 6)) : '', location: currentStep >= 5 ? 'Trung tâm phân loại' : '', done: currentStep > 5, current: currentStep === 5 },
      { step: 'delivered', label: 'Giao thành công', time: currentStep >= 6 ? formatDateTime(addHours(order.createdAt, 24)) : '', location: currentStep >= 6 ? order.shippingAddress : '', done: currentStep >= 6, current: currentStep === 6 },
    ];
  }, [order]);

  if (!order) {
    return (
      <div className="shipping-tracking-page">
        <div className="container">
          <h1 className="shipping-tracking-page__title">Theo dõi vận chuyển</h1>
          <div className="card" style={{ padding: '32px' }}>
            <h2>Không tìm thấy đơn hàng</h2>
            <p>Đơn hàng này không tồn tại hoặc chưa sẵn sàng để theo dõi.</p>
            <Link to={ROUTES.ORDERS} className="btn btn-primary" style={{ marginTop: '16px' }}>Quay lại đơn hàng</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="shipping-tracking-page">
      <div className="container">
        <div style={{ marginBottom: '16px' }}>
          <Link to={ROUTES.ORDER_DETAIL.replace(':id', order.id)}>← Quay lại chi tiết đơn</Link>
        </div>
        <h1 className="shipping-tracking-page__title">Theo dõi vận chuyển</h1>

        <div className="shipping-info card">
          <div className="shipping-info__header">
            <div>
              <span className="shipping-info__label">Mã đơn hàng</span>
              <span className="shipping-info__value">{order.orderNumber}</span>
            </div>
            <div>
              <span className="shipping-info__label">Đơn vị vận chuyển</span>
              <span className="shipping-info__value">Giao hàng nhanh (GHN)</span>
            </div>
            <div>
              <span className="shipping-info__label">Địa chỉ giao</span>
              <span className="shipping-info__value">{order.shippingAddress}</span>
            </div>
          </div>
        </div>

        <div className="shipping-timeline card">
          <h3>Chi tiết lộ trình</h3>
          <div className="tracking-timeline">
            {tracking.map((t, i) => (
              <div key={t.step} className={`tracking-step ${t.done ? 'done' : ''} ${t.current ? 'current' : ''}`}>
                <div className="tracking-step__track">
                  <div className="tracking-step__dot">
                    {t.done ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    ) : t.current ? (
                      <div className="tracking-step__pulse" />
                    ) : null}
                  </div>
                  {i < tracking.length - 1 && <div className={`tracking-step__line ${t.done ? 'done' : ''}`} />}
                </div>
                <div className="tracking-step__content">
                  <span className="tracking-step__label">{t.label}</span>
                  {t.time && <span className="tracking-step__time">{t.time}</span>}
                  {t.location && <span className="tracking-step__location">{t.location}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
