/**
 * ⚠️  Dữ liệu mẫu (legacy) — KHÔNG dùng trực tiếp trong runtime của frontend.
 *
 * Toàn bộ ứng dụng đã chuyển sang backend TanStack (`henzo_store_backend`).
 * File này chỉ còn là **nguồn dữ liệu cho script seed** của backend:
 *   cd ../henzo_store_backend && npx tsx scripts/extract-frontend-data.ts
 */
import type {
  SellerStore, SellerOrder, SellerPayment, SellerReview,
  SellerPromotion, SellerSupportTicket, SellerInventoryItem,
  SellerShipping, SellerNotification, DailyRevenue, MonthlyData
} from '../types/seller';
import type { Product } from '../types';
import {
  PRODUCT_VARIANTS,
  variantName,
  variantCategory,
  variantBrand,
} from './productVariants';
import { imagesForProduct } from './modelImages';
import { specsForProduct } from './modelSpecs';
import { productDescription, productTags } from './productCopy';

const generateId = (prefix: string, n: number) => `${prefix}-${String(n).padStart(4, '0')}`;

const CUSTOMER_NAMES = [
  'Nguyễn Văn Minh', 'Trần Thị Lan', 'Lê Hoàng Nam', 'Phạm Thị Hương', 'Hoàng Văn Đức',
  'Vũ Thị Mai', 'Đặng Văn Hùng', 'Bùi Thị Xuan', 'Ngô Văn Quang', 'Dương Thị Hà',
  'Phan Thị Lan', 'Trịnh Văn Khải', 'Cao Thị Ngọc', 'Hồ Văn Tùng', 'Đỗ Thị Phương',
  'Lý Văn Bình', 'Trần Minh Tuấn', 'Nguyễn Thu Hà', 'Lê Văn Phong', 'Trần Thị Thảo',
  'Phạm Quang Huy', 'Vũ Thị Kim Anh', 'Đặng Hoàng Nam', 'Bùi Minh Đức', 'Nguyễn Thị Hường',
];



/** Danh mục sản phẩm (dùng cho sản phẩm, khuyến mãi, đơn hàng). */
const CATEGORIES = [
  'Điện thoại', 'Laptop', 'PC Gaming', 'Màn hình',
  'Chuột', 'Bàn phím', 'Tai nghe', 'Phụ kiện',
];

/**
 * Ảnh thật theo danh mục.
 *
 * Trước đây ảnh được sinh bằng công thức `1550000000000 + n` — tạo ra URL
 * Unsplash **không tồn tại** (HTTP 404) nên mọi sản phẩm hiển thị ô trống.
 * Mỗi ảnh dưới đây đã được kiểm tra HTTP 200 và xác minh đúng loại thiết bị
 * bằng Vision framework.
 */
const CATEGORY_IMAGES: Record<string, string[]> = {
  'Điện thoại': [
    'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600',
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600',
    'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=600',
    'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600',
    'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600',
    'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=600',
    'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=600',
    'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=600',
  ],
  Laptop: [
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600',
    'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=600',
    'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600',
    'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600',
    'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=600',
    'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=600',
  ],
  'PC Gaming': [
    'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=600',
    'https://images.unsplash.com/photo-1563770660941-20978e870e26?w=600',
    'https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=600',
  ],
  'Màn hình': [
    'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600',
    'https://images.unsplash.com/photo-1547394765-185e1e68f34e?w=600',
  ],
  Chuột: [
    'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600',
    'https://images.unsplash.com/photo-1586816879360-004f5b0c51e5?w=600',
  ],
  'Bàn phím': [
    'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=600',
    'https://images.unsplash.com/photo-1601597111158-2fceff292cdc?w=600',
  ],
  'Tai nghe': [
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600',
    'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600',
    'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600',
  ],
  'Phụ kiện': [
    'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=600',
    'https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=600',
    'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=600',
  ],
};

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=600',
  'https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=600',
];


const SHIPPING_PARTNERS = ['GHTK', 'GHN', 'Viettel Post', 'VNPost', 'Ninja Van', 'GrabExpress', 'Ahamove'];
const CITIES = ['TP. Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Cần Thơ', 'Hải Phòng', 'Biên Hòa', 'Nha Trang', 'Hải Dương'];

const STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ xác nhận', confirmed: 'Đã xác nhận', preparing: 'Đang chuẩn bị',
  shipped: 'Đã giao cho shipper', delivering: 'Đang vận chuyển', delivered: 'Giao thành công',
  cancelled: 'Đã hủy', returned: 'Hoàn trả',
};

const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B', confirmed: '#3B82F6', preparing: '#8B5CF6',
  shipped: '#2E6E70', delivering: '#2A6A85', delivered: '#10B981',
  cancelled: '#9CA3AF', returned: '#EF4444',
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cod: 'Thanh toán khi nhận hàng (COD)',
  banking: 'Chuyển khoản ngân hàng',
  vnpay: 'VNPay',
  momo: 'MoMo',
  zalopay: 'ZaloPay',
};

// ─── 50 Stores ──────────────────────────────────────────────────────────────────
export const mockStores: SellerStore[] = Array.from({ length: 50 }, (_, i) => {
  const n = i + 1;
  const rating = +(3.5 + Math.random() * 1.5).toFixed(1);
  const productCount = Math.floor(10 + Math.random() * 490);
  const orderCount = Math.floor(100 + Math.random() * 9900);
  return {
    id: generateId('store', n),
    name: n === 1 ? 'Henzo Tech Store' : n === 2 ? 'TechPro Shop' : `Cửa Hàng Công Nghệ ${n}`,
    email: `shop${n}@henzo.com`,
    phone: `09${String(Math.floor(10000000 + Math.random() * 90000000))}`,
    address: `${Math.floor(1 + Math.random() * 999)} Lê Lợi, ${CITIES[Math.floor(Math.random() * CITIES.length)]}`,
    avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=store${n}`,
    banner: `https://images.unsplash.com/photo-${1550000000000 + n * 1000}?w=1200&h=300&fit=crop`,
    rating,
    productCount,
    orderCount,
    followerCount: Math.floor(50 + Math.random() * 4950),
    isVerified: n <= 30,
    status: n <= 45 ? 'active' : n <= 48 ? 'inactive' : 'suspended',
    createdAt: new Date(2022, Math.floor(Math.random() * 24), Math.floor(1 + Math.random() * 28)).toISOString(),
    description: `Chuyên cung cấp các sản phẩm công nghệ chính hãng với giá tốt nhất thị trường.`,
    taxId: `0${Math.floor(1000000000 + Math.random() * 9000000000)}`,
    bankAccount: `0${Math.floor(100000000000 + Math.random() * 900000000000)}`,
    bankName: ['Vietcombank', 'Techcombank', 'ACB', 'MB Bank', 'VPBank'][Math.floor(Math.random() * 5)],
  };
});

// Default store (shop@henzo.com)
export const currentStore = mockStores[0];

