/**
 * API phía admin — dashboard, cửa hàng, khách hàng, đơn hàng, thanh toán,
 * sản phẩm, đánh giá, khuyến mãi, phiếu hỗ trợ, báo cáo & phân quyền.
 */
import {
  API_BASE_URL,
  API_ORIGIN,
  apiFetch,
  apiFetchWithMeta,
  apiUpload,
  qs,
  type UploadedFileInfo,
} from './client';
import type {
  Order,
  Payment,
  Product,
  Promotion,
  Review,
  Store,
  SupportTicket,
  User,
} from '../../types';

export interface AdminStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  totalStores: number;
  totalPayments: number;
  totalReviews: number;
  totalPromotions: number;
  totalTickets: number;
}

export interface AdminDashboard {
  stats: AdminStats;
  changes: { revenue: number; orders: number };
  monthlyRevenue: { month: string; revenue: number; orders: number }[];
  recentOrders: {
    id: string;
    customer: string;
    amount: number;
    status: string;
    statusKey?: string;
    date: string;
    store?: string;
  }[];
  topProducts: { id: string; name: string; img: string; sold: number; revenue: number }[];
  openTickets?: number;
}

export interface AdminStore extends Store {
  slug: string;
  banner: string;
  description: string;
  reviewCount: number;
  orderCount: number;
  followerCount: number;
  status: 'active' | 'inactive' | 'suspended';
  taxId: string;
  bankAccount: string;
  bankName: string;
}

export interface AdminCustomer extends User {
  status: string;
  isLocked: boolean;
  totalOrders?: number;
  totalSpent?: number;
  orderCount?: number;
}

export interface AdminTicket extends SupportTicket {
  ticketCode: string;
  category: string;
  assignee: string;
  senderName: string;
  customerEmail: string;
  storeId: string;
  messages: {
    id: string;
    userId: string;
    userName: string;
    message: string;
    createdAt: string;
  }[];
}

