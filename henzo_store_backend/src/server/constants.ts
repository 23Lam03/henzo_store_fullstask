/**
 * Enums & hằng số nghiệp vụ — dùng chung cho cả model và API.
 * Giá trị phải khớp chính xác với frontend (`henzo_store/src/types`).
 */

// ─── Vai trò ──────────────────────────────────────────────────────────────────
export const UserRole = {
  GUEST: 'GUEST',
  CUSTOMER: 'CUSTOMER',
  SHOP: 'SHOP',
  ADMIN: 'ADMIN',
  MODERATOR: 'MODERATOR',
  STAFF: 'STAFF',
} as const;
export type UserRoleValue = (typeof UserRole)[keyof typeof UserRole];

export const USER_ROLES = Object.values(UserRole);

// ─── Trạng thái đơn hàng (phía khách) ────────────────────────────────────────
export const CustomerOrderStatus = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPING: 'shipping',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const;
export type CustomerOrderStatusValue =
  (typeof CustomerOrderStatus)[keyof typeof CustomerOrderStatus];

// ─── Trạng thái đơn hàng (phía seller) ────────────────────────────────────────
export const SellerOrderStatus = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  SHIPPED: 'shipped',
  DELIVERING: 'delivering',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  RETURNED: 'returned',
} as const;
export type SellerOrderStatusValue =
  (typeof SellerOrderStatus)[keyof typeof SellerOrderStatus];

/**
 * Ánh xạ trạng thái seller -> customer.
 * (đối chiếu `SellerContext.mapCustomerStatusToSellerStatus` ở frontend)
 */
export const SELLER_TO_CUSTOMER_STATUS: Record<string, string> = {
  pending: 'pending',
  confirmed: 'confirmed',
  preparing: 'processing',
  shipped: 'shipping',
  delivering: 'shipping',
  delivered: 'delivered',
  cancelled: 'cancelled',
  returned: 'cancelled',
};

/** Ánh xạ trạng thái customer -> seller. */
export const CUSTOMER_TO_SELLER_STATUS: Record<string, string> = {
  pending: 'pending',
  confirmed: 'confirmed',
  processing: 'preparing',
  shipping: 'delivering',
  delivered: 'delivered',
  cancelled: 'cancelled',
};

// ─── Trạng thái thanh toán ────────────────────────────────────────────────────
export const OrderPaymentStatus = {
  UNPAID: 'unpaid',
  PAID: 'paid',
  REFUNDED: 'refunded',
  FAILED: 'failed',
} as const;

export const TransactionStatus = {
  SUCCESS: 'success',
  PENDING: 'pending',
  REFUNDED: 'refunded',
  FAILED: 'failed',
} as const;

export const AdminPaymentStatus = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;

// ─── Phương thức thanh toán ───────────────────────────────────────────────────
/** Chuẩn hoá về lowercase để lưu trong DB (đồng nhất seller + admin). */
export const PaymentMethod = {
  COD: 'cod',
  BANKING: 'banking',
  VNPAY: 'vnpay',
  MOMO: 'momo',
  ZALOPAY: 'zalopay',
  INSTALLMENT: 'installment',
} as const;
export type PaymentMethodValue = (typeof PaymentMethod)[keyof typeof PaymentMethod];

/** Map giá trị frontend gửi lên (viết hoa/tách) -> giá trị chuẩn. */
export const PAYMENT_METHOD_ALIASES: Record<string, PaymentMethodValue> = {
  COD: 'cod',
  cod: 'cod',
  BANKING: 'banking',
  banking: 'banking',
  'Chuyển khoản': 'banking',
  'Chuyển khoản ngân hàng': 'banking',
  VNPAY: 'vnpay',
  VNPay: 'vnpay',
  vnpay: 'vnpay',
  MOMO: 'momo',
  MoMo: 'momo',
  momo: 'momo',
  ZALOPAY: 'zalopay',
  ZaloPay: 'zalopay',
  zalopay: 'zalopay',
  ZALO: 'zalopay',
  zalo: 'zalopay',
  INSTALLMENT: 'installment',
  installment: 'installment',
};

// ─── Vận chuyển ──────────────────────────────────────────────────────────────
export const ShippingStatus = {
  WAITING_PICKUP: 'waiting_pickup',
  PICKED_UP: 'picked_up',
  IN_TRANSIT: 'in_transit',
  DELIVERING: 'delivering',
  DELIVERED: 'delivered',
  FAILED: 'failed',
  RETURNED: 'returned',
} as const;

