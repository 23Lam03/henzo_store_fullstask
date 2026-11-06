import { useState, useMemo } from 'react';
import { useSeller } from '../../../contexts/SellerContext';
import './ShopReviewsPage.css';

const formatNum = (n: number) => new Intl.NumberFormat('vi-VN').format(n);

const RATING_STARS = (rating: number) => (
  <div className="seller-review-stars">
    {[1, 2, 3, 4, 5].map(i => (
      <svg key={i} width="14" height="14" viewBox="0 0 24 24"
        fill={i <= rating ? '#A9741A' : 'none'}
        stroke={i <= rating ? '#A9741A' : '#D1D5DB'}
        strokeWidth="2">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ))}
    <span className="seller-review-rating-num">{rating}/5</span>
  </div>
);

export const ShopReviewsPage = () => {
  const { reviews, updateReviewVisibility, respondToReview } = useSeller();
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const perPage = 10;

  const filtered = useMemo(() => {
    let list = reviews;
    if (ratingFilter !== null) list = list.filter(r => r.rating === ratingFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r => r.productName.toLowerCase().includes(q) || r.customerName.toLowerCase().includes(q) || r.content.toLowerCase().includes(q));
    }
    return list;
  }, [reviews, ratingFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const ratingDist = [5, 4, 3, 2, 1].map(r => ({
    rating: r,
    count: reviews.filter(rv => rv.rating === r).length,
    pct: reviews.length > 0 ? (reviews.filter(rv => rv.rating === r).length / reviews.length) * 100 : 0,
  }));

  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '0.0';

  const handleReply = (reviewId: string) => {
    if (!replyText.trim()) return;
    respondToReview(reviewId, replyText);
    setReplyingTo(null);
    setReplyText('');
  };

  return (
    <div className="seller-reviews admin-page">
      <div className="admin-page__header">
        <div>
          <h1 className="admin-page__title">Quản lý đánh giá</h1>
          <p className="admin-page__subtitle">Quản lý phản hồi đánh giá từ khách hàng</p>
        </div>
      </div>

      {/* Rating Summary */}
      <div className="seller-reviews__summary">
        <div className="seller-reviews__summary-score">
          <span className="seller-reviews__big-score">{avgRating}</span>
          <div className="seller-reviews__stars">{RATING_STARS(Math.round(parseFloat(avgRating)))}</div>
          <p className="seller-reviews__total">{formatNum(reviews.length)} đánh giá</p>
        </div>
        <div className="seller-reviews__dist">
          {ratingDist.map(d => (
            <div key={d.rating} className="seller-reviews__dist-row">
              <span className="seller-reviews__dist-label">{d.rating} sao</span>
              <div className="seller-reviews__dist-bar-wrap">
                <div className="seller-reviews__dist-bar" style={{ width: `${d.pct}%` }} />
              </div>
              <span className="seller-reviews__dist-count">{d.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="seller-reviews__toolbar">
        <div className="seller-rating-filters">
          <button className={`seller-filter-btn ${ratingFilter === null ? 'seller-filter-btn--active' : ''}`} onClick={() => { setRatingFilter(null); setPage(1); }}>
            Tất cả
          </button>
          {[5, 4, 3, 2, 1].map(r => (
            <button key={r} className={`seller-filter-btn ${ratingFilter === r ? 'seller-filter-btn--active' : ''}`} onClick={() => { setRatingFilter(r); setPage(1); }}>
              {r} <svg width="12" height="12" viewBox="0 0 24 24" fill="#A9741A" stroke="#A9741A" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            </button>
          ))}
        </div>
        <div className="seller-reviews__search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" placeholder="Tìm theo sản phẩm, khách hàng, nội dung..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="seller-reviews__search-input" />
        </div>
      </div>

      {/* Reviews List */}
      <div className="seller-reviews__list">
        {paginated.length === 0 ? (
          <div className="admin-section">
            <div className="seller-empty" style={{ padding: 60 }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              <p>Không có đánh giá nào</p>
            </div>
          </div>
        ) : paginated.map(review => (
          <div key={review.id} className={`seller-review-card ${review.isHidden ? 'seller-review-card--hidden' : ''}`}>
            <div className="seller-review-card__header">
              <img src={review.customerAvatar} alt={review.customerName} className="seller-review-card__avatar"
                onError={(e) => { (e.target as HTMLImageElement).src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + review.customerName; }} />
              <div className="seller-review-card__meta">
                <p className="seller-review-card__customer">{review.customerName}</p>
                <div className="seller-review-card__top">
                  {RATING_STARS(review.rating)}
                  <span className="seller-review-card__date">{new Date(review.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>
              </div>
              <div className="seller-review-card__actions">
                <button
                  className={`seller-action-btn ${review.isHidden ? 'seller-action-btn--success' : 'seller-action-btn--warning'}`}
                  onClick={() => updateReviewVisibility(review.id, !review.isHidden)}
                  title={review.isHidden ? 'Hiện đánh giá' : 'Ẩn đánh giá'}
                >
                  {review.isHidden ? (
                    <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>Hiện</>
                  ) : (
                    <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>Ẩn</>
                  )}
                </button>
              </div>
            </div>

            <div className="seller-review-card__product">
              <img src={review.productImage} alt={review.productName} className="seller-review-card__product-img"
                onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/40x40/cccccc/999999?text=IMG'; }} />
              <span className="seller-review-card__product-name">{review.productName}</span>
            </div>

            <p className="seller-review-card__content">{review.content}</p>

            {review.images.length > 0 && (
              <div className="seller-review-card__images">
                {review.images.map((img, i) => (
                  <img key={i} src={img} alt="" className="seller-review-card__img"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/80x80/cccccc/999999?text=IMG'; }} />
                ))}
              </div>
            )}

            {review.hasResponse && review.sellerResponse && (
              <div className="seller-review-card__response">
                <div className="seller-review-card__response-header">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  Phản hồi của shop
                </div>
                <p className="seller-review-card__response-text">{review.sellerResponse}</p>
              </div>
            )}

            {!review.hasResponse && (
              <div className="seller-review-card__reply">
                {replyingTo === review.id ? (
                  <div className="seller-review-card__reply-form">
                    <textarea
                      className="admin-form-textarea"
                      placeholder="Viết phản hồi của bạn..."
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      rows={3}
                    />
                    <div className="seller-review-card__reply-actions">
                      <button className="btn btn-secondary btn-sm" onClick={() => { setReplyingTo(null); setReplyText(''); }}>Hủy</button>
                      <button className="btn btn-primary btn-sm" onClick={() => handleReply(review.id)} disabled={!replyText.trim()}>Gửi phản hồi</button>
                    </div>
                  </div>
                ) : (
                  <button className="seller-action-btn seller-action-btn--primary" onClick={() => setReplyingTo(review.id)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    Phản hồi
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
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
    </div>
  );
};
