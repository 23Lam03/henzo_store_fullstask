import { API_BASE_URL, apiFetch } from './client';
import type { CartItem, Product } from '../../types';

export interface CartDto {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  totalOriginalPrice: number;
  savings: number;
  shippingFee: number;
}

export const cartApi = {
    get: (): Promise<CartDto> => apiFetch<CartDto>(`${API_BASE_URL}/cart`),

    addItem: (productId: string, quantity = 1): Promise<CartDto> =>
    apiFetch<CartDto>(`${API_BASE_URL}/cart/items`, {
      method: 'POST',
      body: { productId, quantity },
    }),

    updateItem: (productId: string, quantity: number): Promise<CartDto> =>
    apiFetch<CartDto>(
      `${API_BASE_URL}/cart/items/${encodeURIComponent(productId)}`,
      { method: 'PATCH', body: { quantity } },
    ),

    toggleItem: (productId: string, selected: boolean): Promise<CartDto> =>
    apiFetch<CartDto>(
      `${API_BASE_URL}/cart/items/${encodeURIComponent(productId)}`,
      { method: 'PUT', body: { selected } },
    ),

    removeItem: (productId: string): Promise<CartDto> =>
    apiFetch<CartDto>(
      `${API_BASE_URL}/cart/items/${encodeURIComponent(productId)}`,
      { method: 'DELETE' },
    ),

    selectAll: (selected: boolean): Promise<CartDto> =>
    apiFetch<CartDto>(`${API_BASE_URL}/cart`, {
      method: 'PATCH',
      body: { selected },
    }),

    clear: (selectedOnly = false): Promise<CartDto> =>
    apiFetch<CartDto>(
      `${API_BASE_URL}/cart${selectedOnly ? '?selected=1' : ''}`,
      { method: 'DELETE' },
    ),
};

export const findCartItem = (
  items: CartItem[],
  productId: string,
): CartItem | undefined => items.find((i) => i.product.id === productId);

export const canAddQuantity = (
  product: Pick<Product, 'stock'>,
  current: number,
  add: number,
): boolean => current + add <= product.stock;