export const SHIPPING_CARRIERS = [
  'GHTK',
  'GHN',
  'Viettel Post',
  'VNPost',
  'Ninja Van',
  'GrabExpress',
  'Ahamove',
] as const;

// ─── Kho hàng ─────────────────────────────────────────────────────────────────
export const InventoryStatus = {
  IN_STOCK: 'in_stock',
  LOW_STOCK: 'low_stock',
  OUT_OF_STOCK: 'out_of_stock',
} as const;

// ─── Khuyến mãi ───────────────────────────────────────────────────────────────
export const PromotionType = {
  VOUCHER: 'voucher',
  FLASH_SALE: 'flash_sale',
  COMBO: 'combo',
  DISCOUNT_CAMPAIGN: 'discount_campaign',
} as const;

export const SellerPromotionStatus = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  ENDED: 'ended',
  DRAFT: 'draft',
} as const;

export const DiscountType = {
  PERCENT: 'percent',
  FIXED: 'fixed',
  SHIPPING: 'shipping',
} as const;

/** Trạng thái khuyến mãi admin (suy ra từ ngày bắt đầu/kết thúc). */
export const AdminPromotionStatus = {
  UPCOMING: 'upcoming',
  ACTIVE: 'active',
  ENDED: 'ended',
} as const;

// ─── Hỗ trợ / ticket ──────────────────────────────────────────────────────────
export const TicketCategory = {
  ORDER: 'order',
  PAYMENT: 'payment',
  PRODUCT: 'product',
  ACCOUNT: 'account',
  TECHNICAL: 'technical',
  OTHER: 'other',
} as const;

export const TicketPriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;

export const CustomerTicketStatus = {
  OPEN: 'open',
  REPLIED: 'replied',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
} as const;

export const SellerTicketStatus = {
  NEW: 'new',
  IN_PROGRESS: 'in_progress',
  REPLIED: 'replied',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
} as const;

export const AdminTicketStatus = {
  OPEN: 'open',
  PENDING: 'pending',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
} as const;

export const MessageSender = {
  CUSTOMER: 'customer',
  SELLER: 'seller',
  ADMIN: 'admin',
  SYSTEM: 'system',
} as const;

// ─── Thông báo ────────────────────────────────────────────────────────────────
export const CustomerNotificationType = {
  ORDER: 'order',
  PROMOTION: 'promotion',
  VOUCHER: 'voucher',
  SYSTEM: 'system',
} as const;

export const SellerNotificationType = {
  ORDER: 'order',
  PRODUCT: 'product',
  PAYMENT: 'payment',
  SYSTEM: 'system',
  REVIEW: 'review',
  PROMOTION: 'promotion',
} as const;

export const AdminNotificationType = {
  PROMOTION: 'promotion',
  SYSTEM: 'system',
  WARNING: 'warning',
} as const;

export const NotificationAudience = {
  ALL: 'all',
  CUSTOMERS: 'customers',
  STORES: 'stores',
} as const;

// ─── Cửa hàng ────────────────────────────────────────────────────────────────
export const StoreStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
} as const;

export const ProductStatus = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  HIDDEN: 'hidden',
} as const;

// ─── Quyền hạn (RBAC) ─────────────────────────────────────────────────────────
/** 14 quyền chuẩn hiển thị trong ma trận phân quyền — khớp `ALL_PERMISSIONS` ở frontend. */
export const ALL_PERMISSIONS = [
  'Xem dashboard',
  'Quản lý sản phẩm',
  'Quản lý đơn hàng',
  'Quản lý khách hàng',
  'Quản lý cửa hàng',
  'Quản lý thanh toán',
  'Quản lý đánh giá',
  'Quản lý khuyến mãi',
  'Quản lý hỗ trợ',
  'Báo cáo',
  'Tài chính',
  'Phân quyền',
  'Quản lý kho',
  'Quản lý vận chuyển',
] as const;

export type Permission = (typeof ALL_PERMISSIONS)[number];

