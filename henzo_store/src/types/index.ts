// ─── Base Types ──────────────────────────────────────────────────────────────

// ─── Product Types ────────────────────────────────────────────────────────────
export type UserRole = 'GUEST' | 'CUSTOMER' | 'SHOP' | 'ADMIN';

export const UserRole = {
  GUEST: 'GUEST' as UserRole,
  CUSTOMER: 'CUSTOMER' as UserRole,
  SHOP: 'SHOP' as UserRole,
  ADMIN: 'ADMIN' as UserRole,
};

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  avatar: string;
  role: UserRole;
  address?: string;
  createdAt: string;
  /** Trạng thái tài khoản — admin có thể khoá. */
  status?: string;
  isLocked?: boolean;
  /** Tổng số đơn / chi tiêu — chỉ có trong response của admin. */
  totalOrders?: number;
  totalSpent?: number;
  orderCount?: number;
  lastLogin?: string | null;
  permissions?: string[];
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ─── Product Types ────────────────────────────────────────────────────────────
export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
  children?: ProductCategory[];
  featured?: boolean;
  image?: string;
  banner?: string;
  description?: string;
  parentId?: string | null;
  order?: number;
  productCount?: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  price: number;
  originalPrice: number;
  discount: number;
  images: string[];
  categoryId: string;
  categoryName: string;
  brand: string;
  rating: number;
  reviewCount: number;
  stock: number;
  sold: number;
  tags: string[];
  specifications: Record<string, string>;
  isFeatured: boolean;
  isNew: boolean;
  isHot: boolean;
  createdAt: string;
  /** Danh mục / cửa hàng sở hữu (chỉ có trong DTO của admin & seller). */
  category?: { id: string; name: string; slug: string };
  store?: { id: string; name: string; slug: string };
  storeId?: string;
  storeName?: string;
  sku?: string;
  status?: 'draft' | 'active' | 'hidden';
  minStock?: number;
  viewCount?: number;
}

// ─── Cart Types ───────────────────────────────────────────────────────────────
export interface CartItem {
  product: Product;
  quantity: number;
  selected: boolean;
}

export interface CartState {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  totalOriginalPrice: number;
  savings: number;
}

// ─── Order Types ─────────────────────────────────────────────────────────────
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipping'
  | 'delivered'
  | 'cancelled';

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  items: CartItem[];
  subtotal: number;
  shippingFee: number;
  discount: number;
  totalPrice: number;
  status: OrderStatus;
  shippingAddress: string;
  paymentMethod: string;
  /** Trạng thái thanh toán của đơn (unpaid/paid/refunded/failed). */
  paymentStatus?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Notification Types ────────────────────────────────────────────────────────
export type NotificationType = 'order' | 'promotion' | 'voucher' | 'system';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  link?: string;
}

// ─── Search Types ─────────────────────────────────────────────────────────────
export interface SearchResult {
  products: Product[];
  categories: ProductCategory[];
  totalResults: number;
}

export interface SearchHistory {
  id: string;
  query: string;
  timestamp: string;
}

// ─── Wishlist Types ───────────────────────────────────────────────────────────
export interface WishlistItem {
  product: Product;
  addedAt: string;
}

// ─── Review Types ─────────────────────────────────────────────────────────────
export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  comment: string;
  createdAt: string;
  images?: string[];
  isVerified: boolean;
  replies?: ReviewReply[];
  productName?: string;
  productImage?: string;
  storeId?: string;
  storeName?: string;
  orderId?: string;
  isHidden?: boolean;
  hasResponse?: boolean;
  sellerResponse?: string;
}

export interface ReviewReply {
  id: string;
  userId: string;
  userName: string;
  comment: string;
  createdAt: string;
}

// ─── Promotion Types ──────────────────────────────────────────────────────────
export interface Promotion {
  id: string;
  title: string;
  description: string;
  image: string;
  discount: number;
  code?: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

// ─── Store Types ─────────────────────────────────────────────────────────────
export interface Store {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  avatar: string;
  rating: number;
  productCount: number;
  isVerified: boolean;
  createdAt: string;
  slug?: string;
  banner?: string;
  description?: string;
  tagline?: string;
  status?: string;
  reviewCount?: number;
  orderCount?: number;
  followerCount?: number;
}

// ─── Payment Types ────────────────────────────────────────────────────────────
export interface Payment {
  id: string;
  orderId: string;
  orderCode?: string;
  amount: number;
  /** Phí sàn đã trừ khỏi doanh thu seller. */
  platformFee?: number;
  /** Tiền seller thực nhận = amount - platformFee. */
  netAmount?: number;
  method: string;
  /**
   * Trạng thái giao dịch.
   *
   * Backend dùng 2 bộ tên khác nhau:
   * - Giao dịch của **khách hàng** (`/api/payments`) -> `'success'`.
   * - Bảng **admin** (`/api/admin/payments`) -> `'completed'`.
   *
   * Kiểu này chấp nhận cả hai để không vỡ type ở bất kỳ nơi nào.
   */
  status: 'pending' | 'success' | 'completed' | 'failed' | 'refunded';
  transactionId: string;
  createdAt: string;
  /** Tên cửa hàng nhận giao dịch (có trong response của admin). */
  storeName?: string;
  storeId?: string;
  note?: string;
}

// ─── Breadcrumb Types ─────────────────────────────────────────────────────────
export interface BreadcrumbItem {
  label: string;
  href?: string;
}

// ─── Table Types (Admin) ──────────────────────────────────────────────────────
export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (value: unknown, record: T) => React.ReactNode;
}

export interface TablePagination {
  page: number;
  pageSize: number;
  total: number;
}

// ─── Menu Types ───────────────────────────────────────────────────────────────
export interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  href?: string;
  children?: MenuItem[];
  badge?: string | number;
  permission?: UserRole[];
  divider?: boolean;
  external?: boolean;
}

// ─── Shipping Types ───────────────────────────────────────────────────────────
export interface ShippingUpdate {
  id: string;
  orderId: string;
  status: string;
  location: string;
  timestamp: string;
  description: string;
}

// ─── Support Types ────────────────────────────────────────────────────────────
export interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  status: 'open' | 'pending' | 'resolved' | 'closed' | 'new' | 'in_progress' | 'replied';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  updatedAt: string;
  replies?: SupportReply[];
  ticketCode?: string;
  category?: string;
  assignee?: string;
  senderName?: string;
  customerEmail?: string;
  storeId?: string;
  messages?: {
    id: string;
    userId: string;
    userName: string;
    message: string;
    createdAt: string;
  }[];
}

export interface SupportReply {
  id: string;
  userId: string;
  userName: string;
  message: string;
  createdAt: string;
}

// ─── Blog Types ──────────────────────────────────────────────────────────────
export interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  thumbnail: string;
  author: string;
  authorAvatar: string;
  category: string;
  createdAt: string;
  views: number;
}

// ─── Brand Types ───────────────────────────────────────────────────────────
export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo: string;
  productCount: number;
  banner?: string;
  tagline?: string;
  description?: string;
  color?: string;
}
