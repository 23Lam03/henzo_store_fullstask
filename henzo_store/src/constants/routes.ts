// ─── Khai báo route ───────────────────────────────────────────────────────────
export const ROUTES = {
  // Công khai
  HOME: '/',
  PRODUCTS: '/products',
  PRODUCT_DETAIL: '/products/:slug',
  CATEGORIES: '/categories',
  CATEGORY_DETAIL: '/categories/:slug',
  BRANDS: '/brands',
  BRAND_DETAIL: '/brands/:slug',
  SEARCH: '/search',
  PROMOTIONS: '/promotions',
  BLOGS: '/blogs',
  BLOG_DETAIL: '/blogs/:slug',
  SHOPS: '/shops',
  SHOP_DETAIL: '/shops/:slug',
  CONTACT: '/contact',
  ABOUT: '/about',
  FAQ: '/faq',

  // Xác thực
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',

  // Khách hàng (được bảo vệ - CUSTOMER)
  ACCOUNT: '/account',
  ACCOUNT_DASHBOARD: '/account/dashboard',
  ACCOUNT_SETTINGS: '/account/settings',
  ORDERS: '/account/orders',
  ORDER_DETAIL: '/account/orders/:id',
  CART: '/cart',
  CHECKOUT: '/checkout',
  WISHLIST: '/wishlist',
  COMPARE: '/compare',
  RECENTLY_VIEWED: '/recently-viewed',
  ADDRESSES: '/addresses',
  PAYMENTS: '/payments',
  NOTIFICATIONS: '/notifications',
  SUPPORT: '/account/support',
  ORDER_TRACKING: '/account/orders/:id/tracking',

  // Shop (được bảo vệ - SHOP, ADMIN)
  SHOP_DASHBOARD: '/seller',
  SHOP_PRODUCTS: '/seller/products',
  SHOP_PRODUCT_CREATE: '/seller/products/create',
  SHOP_PRODUCT_EDIT: '/seller/products/edit/:id',
  SHOP_ORDERS: '/seller/orders',
  SHOP_INVENTORY: '/seller/inventory',
  SHOP_PROMOTIONS: '/seller/promotions',
  SHOP_REVIEWS: '/seller/reviews',
  SHOP_REPORTS: '/seller/reports',
  SHOP_FINANCE: '/seller/finance',
  SHOP_PAYMENTS: '/seller/payments',
  SHOP_SUPPORT: '/seller/support',
  SHOP_PROFILE: '/seller/profile',
  SHOP_SHIPPING: '/seller/shipping',
  SHOP_NOTIFICATIONS: '/seller/notifications',

  // Quản trị viên (được bảo vệ - ADMIN, toàn quyền quản lý)
  ADMIN_DASHBOARD: '/admin',
  ADMIN_PRODUCTS: '/admin/products',
  ADMIN_PRODUCT_EDIT: '/admin/products/edit/:id',
  ADMIN_ORDERS: '/admin/orders',
  ADMIN_CUSTOMERS: '/admin/customers',
  ADMIN_STORES: '/admin/stores',
  ADMIN_PAYMENTS: '/admin/payments',
  ADMIN_REVIEWS: '/admin/reviews',
  ADMIN_PROMOTIONS: '/admin/promotions',
  ADMIN_SUPPORT: '/admin/support',
  ADMIN_REPORTS: '/admin/reports',
  ADMIN_NOTIFICATIONS: '/admin/notifications',
  ADMIN_ACCESS: '/admin/access',
  ADMIN_FINANCE: '/admin/finance',

  // Trang lỗi
  NOT_FOUND: '/404',
  FORBIDDEN: '/403',
  SERVER_ERROR: '/500',
} as const;