// ─── 500 Products ───────────────────────────────────────────────────────────────
export const mockSellerProducts: Product[] = Array.from({ length: 500 }, (_, i) => {
  const n = i + 1;
  const stock = Math.floor(Math.random() * 500);
  const sold = Math.floor(Math.random() * 200);

  // Tên sản phẩm chọn trước, rồi suy ra danh mục & thương hiệu **từ tên**
  // để ảnh, danh mục và thương hiệu luôn khớp nhau.
  //
  // Mỗi sản phẩm là một **biến thể cấu hình khác nhau** (dung lượng / màu /
  // kích thước) của một dòng sản phẩm thật -> 500 sản phẩm có 500 tên khác
  // nhau, không lặp lại như trước (trước đây chỉ có 20 model lặp ~25 lần).
  const variant = PRODUCT_VARIANTS[i % PRODUCT_VARIANTS.length];
  const productName = variantName(variant);
  const category = variantCategory(variant);
  const brand = variantBrand(variant);
  const imagePool = CATEGORY_IMAGES[category] ?? FALLBACK_IMAGES;

  // Giá theo danh mục (giá thị trường thực tế, không random rác).
  const PRICE_RANGE: Record<string, [number, number]> = {
    'Điện thoại': [5000000, 45000000],
    Laptop: [15000000, 90000000],
    'PC Gaming': [25000000, 250000000],
    'Màn hình': [3000000, 45000000],
    Chuột: [700000, 5000000],
    'Bàn phím': [900000, 7000000],
    'Tai nghe': [800000, 12000000],
    'Phụ kiện': [400000, 9000000],
  };
  const [lo, hi] = PRICE_RANGE[category] ?? [500000, 50000000];
  const basePrice = Math.floor(lo + Math.random() * (hi - lo));
  const hasDiscount = Math.random() > 0.4;
  const originalPrice = hasDiscount
    ? Math.floor(basePrice * (1.1 + Math.random() * 0.4))
    : basePrice;
  const discount = hasDiscount
    ? Math.floor((1 - basePrice / originalPrice) * 100)
    : 0;

  return {
    id: generateId('seller-prod', n),
    name: productName,
    slug: `${productName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${n}`,
    description: productDescription({
      productName,
      base: variant.base,
      kind: variant.kind,
      category,
      brand,
    }),
    price: basePrice,
    originalPrice,
    discount,
    images: (() => {
      // Ảnh THẬT theo model (iPhone 16 ≠ iPhone 15). Nếu model chưa có ảnh
      // riêng -> dùng ảnh theo danh mục.
      const real = imagesForProduct(productName);
      if (real?.length) {
        // Xoay vòng ảnh để các biến thể cùng model không bị trùng ảnh chính.
        const k = n % real.length;
        return [...real.slice(k), ...real.slice(0, k)].slice(0, 3);
      }
      return [
        imagePool[n % imagePool.length],
        imagePool[(n + 1) % imagePool.length],
        imagePool[(n + 2) % imagePool.length],
      ];
    })(),
    categoryId: `cat-${category}`,
    categoryName: category,
    brand,
    rating: +(3 + Math.random() * 2).toFixed(1),
    reviewCount: Math.floor(Math.random() * 100),
    stock,
    sold,
    tags: productTags({
      productName,
      base: variant.base,
      kind: variant.kind,
      category,
      brand,
    }),
    specifications: (() => {
      // Thông số THẬT theo model (bảng `modelSpecs.ts`). Trước đây đoạn này
      // random `CPU/RAM/SSD` -> một chiếc MacBook Pro bị gán "Intel Core i9".
      const { specs, missing } = specsForProduct(productName);
      if (!missing) return specs;
      // Dự phòng: model chưa có trong bảng -> thông số tối thiểu hợp lệ.
      return {
        'Bộ nhớ': '512GB SSD',
        'Bảo hành': '12 tháng chính hãng',
        'Tình trạng': 'Mới 100%',
      };
    })(),
    isFeatured: Math.random() > 0.7,
    isNew: Math.random() > 0.7,
    isHot: Math.random() > 0.7,
    createdAt: new Date(2023, Math.floor(Math.random() * 12), Math.floor(1 + Math.random() * 28)).toISOString(),
  };
});

