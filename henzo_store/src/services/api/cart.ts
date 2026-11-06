/**
 * API giỏ hàng — server là nguồn sự thật (giá & tồn kho luôn lấy từ DB).
 */
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
  /** Lấy giỏ hàng hiện tại (kèm tổng tiền & phí ship do server tính). */
  get: (): Promise<CartDto> => apiFetch<CartDto>(`${API_BASE_URL}/cart`),

  /** Thêm sản phẩm (tự cộng dồn nếu đã có trong giỏ). */
  addItem: (productId: string, quantity = 1): Promise<CartDto> =>
    apiFetch<CartDto>(`${API_BASE_URL}/cart/items`, {
      method: 'POST',
      body: { productId, quantity },
    }),

  /** Cập nhật số lượng — quantity = 0 nghĩa là xoá khỏi giỏ. */
  updateItem: (productId: string, quantity: number): Promise<CartDto> =>
    apiFetch<CartDto>(
      `${API_BASE_URL}/cart/items/${encodeURIComponent(productId)}`,
      { method: 'PATCH', body: { quantity } },
    ),

  /** Chọn / bỏ chọn một mục trong giỏ. */
  toggleItem: (productId: string, selected: boolean): Promise<CartDto> =>
    apiFetch<CartDto>(
      `${API_BASE_URL}/cart/items/${encodeURIComponent(productId)}`,
      { method: 'PUT', body: { selected } },
    ),

  /** Xoá một mục khỏi giỏ. */
  removeItem: (productId: string): Promise<CartDto> =>
    apiFetch<CartDto>(
      `${API_BASE_URL}/cart/items/${encodeURIComponent(productId)}`,
      { method: 'DELETE' },
    ),

  /** Chọn / bỏ chọn tất cả mục trong giỏ. */
  selectAll: (selected: boolean): Promise<CartDto> =>
    apiFetch<CartDto>(`${API_BASE_URL}/cart`, {
      method: 'PATCH',
      body: { selected },
    }),

  /** Xoá toàn bộ giỏ, hoặc chỉ các mục đang chọn (`selectedOnly=true`). */
  clear: (selectedOnly = false): Promise<CartDto> =>
    apiFetch<CartDto>(
      `${API_BASE_URL}/cart${selectedOnly ? '?selected=1' : ''}`,
      { method: 'DELETE' },
    ),
};

/** Tìm sản phẩm trong giỏ theo id. */
export const findCartItem = (
  items: CartItem[],
  productId: string,
): CartItem | undefined => items.find((i) => i.product.id === productId);

/** Kiểm tra số lượng còn có thể thêm vào giỏ không (theo tồn kho server). */
export const canAddQuantity = (
  product: Pick<Product, 'stock'>,
  current: number,
  add: number,
): boolean => current + add <= product.stock;