// ─── Ánh xạ tiêu đề trang ─────────────────────────────────────────────────────
export const PAGE_TITLES: Record<string, string> = {
  // Công khai
  [ROUTES.HOME]: 'Trang Chủ',
  [ROUTES.PRODUCTS]: 'Sản Phẩm',
  [ROUTES.PRODUCT_DETAIL]: 'Chi Tiết Sản Phẩm',
  [ROUTES.CATEGORIES]: 'Danh Mục',
  [ROUTES.CATEGORY_DETAIL]: 'Danh Mục',
  [ROUTES.BRANDS]: 'Thương Hiệu',
  [ROUTES.BRAND_DETAIL]: 'Thương Hiệu',
  [ROUTES.SEARCH]: 'Tìm Kiếm',
  [ROUTES.PROMOTIONS]: 'Khuyến Mãi',
  [ROUTES.BLOGS]: 'Blog Công Nghệ',
  [ROUTES.BLOG_DETAIL]: 'Bài Viết',
  [ROUTES.SHOPS]: 'Cửa Hàng',
  [ROUTES.SHOP_DETAIL]: 'Cửa Hàng',
  [ROUTES.CONTACT]: 'Liên Hệ',
  [ROUTES.ABOUT]: 'Giới Thiệu',
  [ROUTES.FAQ]: 'Câu Hỏi Thường Gặp',

  // Xác thực
  [ROUTES.LOGIN]: 'Đăng Nhập',
  [ROUTES.REGISTER]: 'Đăng Ký',
  [ROUTES.FORGOT_PASSWORD]: 'Quên Mật Khẩu',

  // Khách hàng
  [ROUTES.ACCOUNT]: 'Tài Khoản',
  [ROUTES.ACCOUNT_DASHBOARD]: 'Tài Khoản',
  [ROUTES.ACCOUNT_SETTINGS]: 'Cài Đặt',
  [ROUTES.ORDERS]: 'Đơn Hàng',
  [ROUTES.ORDER_DETAIL]: 'Chi Tiết Đơn Hàng',
  [ROUTES.CART]: 'Giỏ Hàng',
  [ROUTES.CHECKOUT]: 'Thanh Toán',
  [ROUTES.WISHLIST]: 'Yêu Thích',
  [ROUTES.COMPARE]: 'So Sánh',
  [ROUTES.RECENTLY_VIEWED]: 'Đã Xem Gần Đây',
  [ROUTES.ADDRESSES]: 'Địa Chỉ',
  [ROUTES.PAYMENTS]: 'Thanh Toán',
  [ROUTES.NOTIFICATIONS]: 'Thông Báo',
  [ROUTES.SUPPORT]: 'Hỗ Trợ',
  [ROUTES.ORDER_TRACKING]: 'Theo Dõi Đơn Hàng',

  // Shop
  [ROUTES.SHOP_DASHBOARD]: 'Dashboard Shop',
  [ROUTES.SHOP_PRODUCTS]: 'Quản Lý Sản Phẩm',
  [ROUTES.SHOP_PRODUCT_CREATE]: 'Thêm Sản Phẩm',
  [ROUTES.SHOP_PRODUCT_EDIT]: 'Sửa Sản Phẩm',
  [ROUTES.SHOP_ORDERS]: 'Quản Lý Đơn Hàng',
  [ROUTES.SHOP_INVENTORY]: 'Quản Lý Kho',
  [ROUTES.SHOP_PROMOTIONS]: 'Khuyến Mãi Shop',
  [ROUTES.SHOP_REVIEWS]: 'Quản Lý Đánh Giá',
  [ROUTES.SHOP_REPORTS]: 'Báo Cáo',
  [ROUTES.SHOP_FINANCE]: 'Tài Chính',
  [ROUTES.SHOP_PAYMENTS]: 'Thanh Toán Shop',
  [ROUTES.SHOP_SUPPORT]: 'Hỗ Trợ Shop',
  [ROUTES.SHOP_PROFILE]: 'Cài Đặt Cửa Hàng',
  [ROUTES.SHOP_SHIPPING]: 'Vận Chuyển',
  [ROUTES.SHOP_NOTIFICATIONS]: 'Thông Báo',

  // Quản trị viên
  [ROUTES.ADMIN_DASHBOARD]: 'Dashboard Admin',
  [ROUTES.ADMIN_PRODUCTS]: 'Quản Lý Sản Phẩm',
  [ROUTES.ADMIN_PRODUCT_EDIT]: 'Chỉnh Sửa Sản Phẩm',
  [ROUTES.ADMIN_ORDERS]: 'Quản Lý Đơn Hàng',
  [ROUTES.ADMIN_CUSTOMERS]: 'Quản Lý Khách Hàng',
  [ROUTES.ADMIN_STORES]: 'Quản Lý Shop',
  [ROUTES.ADMIN_PAYMENTS]: 'Quản Lý Thanh Toán',
  [ROUTES.ADMIN_REVIEWS]: 'Quản Lý Đánh Giá',
  [ROUTES.ADMIN_PROMOTIONS]: 'Quản Lý Khuyến Mãi',
  [ROUTES.ADMIN_SUPPORT]: 'Quản Lý Hỗ Trợ',
  [ROUTES.ADMIN_REPORTS]: 'Báo Cáo Hệ Thống',
  [ROUTES.ADMIN_NOTIFICATIONS]: 'Quản Lý Thông Báo',
  [ROUTES.ADMIN_ACCESS]: 'Phân Quyền',
  [ROUTES.ADMIN_FINANCE]: 'Tài Chính Hệ Thống',

  // Trang lỗi
  [ROUTES.NOT_FOUND]: '404 - Không Tìm Thấy',
  [ROUTES.FORBIDDEN]: '403 - Không Có Quyền Truy Cập',
  [ROUTES.SERVER_ERROR]: '500 - Lỗi Hệ Thống',
};

export const APP_NAME = 'HenzoStore';
export const APP_TAGLINE = 'Công Nghệ Hàng Đầu';