// ─── 1000 Orders ────────────────────────────────────────────────────────────────
export const mockSellerOrders: SellerOrder[] = Array.from({ length: 1000 }, (_, i) => {
  const n = i + 1;
  const statuses: SellerOrder['status'][] = ['pending', 'confirmed', 'preparing', 'shipped', 'delivering', 'delivered', 'cancelled', 'returned'];
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  const paymentMethods: SellerOrder['paymentMethod'][] = ['cod', 'banking', 'vnpay', 'momo', 'zalopay'];
  const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
  const paymentStatuses: SellerOrder['paymentStatus'][] = ['unpaid', 'paid', 'refunded', 'failed'];
  const paymentStatus: SellerOrder['paymentStatus'] = status === 'delivered' && paymentMethod === 'cod'
    ? 'unpaid' : status === 'delivered' || status === 'confirmed' ? 'paid' : paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)];
  const items = Math.floor(1 + Math.random() * 5);
  const shippingFee = Math.floor(20000 + Math.random() * 80000);
  const discount = Math.random() > 0.6 ? Math.floor(Math.random() * 500000) : 0;
  const totalAmount = Math.floor(500000 + Math.random() * 50000000) * items;
  const finalAmount = totalAmount + shippingFee - discount;
  const createdAt = new Date(2024, Math.floor(Math.random() * 12), Math.floor(1 + Math.random() * 28),
    Math.floor(Math.random() * 24), Math.floor(Math.random() * 60)).toISOString();
  return {
    id: generateId('ord', n),
    orderCode: `ORD${String(n).padStart(6, '0')}`,
    customerName: CUSTOMER_NAMES[Math.floor(Math.random() * CUSTOMER_NAMES.length)],
    customerPhone: `09${String(Math.floor(10000000 + Math.random() * 90000000))}`,
    customerAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=customer${n}`,
    items,
    totalAmount,
    shippingFee,
    discount,
    finalAmount,
    status,
    paymentMethod,
    paymentStatus,
    shippingAddress: `${Math.floor(1 + Math.random() * 999)} Nguyễn Trãi, ${CITIES[Math.floor(Math.random() * CITIES.length)]}`,
    note: Math.random() > 0.7 ? 'Giao giờ hành chính' : '',
    createdAt,
    updatedAt: new Date(new Date(createdAt).getTime() + Math.floor(Math.random() * 86400000 * 7)).toISOString(),
    estimatedDelivery: new Date(new Date(createdAt).getTime() + 86400000 * 5).toLocaleDateString('vi-VN'),
    trackingNumber: status === 'delivered' || status === 'shipped' || status === 'delivering'
      ? `${['GHTK', 'GHN', 'VTP'][Math.floor(Math.random() * 3)]}${Math.floor(1000000000 + Math.random() * 9000000000)}`
      : '',
    shippingPartner: SHIPPING_PARTNERS[Math.floor(Math.random() * SHIPPING_PARTNERS.length)],
    storeId: currentStore.id,
    products: Array.from({ length: items }, () => {
      const product = mockSellerProducts[Math.floor(Math.random() * 100)];
      const qty = Math.floor(1 + Math.random() * 3);
      return {
        productId: product.id,
        productName: product.name,
        productImage: product.images[0],
        quantity: qty,
        unitPrice: product.price,
        totalPrice: product.price * qty,
        sku: `SKU-${product.id.slice(-6)}`,
        options: {},
      };
    }),
  };
});

// ─── 500 Payments ───────────────────────────────────────────────────────────────
export const mockSellerPayments: SellerPayment[] = Array.from({ length: 500 }, (_, i) => {
  const n = i + 1;
  const order = mockSellerOrders[i];
  const amount = order.finalAmount;
  const platformFee = Math.floor(amount * 0.023);
  const status: SellerPayment['status'] = order.paymentStatus === 'paid'
    ? 'success' : order.paymentStatus === 'refunded' ? 'refunded' : order.paymentStatus === 'failed' ? 'failed' : 'pending';
  return {
    id: generateId('pay', n),
    transactionId: `TXN${String(Math.floor(Math.random() * 1000000000)).padStart(10, '0')}`,
    orderId: order.id,
    orderCode: order.orderCode,
    amount,
    platformFee,
    netAmount: amount - platformFee,
    status,
    paymentMethod: order.paymentMethod,
    createdAt: order.createdAt,
    storeId: currentStore.id,
  };
});

// ─── 200 Reviews ────────────────────────────────────────────────────────────────
const REVIEW_CONTENTS = [
  'Sản phẩm tốt, đóng gói cẩn thận, giao hàng nhanh. Sẽ ủng hộ tiếp!',
  'Chất lượng tuyệt vời như mô tả. Đáng đồng tiền bát gạo!',
  'Mình đặt 2 cái nhưng được giao 3 cái, không biết là quà tặng hay gì nhưng rất vui!',
  'Điện thoại xài rất mượt, pin trâu. Camera chụp đẹp lắm!',
  'Shop tư vấn nhiệt tình, giao hàng đúng hẹn. 5 sao cho shop!',
  'Màn hình có 1 điểm chết nhỏ, liên hệ shop được đổi ngay. Dịch vụ tốt!',
  'Laptop nhận được đẹp hơn hình, chạy êm, pin 8 tiếng. Rất hài lòng!',
  'Tai nghe nghe nhạc rất hay, bass mạnh. Đóng gói chắc chắn.',
  'Giao hàng hơi chậm 1 ngày nhưng sản phẩm rất OK. Cảm ơn shop!',
  'Đã mua lần 3 ở shop này rồi. Lần nào cũng ok hết. Yêu shop!',
];

export const mockSellerReviews: SellerReview[] = Array.from({ length: 200 }, (_, i) => {
  const n = i + 1;
  const rating = Math.floor(1 + Math.random() * 5);
  const product = mockSellerProducts[Math.floor(Math.random() * 100)];
  const createdAt = new Date(2024, Math.floor(Math.random() * 12), Math.floor(1 + Math.random() * 28)).toISOString();
  return {
    id: generateId('rev', n),
    productId: product.id,
    productName: product.name,
    productImage: product.images[0],
    customerName: CUSTOMER_NAMES[Math.floor(Math.random() * CUSTOMER_NAMES.length)],
    customerAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=rev${n}`,
    rating,
    content: REVIEW_CONTENTS[Math.floor(Math.random() * REVIEW_CONTENTS.length)],
    images: Math.random() > 0.6
      ? [`https://images.unsplash.com/photo-${1550000000000 + n * 500}?w=300`]
      : [],
    isHidden: Math.random() > 0.95,
    hasResponse: Math.random() > 0.6,
    sellerResponse: Math.random() > 0.6
      ? 'Cảm ơn quý khách đã tin tưởng và ủng hộ cửa hàng! Chúc quý khách có trải nghiệm tốt với sản phẩm. Hẹn gặp lại!'
      : '',
    createdAt,
    storeId: currentStore.id,
    orderId: mockSellerOrders[n % 100].id,
  };
});