export const adminApi = {
  /** Số liệu tổng quan hệ thống. */
  dashboard: (): Promise<AdminDashboard> =>
    apiFetch<AdminDashboard>(`${API_BASE_URL}/admin/dashboard`),

  // ─── Cửa hàng ─────────────────────────────────────────────────────────────
  async stores(
    params: {
      page?: number;
      pageSize?: number;
      status?: string;
      verified?: boolean;
      search?: string;
    } = {},
  ): Promise<{ stores: AdminStore[]; counts: { verified: number; unverified: number }; total: number }> {
    const { data, meta } = await apiFetchWithMeta<{
      stores: AdminStore[];
      counts: { verified: number; unverified: number };
    }>(`${API_BASE_URL}/admin/stores${qs(params)}`);
    return {
      stores: data?.stores ?? [],
      counts: data?.counts ?? { verified: 0, unverified: 0 },
      total: meta?.total ?? 0,
    };
  },

  createStore: (input: Record<string, unknown>): Promise<AdminStore> =>
    apiFetch<AdminStore>(`${API_BASE_URL}/admin/stores`, {
      method: 'POST',
      body: input,
    }),

  updateStore: (id: string, input: Record<string, unknown>): Promise<AdminStore> =>
    apiFetch<AdminStore>(`${API_BASE_URL}/admin/stores/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: input,
    }),

  /** Khóa / mở khóa / xác minh cửa hàng. */
  storeAction: (
    id: string,
    action: 'verify' | 'unverify' | 'lock' | 'unlock' | 'suspend',
    reason?: string,
  ): Promise<AdminStore> =>
    apiFetch<AdminStore>(
      `${API_BASE_URL}/admin/stores/${encodeURIComponent(id)}`,
      { method: 'POST', body: { action, ...(reason ? { reason } : {}) } },
    ),

  deleteStore: (id: string): Promise<{ id: string; deleted: boolean }> =>
    apiFetch<{ id: string; deleted: boolean }>(
      `${API_BASE_URL}/admin/stores/${encodeURIComponent(id)}`,
      { method: 'DELETE' },
    ),

  // ─── Khách hàng ───────────────────────────────────────────────────────────
  async customers(
    params: {
      page?: number;
      pageSize?: number;
      status?: string;
      search?: string;
    } = {},
  ): Promise<{ customers: AdminCustomer[]; counts: { active: number; locked: number }; total: number }> {
    const { data, meta } = await apiFetchWithMeta<{
      customers: AdminCustomer[];
      counts: { active: number; locked: number };
    }>(`${API_BASE_URL}/admin/customers${qs(params)}`);
    return {
      customers: data?.customers ?? [],
      counts: data?.counts ?? { active: 0, locked: 0 },
      total: meta?.total ?? 0,
    };
  },

  updateCustomer: (id: string, input: Record<string, unknown>): Promise<AdminCustomer> =>
    apiFetch<AdminCustomer>(
      `${API_BASE_URL}/admin/customers/${encodeURIComponent(id)}`,
      { method: 'PATCH', body: input },
    ),

  customerAction: (
    id: string,
    action: 'lock' | 'unlock',
    reason?: string,
  ): Promise<AdminCustomer> =>
    apiFetch<AdminCustomer>(
      `${API_BASE_URL}/admin/customers/${encodeURIComponent(id)}`,
      { method: 'POST', body: { action, ...(reason ? { reason } : {}) } },
    ),

  deleteCustomer: (id: string): Promise<{ id: string; deleted: boolean }> =>
    apiFetch<{ id: string; deleted: boolean }>(
      `${API_BASE_URL}/admin/customers/${encodeURIComponent(id)}`,
      { method: 'DELETE' },
    ),

  // ─── Đơn hàng ─────────────────────────────────────────────────────────────
  async orders(
    params: {
      page?: number;
      pageSize?: number;
      status?: string;
      search?: string;
    } = {},
  ): Promise<{ orders: Order[]; counts: Record<string, number>; total: number }> {
    const { data, meta } = await apiFetchWithMeta<{
      orders: Order[];
      counts: Record<string, number>;
    }>(`${API_BASE_URL}/admin/orders${qs(params)}`);
    return {
      orders: data?.orders ?? [],
      counts: data?.counts ?? {},
      total: meta?.total ?? 0,
    };
  },

  /** Chi tiết đơn + các giao dịch thanh toán của đơn. */
  async order(
    id: string,
  ): Promise<{ order: Order; payments: Payment[] }> {
    const data = await apiFetch<{ order: Order; payments: Payment[] }>(
      `${API_BASE_URL}/admin/orders/${encodeURIComponent(id)}`,
    );
    return { order: data.order, payments: data.payments ?? [] };
  },

  updateOrderStatus: (id: string, status: string, note?: string): Promise<Order> =>
    apiFetch<Order>(`${API_BASE_URL}/admin/orders/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: { status, ...(note ? { note } : {}) },
    }),

  // ─── Sản phẩm ─────────────────────────────────────────────────────────────
  async products(
    params: {
      page?: number;
      pageSize?: number;
      status?: string;
      category?: string;
      brand?: string;
      search?: string;
    } = {},
  ): Promise<{ products: (Product & { storeName: string })[]; total: number }> {
    const { data, meta } = await apiFetchWithMeta<{
      products: (Product & { storeName: string })[];
    }>(
      `${API_BASE_URL}/admin/products${qs(params)}`,
    );
    return { products: data?.products ?? [], total: meta?.total ?? 0 };
  },

  /** Chi tiết một sản phẩm (dùng cho trang chỉnh sửa). */
  product: (id: string): Promise<Product & { storeName: string; storeSlug: string }> =>
    apiFetch<Product & { storeName: string; storeSlug: string }>(
      `${API_BASE_URL}/admin/products/${encodeURIComponent(id)}`,
    ),

  /** Tải ảnh lên từ máy — trả về URL public dùng cho `images` của sản phẩm. */
  async uploadImages(files: File[] | File): Promise<{ files: UploadedFileInfo[] }> {
    const res = await apiUpload<{ files: UploadedFileInfo[] }>(
      `${API_BASE_URL}/admin/uploads`,
      files,
    );
    // Backend trả URL tương đối (`/api/uploads/...`) — gắn host API để ảnh
    // hiển thị được từ frontend (khác origin).
    return {
      files: res.files.map(f => ({
        ...f,
        url: f.url.startsWith('http') ? f.url : `${API_ORIGIN}${f.url}`,
      })),
    };
  },

  updateProduct: (id: string, input: Record<string, unknown>): Promise<Product> =>
    apiFetch<Product>(`${API_BASE_URL}/admin/products${qs({ id })}`, {
      method: 'PATCH',
      body: input,
    }),

  deleteProduct: (id: string): Promise<{ id: string; deleted: boolean }> =>
    apiFetch<{ id: string; deleted: boolean }>(
      `${API_BASE_URL}/admin/products${qs({ id })}`,
      { method: 'DELETE' },
    ),

  // ─── Đánh giá ─────────────────────────────────────────────────────────────
  async reviews(
    params: {
      page?: number;
      pageSize?: number;
      visibility?: string;
      rating?: number;
      productId?: string;
      storeId?: string;
      search?: string;
    } = {},
  ): Promise<{ reviews: Review[]; counts: { visible: number; hidden: number }; total: number }> {
    const { data, meta } = await apiFetchWithMeta<{
      reviews: Review[];
      counts: { visible: number; hidden: number };
    }>(`${API_BASE_URL}/admin/reviews${qs(params)}`);
    return {
      reviews: data?.reviews ?? [],
      counts: data?.counts ?? { visible: 0, hidden: 0 },
      total: meta?.total ?? 0,
    };
  },

  /** Duyệt / ẩn / bỏ ẩn / xoá đánh giá. */
  reviewAction: (
    id: string,
    action: 'approve' | 'hide' | 'unhide' | 'delete',
    reply?: string,
  ): Promise<Review | { id: string; deleted: boolean }> =>
    apiFetch<Review | { id: string; deleted: boolean }>(
      `${API_BASE_URL}/admin/reviews${qs({ id })}`,
      { method: 'POST', body: { action, ...(reply ? { reply } : {}) } },
    ),

  // ─── Khuyến mãi ───────────────────────────────────────────────────────────
  async promotions(
    params: { page?: number; pageSize?: number; status?: string } = {},
  ): Promise<{ promotions: Promotion[]; counts: Record<string, number>; total: number }> {
    const { data, meta } = await apiFetchWithMeta<{
      promotions: Promotion[];
      counts: Record<string, number>;
    }>(`${API_BASE_URL}/admin/promotions${qs(params)}`);
    return {
      promotions: data?.promotions ?? [],
      counts: data?.counts ?? {},
      total: meta?.total ?? 0,
    };
  },

  createPromotion: (input: Record<string, unknown>): Promise<Promotion> =>
    apiFetch<Promotion>(`${API_BASE_URL}/admin/promotions`, {
      method: 'POST',
      body: input,
    }),

  updatePromotion: (id: string, input: Record<string, unknown>): Promise<Promotion> =>
    apiFetch<Promotion>(
      `${API_BASE_URL}/admin/promotions/${encodeURIComponent(id)}`,
      { method: 'PATCH', body: input },
    ),

  deletePromotion: (id: string): Promise<{ id: string; deleted: boolean }> =>
    apiFetch<{ id: string; deleted: boolean }>(
      `${API_BASE_URL}/admin/promotions/${encodeURIComponent(id)}`,
      { method: 'DELETE' },
    ),

  // ─── Thanh toán ───────────────────────────────────────────────────────────
  async payments(
    params: {
      page?: number;
      pageSize?: number;
      status?: string;
      method?: string;
      search?: string;
    } = {},
  ): Promise<{ payments: Payment[]; stats: Record<string, number>; total: number }> {
    const { data, meta } = await apiFetchWithMeta<{
      payments: Payment[];
      stats: Record<string, number>;
    }>(`${API_BASE_URL}/admin/payments${qs(params)}`);
    return {
      payments: data?.payments ?? [],
      stats: data?.stats ?? {},
      total: meta?.total ?? 0,
    };
  },

  /** Hoàn tiền cho một giao dịch. */
  refundPayment: (
    id: string,
    reason?: string,
  ): Promise<Payment> =>
    apiFetch<Payment>(`${API_BASE_URL}/admin/payments`, {
      method: 'POST',
      body: { paymentId: id, ...(reason ? { reason } : {}) },
    }),

  // ─── Phiếu hỗ trợ ────────────────────────────────────────────────────────
  async tickets(
    params: {
      page?: number;
      pageSize?: number;
      status?: string;
      priority?: string;
      category?: string;
      scope?: string;
      storeId?: string;
      search?: string;
    } = {},
  ): Promise<{ tickets: AdminTicket[]; counts: Record<string, number>; total: number }> {
    const { data, meta } = await apiFetchWithMeta<{
      tickets: AdminTicket[];
      counts: Record<string, number>;
    }>(`${API_BASE_URL}/admin/support/tickets${qs(params)}`);
    return {
      tickets: data?.tickets ?? [],
      counts: data?.counts ?? {},
      total: meta?.total ?? 0,
    };
  },

  ticketAction: (
    id: string,
    input: { status?: string; assignee?: string; reply?: string },
  ): Promise<AdminTicket> =>
    apiFetch<AdminTicket>(
      `${API_BASE_URL}/admin/support/tickets/${encodeURIComponent(id)}`,
      { method: 'PATCH', body: input },
    ),

  /** Gửi phản hồi của admin cho khách hàng (thêm vào lịch sử ticket). */
  replyTicket: (id: string, message: string): Promise<AdminTicket> =>
    apiFetch<AdminTicket>(
      `${API_BASE_URL}/admin/support/tickets/${encodeURIComponent(id)}`,
      { method: 'POST', body: { message } },
    ),

  /** Đóng phiếu hỗ trợ. */
  closeTicket: (id: string): Promise<AdminTicket> =>
    apiFetch<AdminTicket>(
      `${API_BASE_URL}/admin/support/tickets/${encodeURIComponent(id)}`,
      { method: 'DELETE' },
    ),

  // ─── Báo cáo & tài chính ──────────────────────────────────────────────────
  reports: (): Promise<Record<string, unknown>> =>
    apiFetch<Record<string, unknown>>(`${API_BASE_URL}/admin/reports`),

  finance: (): Promise<Record<string, unknown>> =>
    apiFetch<Record<string, unknown>>(`${API_BASE_URL}/admin/finance`),

  // ─── Phân quyền ───────────────────────────────────────────────────────────
  permissions: (): Promise<Record<string, unknown>> =>
    apiFetch<Record<string, unknown>>(`${API_BASE_URL}/admin/access/roles`),

  updatePermissions: (
    role: string,
    permissions: string[],
  ): Promise<{ role: string; permissions: string[]; updated: boolean }> =>
    apiFetch<{ role: string; permissions: string[]; updated: boolean }>(
      `${API_BASE_URL}/admin/access/roles`,
      { method: 'PUT', body: { role, permissions } },
    ),

  async staff(
    params: { page?: number; pageSize?: number; search?: string } = {},
  ): Promise<{ staff: AdminCustomer[]; total: number }> {
    const { data, meta } = await apiFetchWithMeta<{
      staff: AdminCustomer[];
    }>(`${API_BASE_URL}/admin/access/staff${qs(params)}`);
    return { staff: data?.staff ?? [], total: meta?.total ?? 0 };
  },

  createStaff: (input: Record<string, unknown>): Promise<AdminCustomer> =>
    apiFetch<AdminCustomer>(`${API_BASE_URL}/admin/access/staff`, {
      method: 'POST',
      body: input,
    }),

  /** Cập nhật thông tin / vai trò / quyền của một nhân sự quản trị. */
  updateStaff: (
    id: string,
    input: Record<string, unknown>,
  ): Promise<AdminCustomer> =>
    apiFetch<AdminCustomer>(
      `${API_BASE_URL}/admin/access/staff/${encodeURIComponent(id)}`,
      { method: 'PATCH', body: input },
    ),

  /** Xoá nhân sự quản trị. */
  deleteStaff: (id: string): Promise<{ id: string; deleted: boolean }> =>
    apiFetch<{ id: string; deleted: boolean }>(
      `${API_BASE_URL}/admin/access/staff/${encodeURIComponent(id)}`,
      { method: 'DELETE' },
    ),

  // ─── Thông báo ────────────────────────────────────────────────────────────
  async notifications(
    params: { page?: number; pageSize?: number; type?: string } = {},
  ): Promise<{ notifications: unknown[]; counts: Record<string, number>; total: number }> {
    const { data, meta } = await apiFetchWithMeta<{
      notifications: unknown[];
      counts: Record<string, number>;
    }>(`${API_BASE_URL}/admin/notifications${qs(params)}`);
    return {
      notifications: data?.notifications ?? [],
      counts: data?.counts ?? {},
      total: meta?.total ?? 0,
    };
  },

  createNotification: (input: Record<string, unknown>): Promise<unknown> =>
    apiFetch<unknown>(`${API_BASE_URL}/admin/notifications`, {
      method: 'POST',
      body: input,
    }),
};
