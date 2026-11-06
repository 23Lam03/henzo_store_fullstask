import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Review } from '../../types';
import { reviewsApi } from '../../services/api/reviews';
import { ordersApi } from '../../services/api/orders';
import { useAuth } from '../AuthContext';

interface CreateReviewInput {
  orderId: string;
  productId: string;
  rating: number;
  comment: string;
  images?: string[];
}

interface ReviewContextValue {
  /** Đánh giá của sản phẩm đang xem (cache theo productId). */
  reviews: Review[];
  createReview: (input: CreateReviewInput) => Promise<Review>;
  getProductReviews: (productId: string) => Review[];
  hasReviewedProduct: (orderId: string, productId: string) => boolean;
  loadProductReviews: (productId: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const ReviewContext = createContext<ReviewContextValue | null>(null);

export const ReviewProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();
  /** Cache đánh giá theo productId — tránh gọi lại API mỗi lần render. */
  const [cache, setCache] = useState<Record<string, Review[]>>({});
  const [reviewedKeys, setReviewedKeys] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Tải đánh giá của một sản phẩm từ server. */
  const loadProductReviews = useCallback(async (productId: string) => {
    if (!productId) return;
    setIsLoading(true);
    try {
      const { reviews } = await reviewsApi.forProduct(productId, { pageSize: 50 });
      setCache(prev => ({ ...prev, [productId]: reviews }));
      setError(null);
    } catch (err) {
      console.error('Load reviews failed:', err);
      setError(err instanceof Error ? err.message : 'Không tải được đánh giá');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Đánh giá đã tạo của chính user -> dùng để disable nút "Đánh giá".
  useEffect(() => {
    if (!isAuthenticated) {
      setReviewedKeys(new Set());
      return;
    }
    let cancelled = false;
    const loadOwnReviews = async () => {
      try {
        // Duyệt các sản phẩm đã mua để biết sản phẩm nào đã đánh giá.
        const { orders } = await ordersApi.list({ pageSize: 100 });
        if (cancelled) return;

        const keys = new Set<string>();
        for (const order of orders) {
          for (const item of order.items ?? []) {
            keys.add(`${order.id}:${item.product.id}`);
          }
        }
        setReviewedKeys(keys);
      } catch (err) {
        console.error('Load own reviews failed:', err);
      }
    };
    void loadOwnReviews();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const createReview = useCallback(
    async (input: CreateReviewInput): Promise<Review> => {
      const review = await reviewsApi.create({
        productId: input.productId,
        rating: input.rating,
        comment: input.comment,
        images: input.images ?? [],
        orderId: input.orderId,
      });

      // Cập nhật cache của sản phẩm để UI phản ánh ngay.
      setCache(prev => ({
        ...prev,
        [input.productId]: [review, ...(prev[input.productId] ?? [])],
      }));

      setReviewedKeys(prev => {
        const next = new Set(prev);
        next.add(`${input.orderId}:${input.productId}`);
        return next;
      });

      return review;
    },
    [],
  );

  const getProductReviews = useCallback(
    (productId: string) => cache[productId] ?? [],
    [cache],
  );

  const hasReviewedProduct = useCallback(
    (orderId: string, productId: string) =>
      reviewedKeys.has(`${orderId}:${productId}`),
    [reviewedKeys],
  );

  /** Danh sách đánh giá của sản phẩm đầu tiên trong context (dùng cho tab). */
  const reviews = useMemo(() => {
    const first = Object.values(cache)[0];
    return first ?? [];
  }, [cache]);

  const value = useMemo(
    () => ({
      reviews,
      createReview,
      getProductReviews,
      hasReviewedProduct,
      loadProductReviews,
      isLoading,
      error,
    }),
    [
      reviews,
      createReview,
      getProductReviews,
      hasReviewedProduct,
      loadProductReviews,
      isLoading,
      error,
    ],
  );

  return <ReviewContext.Provider value={value}>{children}</ReviewContext.Provider>;
};

export const useReview = (): ReviewContextValue => {
  const context = useContext(ReviewContext);
  if (!context) throw new Error('useReview must be used within ReviewProvider');
  return context;
};
