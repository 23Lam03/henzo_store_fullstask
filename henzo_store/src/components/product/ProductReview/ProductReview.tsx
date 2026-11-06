import { useState } from 'react';
import type { Review } from '../../../types';
import { formatDate } from '../../../utils';
import './ProductReview.css';

interface ProductReviewProps {
  reviews: Review[];
  productId: string;
}

export const ProductReview = ({ reviews }: ProductReviewProps) => {
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const sortedReviews = [...reviews].sort((a, b) => {
    if (sortBy === 'rating') return b.rating - a.rating;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  const renderStars = (count: number, interactive = false) => (
    <div className="review-form__stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <button
          key={i}
          type="button"
          className={`review-form__star ${interactive ? 'interactive' : ''} ${i < count ? 'filled' : ''}`}
          onClick={interactive ? () => setRating(i + 1) : undefined}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill={i < count ? '#A9741A' : '#D9D3C7'}>
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </button>
      ))}
    </div>
  );

  return (
    <div className="product-review">
      <div className="product-review__header">
        <h3 className="product-review__title">Đánh giá sản phẩm</h3>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Đóng lại' : 'Viết đánh giá'}
        </button>
      </div>

      {showForm && (
        <div className="review-form">
          <h4>Đánh giá của bạn</h4>
          <div className="review-form__rating">
            <span>Chọn đánh giá:</span>
            {renderStars(rating, true)}
          </div>
          <textarea
            className="review-form__textarea"
            placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
          />
          <div className="review-form__actions">
            <button className="btn btn-primary">Gửi đánh giá</button>
          </div>
        </div>
      )}

      <div className="product-review__summary">
        <div className="product-review__score">
          <span className="product-review__score-num">{averageRating}</span>
          <span className="product-review__score-max">/5</span>
          {renderStars(Math.round(parseFloat(averageRating)))}
          <span className="product-review__count">{reviews.length} đánh giá</span>
        </div>
        <div className="product-review__filters">
          <label>Sắp xếp:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="newest">Mới nhất</option>
            <option value="rating">Đánh giá cao nhất</option>
          </select>
        </div>
      </div>

      <div className="product-review__list">
        {sortedReviews.map(review => (
          <div key={review.id} className="review-card">
            <div className="review-card__header">
              <img src={review.userAvatar} alt={review.userName} className="review-card__avatar" />
              <div className="review-card__meta">
                <span className="review-card__name">{review.userName}</span>
                {review.isVerified && <span className="review-card__verified">Đã mua hàng</span>}
                <div className="review-card__stars">{renderStars(review.rating)}</div>
                <span className="review-card__date">{formatDate(review.createdAt)}</span>
              </div>
            </div>
            <p className="review-card__comment">{review.comment}</p>
            {review.replies && review.replies.length > 0 && (
              <div className="review-card__replies">
                {review.replies.map(reply => (
                  <div key={reply.id} className="review-card__reply">
                    <strong>{reply.userName}:</strong> {reply.comment}
                    <span className="review-card__reply-date">{formatDate(reply.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {reviews.length === 0 && (
        <div className="product-review__empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          <p>Chưa có đánh giá nào cho sản phẩm này.</p>
        </div>
      )}
    </div>
  );
};
