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
    const [cache, setCache] = useState<Record<string, Review[]>>({});
  const [reviewedKeys, setReviewedKeys] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    if (!isAuthenticated) {
      setReviewedKeys(new Set());
      return;
    }
    let cancelled = false;
    const loadOwnReviews = async () => {
      try {

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
