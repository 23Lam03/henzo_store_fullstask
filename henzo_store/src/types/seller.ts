export interface SellerStore {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  avatar: string;
  banner: string;
  rating: number;
  productCount: number;
  orderCount: number;
  followerCount: number;
  isVerified: boolean;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  description: string;
  taxId: string;
  bankAccount: string;
  bankName: string;
}

export interface SellerOrder {
  id: string;
  orderCode: string;
  customerName: string;
  customerPhone: string;
  customerAvatar: string;
  items: number;
  totalAmount: number;
  shippingFee: number;
  discount: number;
  finalAmount: number;
  status: OrderStatus;
  paymentMethod: 'cod' | 'banking' | 'vnpay' | 'momo' | 'zalopay';
  paymentStatus: PaymentStatus;
  shippingAddress: string;
  note: string;
  createdAt: string;
  updatedAt: string;
  estimatedDelivery: string;
  trackingNumber: string;
  shippingPartner: string;
  storeId: string;
  products: SellerOrderItem[];
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'shipped'
  | 'delivering'
  | 'delivered'
  | 'cancelled'
  | 'returned';

export type PaymentStatus = 'unpaid' | 'paid' | 'refunded' | 'failed';

export interface SellerOrderItem {
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  sku: string;
  options: Record<string, string>;
}

export interface SellerPayment {
  id: string;
  transactionId: string;
  orderId: string;
  orderCode: string;
  amount: number;
  platformFee: number;
  netAmount: number;
  status: 'success' | 'pending' | 'refunded' | 'failed';
  paymentMethod: string;
  createdAt: string;
  storeId: string;
}

export interface SellerReview {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  customerName: string;
  customerAvatar: string;
  rating: number;
  content: string;
  images: string[];
  isHidden: boolean;
  hasResponse: boolean;
  sellerResponse: string;
  createdAt: string;
  storeId: string;
  orderId: string;
}

export interface SellerPromotion {
  id: string;
  name: string;
  type: 'voucher' | 'flash_sale' | 'combo' | 'discount_campaign';
  code: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  minOrderValue: number;
  maxDiscount: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'paused' | 'ended' | 'draft';
  usageLimit: number;
  usedCount: number;
  targetProducts: string[];
  targetCategories: string[];
    storeId?: string;
  createdAt: string;
}

export interface SellerSupportTicket {
  id: string;
  ticketCode: string;
  subject: string;
  category: 'order' | 'payment' | 'product' | 'account' | 'technical' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'new' | 'in_progress' | 'replied' | 'resolved' | 'closed';
  customerName: string;
  customerEmail: string;
  messages: SupportMessage[];
  createdAt: string;
  updatedAt: string;
  storeId: string;
}

export interface SupportMessage {
  id: string;
  sender: 'customer' | 'seller' | 'admin';
  senderName: string;
  content: string;
  attachments: string[];
  createdAt: string;
}

export interface SellerInventoryItem {
  sku: string;
  productId: string;
  productName: string;
  productImage: string;
  category: string;
  stock: number;
  minStock: number;
  sold: number;
  reserved: number;
  available: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  lastRestocked: string;
  storeId: string;
}

export interface SellerProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice: number;
  discount: number;
  images: string[];
  categoryId: string;
  categoryName: string;
  brand: string;
  sku: string;
  stock: number;
  minStock: number;
  rating: number;
  reviewCount: number;
  sold: number;
  views: number;
  tags: string[];
  specifications: Record<string, string>;
  isFeatured: boolean;
  isNew: boolean;
  isHot: boolean;
  status: string;
  storeId: string;
  createdAt: string;
  updatedAt: string;
}

export interface SellerShipping {
  id: string;
  orderId: string;
  orderCode: string;
  trackingNumber: string;
  carrier: string;
  status: 'waiting_pickup' | 'picked_up' | 'in_transit' | 'delivering' | 'delivered' | 'failed' | 'returned';
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  weight: number;
  dimensions: string;
  estimatedDelivery: string;
  actualDelivery: string;
  shippingFee: number;
  codAmount: number;
  createdAt: string;
  updatedAt: string;
  storeId: string;
}

export interface SellerFinanceSummary {
  totalRevenue: number;
  totalOrders: number;
  totalPlatformFee: number;
  totalRefund: number;
  netRevenue: number;
  avgOrderValue: number;
  period: 'today' | 'week' | 'month' | 'year';
}

export interface SellerDashboardStats {
  totalRevenue: number;
  revenueChange: number;
  totalOrders: number;
  ordersChange: number;
  pendingOrders: number;
  completedOrders: number;
  totalProducts: number;
  outOfStockProducts: number;
  newCustomers: number;
  conversionRate: number;
  avgRating: number;
}

export interface SellerNotification {
  id: string;
  type: 'order' | 'product' | 'payment' | 'system' | 'review' | 'promotion';
  title: string;
  message: string;
  isRead: boolean;
  link: string;
  createdAt: string;
  storeId: string;
}

export interface DailyRevenue {
  date: string;
  revenue: number;
  orders: number;
}

export interface MonthlyData {
  month: string;
  revenue: number;
  orders: number;
  customers: number;
}
