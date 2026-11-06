import { useState, useMemo } from 'react';
import { useAdmin } from '../../../contexts/AdminContext';
import { AdminDataTable } from '../../../components/admin/AdminDataTable';
import type { Review } from '../../../types';
import { useToast } from '../../../contexts/ToastContext/ToastContext';
import { ConfirmModal } from '../../../components/common/ConfirmModal';
import './AdminReviewPage.css';

const STATUS_OPTIONS = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Hiển thị', value: 'visible' },
  { label: 'Đã ẩn', value: 'hidden' },
];

const renderStars = (rating: number) => (
  <div className="admin-stars">
    {Array.from({ length: 5 }, (_, i) => (
      <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={i < rating ? '#A9741A' : 'none'} stroke="#A9741A" strokeWidth="1.5">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ))}
  </div>
);

export const AdminReviewPage = () => {
  const { reviews, approveReview, hideReview, deleteReview } = useAdmin();
  const toast = useToast();
  const [filter, setFilter] = useState('all');
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Modal chi tiết — trước đây điều hướng tới route `/admin/reviews/:id` không tồn tại.
  const [detail, setDetail] = useState<(Review & { isHidden: boolean }) | null>(null);

  const enrichedReviews = useMemo(
    () =>
      reviews.map(r => ({
        ...r,
        productName: r.productName || `Sản phẩm #${r.productId}`,
        storeName: r.storeName || '—',
        isHidden: r.isHidden ?? false,
      })),
    [reviews],
  );

  const filtered = filter === 'all' ? enrichedReviews :
    filter === 'visible' ? enrichedReviews.filter(r => !r.isHidden) :
    enrichedReviews.filter(r => r.isHidden);

  const columns = [
    {
      key: 'productName', label: 'Sản phẩm', sortable: true,
      render: (_: unknown, r: Review & { productName: string; storeName: string; isHidden: boolean }) => (
        <div className="review-product-cell">
          <img src={`https://api.dicebear.com/7.x/identicon/svg?seed=${(r as Review).productId}`} alt="" className="review-product-img" />
          <div>
            <p className="review-product-name">{(r as Review & { productName: string }).productName}</p>
            <p className="review-shop-name">{(r as Review & { storeName: string }).storeName}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'userName', label: 'Khách hàng',
      render: (_: unknown, r: Review) => (
        <div className="review-customer">
          <img src={(r as Review).userAvatar} alt="" className="admin-avatar admin-avatar--sm" />
          <span className="review-customer-name">{(r as Review).userName}</span>
          {(r as Review).isVerified && <span className="verified-badge">✓ Đã mua</span>}
        </div>
      ),
    },
    {
      key: 'rating', label: 'Đánh giá', sortable: true, align: 'center' as const, width: '130px',
      render: (_: unknown, r: Review) => (
        <div className="review-rating-cell">
          {renderStars((r as Review).rating)}
          <span className="review-rating-num">{(r as Review).rating}/5</span>
        </div>
      ),
    },
    { key: 'comment', label: 'Nhận xét',
      render: (_: unknown, r: Review) => (
        <span className="review-comment">{(r as Review).comment}</span>
      ),
    },
    { key: 'createdAt', label: 'Ngày', sortable: true, width: '100px',
      render: (_: unknown, r: Review) => new Date((r as Review).createdAt).toLocaleDateString('vi-VN'),
    },
    {
      key: 'isHidden', label: 'Trạng thái', align: 'center' as const, width: '110px',
      render: (_: unknown, r: Review & { isHidden: boolean }) => (
        <span className={`admin-status ${(r as Review & { isHidden: boolean }).isHidden ? 'admin-status--locked' : 'admin-status--active'}`}>
          {(r as Review & { isHidden: boolean }).isHidden ? 'Đã ẩn' : 'Hiển thị'}
        </span>
      ),
    },
  ];

  const handleToggle = async (id: string, currentlyHidden: boolean) => {
    try {
      if (currentlyHidden) await approveReview(id);
      else await hideReview(id);
    } catch (err) {
      toast({
        title: 'Cập nhật thất bại',
        message: err instanceof Error ? err.message : 'Vui lòng thử lại.',
        variant: 'error',
      });
    }
  };

  const handleDelete = async (id: string) => {
    setIsSubmitting(true);
    try {
      await deleteReview(id);
      toast({ title: 'Đã xóa đánh giá', variant: 'success' });
    } catch (err) {
      toast({
        title: 'Xóa thất bại',
        message: err instanceof Error ? err.message : 'Vui lòng thử lại.',
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <div>
          <h1 className="admin-page__title">Quản Lý Đánh Giá</h1>
          <p className="admin-page__subtitle">Kiểm duyệt và quản lý đánh giá sản phẩm từ khách hàng</p>
        </div>
        <div className="admin-page-header__actions">
          <span className="admin-page__meta">{reviews.length} đánh giá</span>
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
          searchableFields={['userName', 'comment', 'productName', 'storeName']}
          actions={(record) => {
            const r = record as Review & { isHidden: boolean };
            return (
              <>
                <button className="btn btn-sm btn-secondary" onClick={() => setDetail(r)}>Chi tiết</button>
                <button
                  className={`btn btn-sm ${r.isHidden ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => void handleToggle(r.id, r.isHidden)}
                >
                  {r.isHidden ? 'Hiện' : 'Ẩn'}
                </button>
                <button className="btn btn-sm btn-outline" style={{ color: 'var(--color-danger)' }} onClick={() => setPendingDelete(r.id)}>Xóa</button>
              </>
            );
          }}
          emptyText="Không có đánh giá nào"
        />

        <ConfirmModal
          open={!!pendingDelete}
          title="Xóa đánh giá"
          message="Bạn có chắc muốn xóa đánh giá này? Hành động này không thể hoàn tác."
          confirmLabel="Xóa"
          variant="danger"
          loading={isSubmitting}
          onConfirm={async () => {
            if (pendingDelete) {
              await handleDelete(pendingDelete);
              setPendingDelete(null);
            }
          }}
          onCancel={() => setPendingDelete(null)}
        />

        {/* Modal chi tiết đánh giá */}
        {detail && (
          <div className="admin-modal-overlay" onClick={() => setDetail(null)}>
            <div className="admin-modal" onClick={e => e.stopPropagation()}>
              <div className="admin-modal__header">
                <h2 className="admin-modal__title">Chi tiết đánh giá</h2>
                <button className="admin-modal__close" onClick={() => setDetail(null)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              <div className="admin-modal__body">
                <div className="admin-detail-section">
                  <h4 className="admin-detail-section__title">Sản phẩm</h4>
                  <div className="admin-detail-row">
                    <span className="admin-detail-label">Tên sản phẩm</span>
                    <span className="admin-detail-value">{detail.productName}</span>
                  </div>
                  <div className="admin-detail-row">
                    <span className="admin-detail-label">Cửa hàng</span>
                    <span className="admin-detail-value">{detail.storeName}</span>
                  </div>
                </div>
                <div className="admin-detail-section">
                  <h4 className="admin-detail-section__title">Khách hàng</h4>
                  <div className="admin-detail-row">
                    <span className="admin-detail-label">Họ tên</span>
                    <span className="admin-detail-value">{detail.userName}</span>
                  </div>
                  <div className="admin-detail-row">
                    <span className="admin-detail-label">Đánh giá</span>
                    <span className="admin-detail-value">{detail.rating}/5 {detail.isVerified ? '✓ Đã mua' : ''}</span>
                  </div>
                </div>
                <div className="admin-detail-section">
                  <h4 className="admin-detail-section__title">Nhận xét</h4>
                  <p>{detail.comment}</p>
                </div>
                {detail.replies && detail.replies.length > 0 && (
                  <div className="admin-detail-section">
                    <h4 className="admin-detail-section__title">Phản hồi</h4>
                    {detail.replies.map(rep => (
                      <div key={rep.id} className="admin-detail-row">
                        <span className="admin-detail-label">{rep.userName}</span>
                        <span className="admin-detail-value">{rep.comment}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="admin-detail-row">
                  <span className="admin-detail-label">Ngày đánh giá</span>
                  <span className="admin-detail-value">{new Date(detail.createdAt).toLocaleString('vi-VN')}</span>
                </div>
              </div>
              <div className="admin-modal__footer">
                <button className="btn btn-secondary" onClick={() => setDetail(null)}>Đóng</button>
                <button
                  className={`btn ${detail.isHidden ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => {
                    void handleToggle(detail.id, detail.isHidden);
                    setDetail(null);
                  }}
                >
                  {detail.isHidden ? 'Hiện đánh giá' : 'Ẩn đánh giá'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