// ─── 100 Promotions ─────────────────────────────────────────────────────────────
export const mockSellerPromotions: SellerPromotion[] = [
  { id: 'prm-001', name: 'Flash Sale Cuối Năm', type: 'flash_sale', code: 'YEAREND50', discountType: 'percent', discountValue: 50, minOrderValue: 2000000, maxDiscount: 500000, startDate: '2024-12-01', endDate: '2024-12-31', status: 'active', usageLimit: 500, usedCount: 234, targetProducts: [], targetCategories: ['Điện thoại'], storeId: currentStore.id, createdAt: '2024-11-15' },
  { id: 'prm-002', name: 'Giảm 15% Laptop Gaming', type: 'discount_campaign', code: 'GAMING15', discountType: 'percent', discountValue: 15, minOrderValue: 15000000, maxDiscount: 2000000, startDate: '2024-11-01', endDate: '2025-01-31', status: 'active', usageLimit: 200, usedCount: 87, targetProducts: [], targetCategories: ['Laptop', 'PC Gaming'], storeId: currentStore.id, createdAt: '2024-10-20' },
  { id: 'prm-003', name: 'Voucher 100K', type: 'voucher', code: 'NEWUSER100', discountType: 'fixed', discountValue: 100000, minOrderValue: 500000, maxDiscount: 100000, startDate: '2024-01-01', endDate: '2025-12-31', status: 'active', usageLimit: 1000, usedCount: 456, targetProducts: [], targetCategories: [], storeId: currentStore.id, createdAt: '2024-01-01' },
  { id: 'prm-004', name: 'Mua 2 Tặng 1 Phụ Kiện', type: 'combo', code: 'BUY2GET1', discountType: 'percent', discountValue: 33, minOrderValue: 0, maxDiscount: 0, startDate: '2024-10-01', endDate: '2025-03-31', status: 'active', usageLimit: 300, usedCount: 112, targetProducts: [], targetCategories: ['Phụ kiện'], storeId: currentStore.id, createdAt: '2024-09-15' },
  { id: 'prm-005', name: 'Black Friday Sale', type: 'flash_sale', code: 'BLACKFRI', discountType: 'percent', discountValue: 40, minOrderValue: 1000000, maxDiscount: 1000000, startDate: '2024-11-24', endDate: '2024-11-30', status: 'ended', usageLimit: 1000, usedCount: 987, targetProducts: [], targetCategories: [], storeId: currentStore.id, createdAt: '2024-11-01' },
  { id: 'prm-006', name: 'Giảm 200K Đơn 2 Triệu', type: 'voucher', code: 'SAVE200K', discountType: 'fixed', discountValue: 200000, minOrderValue: 2000000, maxDiscount: 200000, startDate: '2024-08-01', endDate: '2025-06-30', status: 'paused', usageLimit: 500, usedCount: 156, targetProducts: [], targetCategories: [], storeId: currentStore.id, createdAt: '2024-07-15' },
  { id: 'prm-007', name: 'Apple Day - Giảm 10% Apple', type: 'discount_campaign', code: 'APPLE10', discountType: 'percent', discountValue: 10, minOrderValue: 5000000, maxDiscount: 3000000, startDate: '2024-09-01', endDate: '2025-08-31', status: 'active', usageLimit: 500, usedCount: 201, targetProducts: [], targetCategories: [], storeId: currentStore.id, createdAt: '2024-08-20' },
  { id: 'prm-008', name: 'Free Ship Đơn 500K', type: 'voucher', code: 'FREESHIP', discountType: 'fixed', discountValue: 40000, minOrderValue: 500000, maxDiscount: 40000, startDate: '2024-01-01', endDate: '2025-12-31', status: 'active', usageLimit: 0, usedCount: 3450, targetProducts: [], targetCategories: [], storeId: currentStore.id, createdAt: '2024-01-01' },
  { id: 'prm-009', name: 'Mùa Hè Sôi Động', type: 'flash_sale', code: 'SUMMER30', discountType: 'percent', discountValue: 30, minOrderValue: 1000000, maxDiscount: 800000, startDate: '2024-05-01', endDate: '2024-08-31', status: 'ended', usageLimit: 800, usedCount: 645, targetProducts: [], targetCategories: ['Tai nghe', 'Phụ kiện'], storeId: currentStore.id, createdAt: '2024-04-15' },
  { id: 'prm-010', name: 'Giảm Giá Sản Phẩm Mới', type: 'discount_campaign', code: 'NEWPROD20', discountType: 'percent', discountValue: 20, minOrderValue: 0, maxDiscount: 1500000, startDate: '2024-11-01', endDate: '2025-06-30', status: 'draft', usageLimit: 100, usedCount: 0, targetProducts: [], targetCategories: [], storeId: currentStore.id, createdAt: '2024-10-25' },
  ...Array.from({ length: 90 }, (_, i) => {
    const n = i + 11;
    const types: SellerPromotion['type'][] = ['voucher', 'flash_sale', 'combo', 'discount_campaign'];
    const type = types[Math.floor(Math.random() * types.length)];
    const discountTypes: SellerPromotion['discountType'][] = ['percent', 'fixed'];
    const discountType = discountTypes[Math.floor(Math.random() * discountTypes.length)];
    const statusList: SellerPromotion['status'][] = ['active', 'paused', 'ended', 'draft'];
    const month = Math.floor(1 + Math.random() * 12);
    const year = 2024;
    return {
      id: generateId('prm', n),
      name: `Chương trình khuyến mãi ${n}`,
      type,
      code: `CODE${n}`,
      discountType,
      discountValue: discountType === 'percent' ? Math.floor(5 + Math.random() * 45) : Math.floor(10000 + Math.random() * 490000),
      minOrderValue: Math.floor(Math.random() * 5000000),
      maxDiscount: discountType === 'percent' ? Math.floor(Math.random() * 2000000) : 0,
      startDate: `${year}-${String(month).padStart(2, '0')}-01`,
      endDate: `${year}-${String(Math.min(month + Math.floor(Math.random() * 6), 12)).padStart(2, '0')}-28`,
      status: statusList[Math.floor(Math.random() * statusList.length)],
      usageLimit: Math.floor(Math.random() * 1000),
      usedCount: Math.floor(Math.random() * 500),
      targetProducts: [],
      targetCategories: [CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)]],
      storeId: currentStore.id,
      createdAt: `${year}-${String(month).padStart(2, '0')}-15`,
    };
  }),
];

