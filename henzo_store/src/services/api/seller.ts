/**
 * API phía seller (shop) — dashboard, đơn hàng, sản phẩm, tồn kho,
 * đánh giá, khuyến mãi, vận chuyển, thanh toán, hỗ trợ.
 */
import { API_BASE_URL, API_ORIGIN, apiFetch, apiFetchWithMeta, apiUpload, qs, type QueryValue, type UploadedFileInfo } from './client';
import type {
  DailyRevenue,
  MonthlyData,
  SellerDashboardStats,
  SellerInventoryItem,
  SellerNotification,
  SellerOrder,
  SellerPayment,
  SellerProduct,
  SellerPromotion,
  SellerReview,
  SellerShipping,
  SellerStore,
  SellerSupportTicket,
} from '../../types/seller';

export interface SellerDashboardResponse {
  store: SellerStore | null;
  stats: SellerDashboardStats;
  finance: {
    totalRevenue: number;
    totalOrders: number;
    totalPlatformFee: number;
    totalRefund: number;
    netRevenue: number;
    avgOrderValue: number;
    period: string;
  };
  dailyRevenue: DailyRevenue[];
  monthlyData: MonthlyData[];
}

export interface SellerOrderListResult {
  orders: SellerOrder[];
  statusCounts: Record<string, number>;
  total: number;
}

export interface SellerReviewListResult {
  reviews: SellerReview[];
  distribution: Record<string, number>;
  total: number;
}

export interface SellerInventoryResult {
  items: SellerInventoryItem[];
  summary: {
    statusCounts: Record<string, number>;
    totalStock: number;
  };
  total: number;
}

/**
 * Phạm vi cửa hàng đang xem.
 *
 * - Tài khoản `SHOP` không cần tham số này — backend tự lấy `storeId` của user.
 * - Tài khoản `ADMIN` có thể chọn một cửa hàng cụ thể; khi đó mọi request
 *   seller sẽ kèm `?storeId=...` để backend scope đúng.
 */
let activeStoreId: string | undefined;

/** Đặt cửa hàng đang xem (chỉ dùng cho role ADMIN). */
export function setSellerStoreScope(storeId?: string): void {
  activeStoreId = storeId?.trim() || undefined;
}

/** Cửa hàng đang xem hiện tại. */
export function getSellerStoreScope(): string | undefined {
  return activeStoreId;
}

/** Gắn `storeId` vào query string nếu đang có phạm vi cửa hàng. */
function scopeQs(params?: Record<string, QueryValue>): string {
  if (!activeStoreId) return qs(params);
  return qs({ ...(params ?? {}), storeId: activeStoreId });
}