/**
 * Ma trận quyền mặc định theo vai trò — khớp `ROLE_PERMS` ở frontend.
 * Ghi chú: một số vai trò có thêm quyền chỉ đọc ('Xem báo cáo', 'Xem đơn hàng',
 * 'Hỗ trợ khách hàng') không nằm trong 14 quyền hiển thị ở ma trận.
 */
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  ADMIN: [
    'Xem dashboard',
    'Quản lý sản phẩm',
    'Quản lý đơn hàng',
    'Quản lý khách hàng',
    'Quản lý cửa hàng',
    'Quản lý thanh toán',
    'Quản lý đánh giá',
    'Quản lý khuyến mãi',
    'Quản lý hỗ trợ',
    'Báo cáo',
    'Tài chính',
    'Phân quyền',
  ],
  MODERATOR: [
    'Xem dashboard',
    'Quản lý sản phẩm',
    'Quản lý đánh giá',
    'Xem báo cáo',
  ],
  STAFF: ['Xem dashboard', 'Xem đơn hàng', 'Hỗ trợ khách hàng'],
  SHOP: [
    'Quản lý sản phẩm',
    'Quản lý đơn hàng',
    'Quản lý khuyến mãi',
    'Xem báo cáo',
    'Quản lý kho',
    'Quản lý vận chuyển',
  ],
};

/** Metadata vai trò cho trang Phân quyền. */
export const ROLE_META: Record<
  string,
  { label: string; desc: string; color: string; bg: string }
> = {
  ADMIN: {
    label: 'Admin',
    desc: 'Quản lý toàn bộ nội dung và người dùng',
    color: '#4F46E5',
    bg: 'rgba(79,70,229,0.1)',
  },
  MODERATOR: {
    label: 'Moderator',
    desc: 'Kiểm duyệt nội dung, đánh giá, sản phẩm',
    color: '#06B6D4',
    bg: 'rgba(6,182,212,0.1)',
  },
  STAFF: {
    label: 'Staff',
    desc: 'Hỗ trợ khách hàng, xem đơn hàng',
    color: '#10B981',
    bg: 'rgba(16,185,129,0.1)',
  },
  SHOP: {
    label: 'Shop',
    desc: 'Người bán — quản lý cửa hàng và sản phẩm',
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.1)',
  },
};

// ─── Nghiệp vụ đặt hàng ──────────────────────────────────────────────────────
/** Ngưỡng miễn phí vận chuyển (đồng) — khớp frontend. */
export const FREE_SHIPPING_THRESHOLD = 500_000;
/** Phí vận chuyển cố định (đồng). */
export const SHIPPING_FEE = 30_000;
/**
 * Phí sàn — tỷ lệ nền tảng thu từ doanh thu của seller.
 *
 * Đây là **tỷ lệ duy nhất** dùng cho toàn hệ thống:
 * - `Payment.platformFee` = số tiền bị trừ khỏi doanh thu seller.
 * - Doanh thu nền tảng (admin finance) = tổng `platformFee` thu được.
 *
 * Không tách thành 2 tỷ lệ (phí sàn vs hoa hồng) vì sẽ dẫn tới việc thu
 * trùng hai lần trên cùng một đơn. Đổi giá trị ở đây là đủ cho cả hai phía.
 */
export const PLATFORM_FEE_RATE = 0.023;
/** Alias giữ lại cho các chỗ gọi tên "hoa hồng" — cùng giá trị với phí sàn. */
export const PLATFORM_COMMISSION_RATE = PLATFORM_FEE_RATE;
/** Thời gian tối đa được hủy đơn kể từ lúc đặt (ms). */
export const ORDER_CANCEL_WINDOW_MS = 60 * 60 * 1000;

// ─── Phân trang ───────────────────────────────────────────────────────────────
export const PAGINATION = {
  defaultPageSize: 12,
  maxPageSize: 100,
  pageSizeOptions: [12, 24, 48, 96],
} as const;

// ─── Thông tin công ty / hệ thống ────────────────────────────────────────────
export const SYSTEM = {
  companyName: 'Công ty TNHH Henzo Store',
  hotline: '1900 1234',
  email: 'contact@henzo.vn',
  address: '123 Đường ABC, Phường XYZ, Quận 1, TP. Hồ Chí Minh',
  taxId: '0123456789',
  orderNumberPrefix: 'HDN',
  ticketCodePrefix: 'TKTSPT',
} as const;

/** Ngưỡng sản phẩm còn hàng / sắp hết — dùng cho badge & cảnh báo. */
export const LOW_STOCK_THRESHOLD = 10;