// ─── 200 Support Tickets ─────────────────────────────────────────────────────────
export const mockSellerTickets: SellerSupportTicket[] = Array.from({ length: 200 }, (_, i) => {
  const n = i + 1;
  const categories: SellerSupportTicket['category'][] = ['order', 'payment', 'product', 'account', 'technical', 'other'];
  const priorities: SellerSupportTicket['priority'][] = ['low', 'medium', 'high', 'urgent'];
  const statuses: SellerSupportTicket['status'][] = ['new', 'in_progress', 'replied', 'resolved', 'closed'];
  const category = categories[Math.floor(Math.random() * categories.length)];
  const createdAt = new Date(2024, Math.floor(Math.random() * 12), Math.floor(1 + Math.random() * 28)).toISOString();
  return {
    id: generateId('tkt', n),
    ticketCode: `TKT${String(n).padStart(5, '0')}`,
    subject: [
      'Yêu cầu hoàn tiền đơn hàng', 'Sản phẩm bị lỗi cần đổi', 'Chưa nhận được hàng',
      'Thông tin tài khoản bị khóa', 'Lỗi thanh toán online', 'Cần xác minh giấy tờ',
      'Hỏi về chính sách đổi trả', 'Báo cáo sản phẩm giả', 'Yêu cầu nâng hạn mức',
    ][Math.floor(Math.random() * 9)] + ` #${n}`,
    category,
    priority: priorities[Math.floor(Math.random() * priorities.length)],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    customerName: CUSTOMER_NAMES[Math.floor(Math.random() * CUSTOMER_NAMES.length)],
    customerEmail: `customer${n}@email.com`,
    messages: Array.from({ length: Math.floor(1 + Math.random() * 4) }, (_, j) => ({
      id: `msg-${n}-${j}`,
      sender: j === 0 ? 'customer' : ['seller', 'customer', 'admin'][Math.floor(Math.random() * 3)] as 'customer' | 'seller' | 'admin',
      senderName: j === 0 ? CUSTOMER_NAMES[Math.floor(Math.random() * CUSTOMER_NAMES.length)] : j === 1 ? 'Henzo Tech Store' : 'Henzo Admin',
      content: j === 0
        ? 'Tôi cần hỗ trợ về vấn đề này. Mong shop phản hồi sớm nhất có thể.'
        : j === 1
        ? 'Cảm ơn bạn đã liên hệ. Chúng tôi đang xử lý và sẽ phản hồi trong 24h.'
        : 'Vấn đề của bạn đã được giải quyết. Cần hỗ trợ thêm gì không?',
      attachments: [],
      createdAt: new Date(new Date(createdAt).getTime() + j * 3600000 * 6).toISOString(),
    })),
    createdAt,
    updatedAt: new Date(new Date(createdAt).getTime() + Math.floor(Math.random() * 86400000 * 7)).toISOString(),
    storeId: currentStore.id,
  };
});

