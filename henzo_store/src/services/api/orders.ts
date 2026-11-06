/**
 * API đơn hàng — đặt hàng, lịch sử, chi tiết, huỷ, theo dõi vận chuyển.
 */
import { API_BASE_URL, apiFetch, apiFetchWithMeta, qs } from './client';
import type { Order, OrderStatus, Payment } from '../../types';

export interface CreateOrderInput {
  items?: { productId: string; quantity: number }[];
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  shippingProvince?: string;
  shippingDistrict?: string;
  shippingWard?: string;
  note?: string;
  paymentMethod: string;
  voucherCode?: string;
}

export interface OrderSubOrder {
  id: string;
  storeId: string;
  storeName: string;
  status: string;
  subtotal: number;
  shippingFee: number;
  discount: number;
  totalPrice: number;
  trackingNumber: string;
  shippingPartner: string;
  estimatedDelivery: string | null;
  deliveredAt: string | null;
  itemCount: number;
  statusHistory: { status: string; at: string; note: string }[];
}

export interface OrderTracking {
  orderId: string;
  orderNumber: string;
  status: string;
  shippingUpdates: {
    id: string;
    orderId: string;
    status: string;
    location: string;
    timestamp: string;
    description: string;
  }[];
  subOrders: {
    storeId: string;
    storeName: string;
    status: string;
    trackingNumber: string;
    shippingPartner: string;
    estimatedDelivery: string | null;
    deliveredAt: string | null;
    statusHistory: { status: string; at: string; note: string }[];
  }[];
}

export const ordersApi = {
  /** Danh sách đơn hàng của khách (có phân trang + lọc trạng thái). */
  async list(
    params: { page?: number; pageSize?: number; status?: string } = {},
  ): Promise<{ orders: Order[]; total: number }> {
    const { data, meta } = await apiFetchWithMeta<Order[]>(
      `${API_BASE_URL}/orders${qs(params)}`,
    );
    return { orders: data ?? [], total: meta?.total ?? data?.length ?? 0 };
  },

  /** Đặt hàng — server tính lại tiền, trừ kho & tạo vận đơn. */
  create: (input: CreateOrderInput): Promise<Order> =>
    apiFetch<Order>(`${API_BASE_URL}/orders`, { method: 'POST', body: input }),

  detail: (id: string): Promise<Order> =>
    apiFetch<Order>(`${API_BASE_URL}/orders/${encodeURIComponent(id)}`),

  /** Huỷ đơn (chỉ khi đơn còn ở trạng thái cho phép). */
  cancel: (id: string, reason?: string): Promise<Order> =>
    apiFetch<Order>(`${API_BASE_URL}/orders/${encodeURIComponent(id)}/cancel`, {
      method: 'POST',
      body: { reason: reason ?? '' },
    }),

  /** Cập nhật trạng thái (seller/admin). */
  updateStatus: (
    id: string,
    status: string,
    extra?: {
      note?: string;
      trackingNumber?: string;
      shippingPartner?: string;
    },
  ): Promise<Order> =>
    apiFetch<Order>(`${API_BASE_URL}/orders/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: { status, ...(extra ?? {}) },
    }),

  tracking: (id: string): Promise<OrderTracking> =>
    apiFetch<OrderTracking>(
      `${API_BASE_URL}/orders/${encodeURIComponent(id)}/tracking`,
    ),
};

export const paymentsApi = {
  /** Lịch sử giao dịch của khách + tổng hợp. */
  async list(
    params: { page?: number; pageSize?: number } = {},
  ): Promise<{ payments: Payment[]; summary: { totalAmount: number; totalCount: number } }> {
    const { data } = await apiFetchWithMeta<{
      payments: Payment[];
      summary: { totalAmount: number; totalCount: number };
    }>(`${API_BASE_URL}/payments${qs(params)}`);
    return data ?? { payments: [], summary: { totalAmount: 0, totalCount: 0 } };
  },
};

/** Map trạng thái đơn của backend sang label tiếng Việt hiển thị cho khách. */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  processing: 'Đang xử lý',
  shipping: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy',
};
