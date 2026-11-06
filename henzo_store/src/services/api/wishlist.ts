/**
 * API danh sách yêu thích.
 */
import { API_BASE_URL, apiFetch } from './client';
import type { WishlistItem } from '../../types';

export interface WishlistDto {
  items: WishlistItem[];
  total: number;
}

export const wishlistApi = {
  get: (): Promise<WishlistDto> =>
    apiFetch<WishlistDto>(`${API_BASE_URL}/wishlist`),

  /** Thêm sản phẩm vào danh sách yêu thích (idempotent). */
  add: (productId: string): Promise<{ productId: string; isSaved: boolean }> =>
    apiFetch<{ productId: string; isSaved: boolean }>(
      `${API_BASE_URL}/wishlist`,
      { method: 'POST', body: { productId } },
    ),

  /** Bỏ khỏi danh sách yêu thích. */
  remove: (productId: string): Promise<{ productId: string; isSaved: boolean }> =>
    apiFetch<{ productId: string; isSaved: boolean }>(
      `${API_BASE_URL}/wishlist/${encodeURIComponent(productId)}`,
      { method: 'DELETE' },
    ),
};