// ─── Inventory ──────────────────────────────────────────────────────────────────
export const mockSellerInventory: SellerInventoryItem[] = mockSellerProducts.slice(0, 100).map((p) => {
  const stock = Math.floor(Math.random() * 500);
  const sold = Math.floor(Math.random() * 200);
  const reserved = Math.floor(Math.random() * 10);
  const minStock = 10;
  return {
    sku: `SKU-${p.id.slice(-6)}`,
    productId: p.id,
    productName: p.name,
    productImage: p.images[0],
    category: p.categoryName,
    stock,
    minStock,
    sold,
    reserved,
    available: stock - reserved,
    status: stock === 0 ? 'out_of_stock' : stock < minStock ? 'low_stock' : 'in_stock',
    lastRestocked: new Date(2024, Math.floor(Math.random() * 12), Math.floor(1 + Math.random() * 28)).toLocaleDateString('vi-VN'),
    storeId: currentStore.id,
  };
});

// ─── Shipping ───────────────────────────────────────────────────────────────────
export const mockSellerShippings: SellerShipping[] = mockSellerOrders
  .filter(o => ['shipped', 'delivering', 'delivered'].includes(o.status))
  .map((order, i) => {
    const statusMap: Record<string, SellerShipping['status']> = {
      shipped: 'picked_up', delivering: 'in_transit', delivered: 'delivered',
    };
    return {
      id: `ship-${i + 1}`,
      orderId: order.id,
      orderCode: order.orderCode,
      trackingNumber: order.trackingNumber,
      carrier: order.shippingPartner,
      status: statusMap[order.status] || 'in_transit',
      senderName: currentStore.name,
      senderPhone: currentStore.phone,
      senderAddress: currentStore.address,
      receiverName: order.customerName,
      receiverPhone: order.customerPhone,
      receiverAddress: order.shippingAddress,
      weight: Math.floor(500 + Math.random() * 5000),
      dimensions: `${Math.floor(10 + Math.random() * 40)}x${Math.floor(10 + Math.random() * 40)}x${Math.floor(5 + Math.random() * 20)}cm`,
      estimatedDelivery: order.estimatedDelivery,
      actualDelivery: order.status === 'delivered' ? order.updatedAt : '',
      shippingFee: order.shippingFee,
      codAmount: order.paymentMethod === 'cod' ? order.finalAmount : 0,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      storeId: currentStore.id,
    };
  });

