import { API_BASE_URL, apiFetch, apiFetchWithMeta, qs } from './client';
import type { Review } from '../../types';

export interface ReviewDistribution {
  '1': number;
  '2': number;
  '3': number;
  '4': number;
  '5': number;
}

export interface CreateReviewInput {
  productId: string;
  rating: number;
  comment: string;
  images?: string[];
  orderId?: string;
}

export const reviewsApi = {
    async forProduct(
    productId: string,
    params: { page?: number; pageSize?: number; minRating?: number } = {},
  ): Promise<{ reviews: Review[]; distribution: ReviewDistribution; total: number }> {
    const { data, meta } = await apiFetchWithMeta<{
      reviews: Review[];
      distribution: ReviewDistribution;
    }>(`${API_BASE_URL}/products/${encodeURIComponent(productId)}/reviews${qs(params)}`);
    return {
      reviews: data?.reviews ?? [],
      distribution: data?.distribution ?? { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
      total: meta?.total ?? 0,
    };
  },

    create: (input: CreateReviewInput): Promise<Review> =>
    apiFetch<Review>(`${API_BASE_URL}/reviews`, { method: 'POST', body: input }),
};