export const sellerApi = {
  /** Dashboard tổng quan của cửa hàng. */
  dashboard: (
    period: 'today' | 'week' | 'month' | 'year' = 'month',
  ): Promise<SellerDashboardResponse> =>
    apiFetch<SellerDashboardResponse>(
      `${API_BASE_URL}/seller/dashboard${scopeQs({ period })}`,
    ),

  // ─── Đơn hàng ─────────────────────────────────────────────────────────────
  async orders(
    params: {
      page?: number;
      pageSize?: number;
      status?: string;
      q?: string;
    } = {},
  ): Promise<SellerOrderListResult> {
    const { data, meta } = await apiFetchWithMeta<{
      orders: SellerOrder[];
      statusCounts: Record<string, number>;
    }>(`${API_BASE_URL}/seller/orders${scopeQs(params)}`);
    return {
      orders: data?.orders ?? [],
      statusCounts: data?.statusCounts ?? {},
      total: meta?.total ?? 0,
    };
  },

  order: (id: string): Promise<SellerOrder> =>
    apiFetch<SellerOrder>(
      `${API_BASE_URL}/seller/orders/${encodeURIComponent(id)}`,
    ),

  /** Cập nhật trạng thái sub-order (sơ đồ trạng thái do backend kiểm tra). */
  updateOrderStatus: (
    id: string,
    status: string,
    extra?: {
      note?: string;
      trackingNumber?: string;
      shippingPartner?: string;
    },
  ): Promise<SellerOrder> =>
    apiFetch<SellerOrder>(
      `${API_BASE_URL}/seller/orders/${encodeURIComponent(id)}/status`,
      { method: 'PATCH', body: { status, ...(extra ?? {}) } },
    ),

  // ─── Sản phẩm ─────────────────────────────────────────────────────────────
  async products(
    params: {
      page?: number;
      pageSize?: number;
      status?: string;
      category?: string;
      brand?: string;
      search?: string;
      inStock?: boolean;
      lowStock?: boolean;
      sort?: string;
    } = {},
  ): Promise<{ products: SellerProduct[]; total: number }> {
    const { data, meta } = await apiFetchWithMeta<SellerProduct[]>(
      `${API_BASE_URL}/seller/products${scopeQs(params)}`,
    );
    return { products: data ?? [], total: meta?.total ?? 0 };
  },

  /** Xoá sản phẩm của cửa hàng. */
  deleteProduct: (id: string): Promise<{ id: string; deleted: boolean }> =>
    apiFetch<{ id: string; deleted: boolean }>(
      `${API_BASE_URL}/seller/products/${encodeURIComponent(id)}`,
      { method: 'DELETE' },
    ),

  createProduct: (input: Record<string, unknown>): Promise<unknown> =>
    apiFetch<unknown>(`${API_BASE_URL}/seller/products`, {
      method: 'POST',
      body: input,
    }),

  updateProduct: (id: string, input: Record<string, unknown>): Promise<unknown> =>
    apiFetch<unknown>(`${API_BASE_URL}/seller/products/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: input,
    }),

  /** Tải ảnh sản phẩm lên từ máy — trả về URL public dùng cho `images`. */
  uploadImages: async (files: File[] | File): Promise<{ files: UploadedFileInfo[] }> => {
    const res = await apiUpload<{ files: UploadedFileInfo[] }>(
      `${API_BASE_URL}/seller/uploads`,
      files,
    );
    return {
      files: res.files.map(f => ({
        ...f,
        url: f.url.startsWith('http') ? f.url : `${API_ORIGIN}${f.url}`,
      })),
    };
  },

  // ─── Tồn kho ─────────────────────────────────────────────────────────────
  async inventory(
    params: {
      page?: number;
      pageSize?: number;
      status?: string;
      search?: string;
    } = {},
  ): Promise<SellerInventoryResult> {
    const { data, meta } = await apiFetchWithMeta<{
      items: SellerInventoryItem[];
      summary: { statusCounts: Record<string, number>; totalStock: number };
    }>(`${API_BASE_URL}/seller/inventory${scopeQs(params)}`);
    return {
      items: data?.items ?? [],
      summary: data?.summary ?? { statusCounts: {}, totalStock: 0 },
      total: meta?.total ?? 0,
    };
  },

  /** Cập nhật tồn kho theo SKU. */
  updateInventoryStock: (
    sku: string,
    stock: number,
  ): Promise<SellerInventoryItem> =>
    apiFetch<SellerInventoryItem>(
      `${API_BASE_URL}/seller/inventory/${encodeURIComponent(sku)}`,
      { method: 'PATCH', body: { stock } },
    ),

  // ─── Đánh giá ─────────────────────────────────────────────────────────────
  async reviews(
    params: {
      page?: number;
      pageSize?: number;
      visibility?: string;
      rating?: number;
      search?: string;
    } = {},
  ): Promise<SellerReviewListResult> {
    const { data, meta } = await apiFetchWithMeta<{
      reviews: SellerReview[];
      distribution: Record<string, number>;
    }>(`${API_BASE_URL}/seller/reviews${scopeQs(params)}`);
    return {
      reviews: data?.reviews ?? [],
      distribution: data?.distribution ?? {},
      total: meta?.total ?? 0,
    };
  },

  /** Ẩn / bỏ ẩn / phản hồi đánh giá. */
  updateReview: (
    id: string,
    action: 'hide' | 'unhide' | 'respond',
    response?: string,
  ): Promise<SellerReview> =>
    apiFetch<SellerReview>(
      `${API_BASE_URL}/seller/reviews/${encodeURIComponent(id)}`,
      { method: 'PATCH', body: { action, ...(response ? { response } : {}) } },
    ),

  // ─── Khuyến mãi ───────────────────────────────────────────────────────────
  async promotions(
    params: { page?: number; pageSize?: number; status?: string } = {},
  ): Promise<{ promotions: SellerPromotion[]; total: number }> {
    const { data, meta } = await apiFetchWithMeta<SellerPromotion[]>(
      `${API_BASE_URL}/seller/promotions${scopeQs(params)}`,
    );
    return { promotions: data ?? [], total: meta?.total ?? 0 };
  },

  createPromotion: (input: Record<string, unknown>): Promise<SellerPromotion> =>
    apiFetch<SellerPromotion>(`${API_BASE_URL}/seller/promotions`, {
      method: 'POST',
      body: input,
    }),

  updatePromotionStatus: (
    id: string,
    status: string,
  ): Promise<SellerPromotion> =>
    apiFetch<SellerPromotion>(
      `${API_BASE_URL}/seller/promotions/${encodeURIComponent(id)}`,
      { method: 'PATCH', body: { status } },
    ),

  deletePromotion: (id: string): Promise<{ id: string; deleted: boolean }> =>
    apiFetch<{ id: string; deleted: boolean }>(
      `${API_BASE_URL}/seller/promotions/${encodeURIComponent(id)}`,
      { method: 'DELETE' },
    ),

  // ─── Vận chuyển ───────────────────────────────────────────────────────────
  async shipping(
    params: { page?: number; pageSize?: number; status?: string } = {},
  ): Promise<{ shippings: SellerShipping[]; total: number }> {
    const { data, meta } = await apiFetchWithMeta<{
      shippings: SellerShipping[];
      statusCounts: Record<string, number>;
    }>(`${API_BASE_URL}/seller/shipping${scopeQs(params)}`);
    return {
      shippings: Array.isArray(data?.shippings) ? data.shippings : [],
      total: meta?.total ?? 0,
    };
  },

  createShipping: (input: {
    orderId: string;
    carrier?: string;
    trackingNumber?: string;
    weight?: number;
    dimensions?: string;
    shippingFee?: number;
  }): Promise<SellerShipping> =>
    apiFetch<SellerShipping>(`${API_BASE_URL}/seller/shipping`, {
      method: 'POST',
      body: input,
    }),

  // ─── Thanh toán ───────────────────────────────────────────────────────────
  async payments(
    params: { page?: number; pageSize?: number; status?: string } = {},
  ): Promise<{
    payments: SellerPayment[];
    summary: {
      totalAmount: number;
      totalPlatformFee: number;
      totalNetAmount: number;
      totalCount: number;
    };
    total: number;
  }> {
    const { data, meta } = await apiFetchWithMeta<{
      payments: SellerPayment[];
      summary: {
        totalAmount: number;
        totalPlatformFee: number;
        totalNetAmount: number;
        totalCount: number;
      };
    }>(`${API_BASE_URL}/seller/payments${scopeQs(params)}`);
    return {
      payments: data?.payments ?? [],
      summary: data?.summary ?? {
        totalAmount: 0,
        totalPlatformFee: 0,
        totalNetAmount: 0,
        totalCount: 0,
      },
      total: meta?.total ?? 0,
    };
  },

  // ─── Hỗ trợ ───────────────────────────────────────────────────────────────
  async tickets(
    params: { page?: number; pageSize?: number; status?: string } = {},
  ): Promise<{ tickets: SellerSupportTicket[]; total: number }> {
    const { data, meta } = await apiFetchWithMeta<SellerSupportTicket[]>(
      `${API_BASE_URL}/seller/support/tickets${scopeQs(params)}`,
    );
    return { tickets: data ?? [], total: meta?.total ?? 0 };
  },

  /** Trả lời phiếu hỗ trợ — backend tự chuyển trạng thái sang `replied`. */
  replyTicket: (id: string, content: string): Promise<SellerSupportTicket> =>
    apiFetch<SellerSupportTicket>(
      `${API_BASE_URL}/seller/support/tickets/${encodeURIComponent(id)}`,
      { method: 'PATCH', body: { content } },
    ),

  updateTicketStatus: (
    id: string,
    status: string,
  ): Promise<SellerSupportTicket> =>
    apiFetch<SellerSupportTicket>(
      `${API_BASE_URL}/seller/support/tickets/${encodeURIComponent(id)}`,
      { method: 'PATCH', body: { status } },
    ),
};

/** Thông báo của seller. */
export const sellerNotificationApi = {
  async list(
    params: { page?: number; pageSize?: number; unread?: boolean } = {},
  ): Promise<{
    notifications: SellerNotification[];
    unreadCount: number;
    total: number;
  }> {
    const { data, meta } = await apiFetchWithMeta<{
      notifications: SellerNotification[];
      unreadCount: number;
    }>(`${API_BASE_URL}/seller/notifications${scopeQs(params)}`);
    return {
      notifications: data?.notifications ?? [],
      unreadCount: data?.unreadCount ?? 0,
      total: meta?.total ?? 0,
    };
  },

  markRead: (id?: string): Promise<{ updated: string | number }> =>
    apiFetch<{ updated: string | number }>(
      `${API_BASE_URL}/seller/notifications${scopeQs(id ? { id } : { all: '1' })}`,
      { method: 'PATCH' },
    ),

  remove: (id?: string): Promise<{ id?: string; deleted?: boolean; deletedCount?: number }> =>
    apiFetch<{ id?: string; deleted?: boolean; deletedCount?: number }>(
      `${API_BASE_URL}/seller/notifications${scopeQs(id ? { id } : undefined)}`,
      { method: 'DELETE' },
    ),
};