// ─── Notifications ─────────────────────────────────────────────────────────────
export const mockSellerNotifications: SellerNotification[] = [
  { id: 'notif-001', type: 'order', title: 'Đơn hàng mới', message: 'Bạn có đơn hàng mới ORD000001 trị giá 45,990,000đ. Vui lòng xác nhận trong 24h.', isRead: false, link: '/seller/orders', createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), storeId: currentStore.id },
  { id: 'notif-002', type: 'payment', title: 'Thanh toán thành công', message: 'Đơn hàng ORD000012 đã được thanh toán thành công qua VNPay. Số tiền: 12,500,000đ', isRead: false, link: '/seller/payments', createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), storeId: currentStore.id },
  { id: 'notif-003', type: 'review', title: 'Đánh giá mới 5 sao', message: 'Khách hàng Nguyễn Văn Minh vừa đánh giá 5 sao cho sản phẩm iPhone 16 Pro Max.', isRead: false, link: '/seller/reviews', createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(), storeId: currentStore.id },
  { id: 'notif-004', type: 'product', title: 'Cảnh báo hết hàng', message: 'Sản phẩm MacBook Pro M3 14" sắp hết hàng (chỉ còn 3 cái). Hãy nhập kho sớm!', isRead: true, link: '/seller/inventory', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), storeId: currentStore.id },
  { id: 'notif-005', type: 'system', title: 'Bảo trì hệ thống', message: 'Hệ thống sẽ bảo trì vào 02:00-04:00 ngày mai. Vui lòng lưu công việc trước đó.', isRead: true, link: '/seller', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), storeId: currentStore.id },
  { id: 'notif-006', type: 'promotion', title: 'Flash Sale sắp kết thúc', message: 'Chương trình "Flash Sale Cuối Năm" sẽ kết thúc sau 3 ngày nữa. Kiểm tra ngay!', isRead: true, link: '/seller/promotions', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), storeId: currentStore.id },
  { id: 'notif-007', type: 'order', title: 'Yêu cầu hủy đơn', message: 'Khách hàng Trần Thị B yêu cầu hủy đơn hàng ORD000087. Vui lòng xác nhận.', isRead: false, link: '/seller/orders', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), storeId: currentStore.id },
  { id: 'notif-008', type: 'payment', title: 'Hoàn tiền thành công', message: 'Đơn hàng ORD000034 đã được hoàn tiền thành công. Số tiền hoàn: 8,900,000đ', isRead: true, link: '/seller/payments', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), storeId: currentStore.id },
];

// ─── Chart Data ─────────────────────────────────────────────────────────────────
export const mockDailyRevenue: DailyRevenue[] = Array.from({ length: 30 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (29 - i));
  return {
    date: date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
    revenue: Math.floor(5000000 + Math.random() * 30000000),
    orders: Math.floor(5 + Math.random() * 50),
  };
});

export const mockMonthlyData: MonthlyData[] = [
  { month: 'T1', revenue: 450_000_000, orders: 234, customers: 189 },
  { month: 'T2', revenue: 520_000_000, orders: 267, customers: 215 },
  { month: 'T3', revenue: 480_000_000, orders: 245, customers: 198 },
  { month: 'T4', revenue: 610_000_000, orders: 312, customers: 254 },
  { month: 'T5', revenue: 580_000_000, orders: 298, customers: 241 },
  { month: 'T6', revenue: 720_000_000, orders: 367, customers: 298 },
  { month: 'T7', revenue: 680_000_000, orders: 348, customers: 282 },
  { month: 'T8', revenue: 750_000_000, orders: 384, customers: 312 },
  { month: 'T9', revenue: 820_000_000, orders: 419, customers: 341 },
  { month: 'T10', revenue: 890_000_000, orders: 455, customers: 369 },
  { month: 'T11', revenue: 950_000_000, orders: 486, customers: 395 },
  { month: 'T12', revenue: 1_050_000_000, orders: 537, customers: 436 },
];

// ─── Helpers ────────────────────────────────────────────────────────────────────
export const STATUS_ORDER_LABELS = STATUS_LABELS;
export const ORDER_STATUS_COLORS_MAP = ORDER_STATUS_COLORS;
export const PAYMENT_METHOD_LABELS_MAP = PAYMENT_METHOD_LABELS;
