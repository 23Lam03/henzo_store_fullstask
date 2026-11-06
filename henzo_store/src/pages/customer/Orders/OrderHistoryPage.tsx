import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useOrder, useReview } from '../../../contexts';
import { ROUTES } from '../../../constants/routes';
import { Icon } from '../../../components/common/Icon';
import { EmptyState } from '../../../components/common/EmptyState';
import './OrderHistoryPage.css';

type ReviewFormState = {
  orderId: string;
  productId: string;
  productName: string;
  productImage: string;
};

const fmt = (p: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(p);

const STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  processing: 'Đang xử lý',
  shipping: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy',
};

const STATUS_CLASSES: Record<string, string> = {
  pending: 'badge-warning',
  confirmed: 'badge-primary',
  processing: 'badge-accent',
  shipping: 'badge-accent',
  delivered: 'badge-success',
  cancelled: 'badge-danger',
};

export const OrderHistoryPage = () => {
  const { orders } = useOrder();
  const { createReview, hasReviewedProduct } = useReview();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [reviewTarget, setReviewTarget] = useState<ReviewFormState | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const filtered = orders.filter(order => {
    if (filter !== 'all' && order.status !== filter) return false;
    if (search && !order.orderNumber.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const filterBtns = [
    { id: 'all', label: 'Tất cả' },
    { id: 'pending', label: 'Chờ xác nhận' },
    { id: 'confirmed', label: 'Đã xác nhận' },
    { id: 'shipping', label: 'Đang giao' },
    { id: 'delivered', label: 'Đã giao' },
    { id: 'cancelled', label: 'Đã hủy' },
  ];

  const openReview = (orderId: string, productId: string, productName: string, productImage: string) => {
    setReviewTarget({ orderId, productId, productName, productImage });
    setRating(5);
    setComment('');
  };

  const submitReview = () => {
    if (!reviewTarget || !comment.trim()) return;

    createReview({
      orderId: reviewTarget.orderId,
      productId: reviewTarget.productId,
      rating,
      comment,
    });

    setReviewTarget(null);
    setComment('');
    setRating(5);
  };

  return (
    <div className="order-history-page">
      <div className="container">
        <h1 className="order-history-page__title">
          <Icon name="package" size={24} />
          Lịch sử đơn hàng
        </h1>

        <div className="order-history-filters">
          <div className="order-search">
            <Icon name="search" size={16} />
            <input type="text" placeholder="Tìm theo mã đơn hàng..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="order-filter-tabs">
            {filterBtns.map(btn => (
              <button key={btn.id} className={`filter-tab ${filter === btn.id ? 'is-active' : ''}`} onClick={() => setFilter(btn.id)}>
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon="package"
            title="Không có đơn hàng nào"
            description={search ? 'Không tìm thấy đơn hàng khớp với mã bạn đã nhập.' : 'Bạn chưa có đơn hàng nào. Hãy khám phá các sản phẩm hot nhất ngay.'}
            action={{ label: 'Đi đến cửa hàng', to: ROUTES.PRODUCTS }}
          />
        ) : (
          <div className="order-list">
            {filtered.map(order => {
              const firstProduct = order.items[0]?.product;
              const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0) || 1;
              const reviewDisabled = !firstProduct || hasReviewedProduct(order.id, firstProduct.id);

              return (
                <div key={order.id} className="order-card card">
                  <div className="order-card__header">
                    <div className="order-card__info">
                      <span className="order-card__num">{order.orderNumber}</span>
                      <span className="order-card__date">
                        Đặt ngày {new Date(order.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="order-card__meta">
                      <span className={`badge ${STATUS_CLASSES[order.status]}`}>{STATUS_LABELS[order.status]}</span>
                      <span className="order-card__items">{totalItems} sản phẩm</span>
                    </div>
                  </div>
                  <div className="order-card__footer">
                    <span className="order-card__total">
                      Tổng: <strong>{fmt(order.totalPrice)}</strong>
                    </span>
                    <div className="order-card__actions">
                      <Link to={ROUTES.ORDER_DETAIL.replace(':id', order.id)} className="btn btn-secondary btn-sm">Chi tiết</Link>
                      {order.status === 'delivered' && firstProduct && (
                        <button className="btn btn-outline btn-sm" onClick={() => openReview(order.id, firstProduct.id, firstProduct.name, firstProduct.images[0])} disabled={reviewDisabled}>
                          {reviewDisabled ? 'Đã đánh giá' : 'Đánh giá'}
                        </button>
                      )}
                      {order.status === 'shipping' && (
                        <Link to={ROUTES.ORDER_TRACKING.replace(':id', order.id)} className="btn btn-primary btn-sm">Theo dõi</Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {reviewTarget && (
        <div className="admin-modal-overlay" onClick={() => setReviewTarget(null)}>
          <div className="admin-modal review-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h3 className="admin-modal__title">Đánh giá sản phẩm</h3>
              <button className="admin-modal__close" onClick={() => setReviewTarget(null)}>×</button>
            </div>
            <div className="admin-modal__body">
              <p className="review-modal__product">{reviewTarget.productName}</p>
              <div className="review-modal__stars">
                {Array.from({ length: 5 }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`review-modal__star ${i < rating ? 'is-filled' : ''}`}
                    onClick={() => setRating(i + 1)}
                    aria-label={`${i + 1} sao`}
                  >
                    <Icon name="star" size={22} />
                  </button>
                ))}
              </div>
              <textarea className="input" rows={5} placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..." value={comment} onChange={e => setComment(e.target.value)} />
            </div>
            <div className="admin-modal__footer review-modal__footer">
              <button className="btn btn-secondary" onClick={() => setReviewTarget(null)}>Hủy</button>
              <button className="btn btn-primary" onClick={submitReview} disabled={!comment.trim()}>Gửi đánh giá</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
