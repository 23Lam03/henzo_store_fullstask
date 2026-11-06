import { API_BASE_URL, apiFetch } from './client';
import type { WishlistItem } from '../../types';

export interface WishlistDto {
  items: WishlistItem[];
  total: number;
}

export const wishlistApi = {
  get: (): Promise<WishlistDto> =>
    apiFetch<WishlistDto>(`${API_BASE_URL}/wishlist`),

    add: (productId: string): Promise<{ productId: string; isSaved: boolean }> =>
    apiFetch<{ productId: string; isSaved: boolean }>(
      `${API_BASE_URL}/wishlist`,
      { method: 'POST', body: { productId } },
    ),

    remove: (productId: string): Promise<{ productId: string; isSaved: boolean }> =>
    apiFetch<{ productId: string; isSaved: boolean }>(
      `${API_BASE_URL}/wishlist/${encodeURIComponent(productId)}`,
      { method: 'DELETE' },
    ),
};
