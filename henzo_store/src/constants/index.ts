
export const COLORS = {
  primary: '#1F5557',
  primaryHover: '#4338CA',
  primaryLight: '#2E6E70',
  accent: '#2A6A85',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  dark: '#111827',
  darkSurface: '#1F2937',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  border: '#E5E7EB',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
} as const;

export const BREAKPOINTS = {
  mobile: '480px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1280px',
  ultra: '1536px',
} as const;

export const LAYOUT = {
  headerHeight: '72px',
  headerMobileHeight: '64px',
  sidebarWidth: '280px',
  sidebarCollapsedWidth: '72px',
  maxContentWidth: '1280px',
  footerHeight: '420px',
} as const;

export const ANIMATION = {
  fast: '150ms',
  normal: '250ms',
  slow: '400ms',
  megaMenu: '300ms',
} as const;

export const PLATFORM_FEE_RATE = 0.023;
export const PLATFORM_FEE_LABEL = `${(PLATFORM_FEE_RATE * 100).toFixed(1)}%`;

export const STORAGE_KEYS = {
  theme: 'henzo_theme',
  auth: 'henzo_auth',
  cart: 'henzo_cart',
  wishlist: 'henzo_wishlist',
  notifications: 'henzo_notifications',
  reviews: 'henzo_reviews',
  searchHistory: 'henzo_search_history',
  sidebarCollapsed: 'henzo_sidebar_collapsed',
  orders: 'henzo_orders',
} as const;

export const PAGINATION = {
  defaultPageSize: 12,
  pageSizeOptions: [12, 24, 48, 96],
} as const;

export const API_DELAY = {
  fast: 200,
  normal: 400,
  slow: 800,
} as const;

export const CATEGORIES = [
  {
    id: 'cat-1',
    name: 'Laptop',
    slug: 'laptop',
    icon: 'laptop',
    featured: true,
    children: [
      { id: 'cat-1-1', name: 'Gaming', slug: 'gaming', icon: 'gamepad' },
      { id: 'cat-1-2', name: 'Văn phòng', slug: 'van-phong', icon: 'briefcase' },
      { id: 'cat-1-3', name: 'MacBook', slug: 'macbook', icon: 'apple' },
      { id: 'cat-1-4', name: 'Mỏng nhẹ', slug: 'mong-nhe', icon: ' feather' },
      { id: 'cat-1-5', name: 'Workstation', slug: 'workstation', icon: 'cpu' },
    ],
  },
  {
    id: 'cat-2',
    name: 'Điện thoại',
    slug: 'dien-thoai',
    icon: 'smartphone',
    featured: true,
    children: [
      { id: 'cat-2-1', name: 'iPhone', slug: 'iphone', icon: 'apple' },
      { id: 'cat-2-2', name: 'Samsung', slug: 'samsung', icon: 'smartphone' },
      { id: 'cat-2-3', name: 'Xiaomi', slug: 'xiaomi', icon: 'smartphone' },
      { id: 'cat-2-4', name: 'OPPO', slug: 'oppo', icon: 'smartphone' },
    ],
  },
  {
    id: 'cat-3',
    name: 'Máy tính bảng',
    slug: 'may-tinh-bang',
    icon: 'tablet',
    featured: true,
    children: [
      { id: 'cat-3-1', name: 'iPad', slug: 'ipad', icon: 'apple' },
      { id: 'cat-3-2', name: 'Samsung Tab', slug: 'samsung-tab', icon: 'tablet' },
      { id: 'cat-3-3', name: 'Xiaomi Pad', slug: 'xiaomi-pad', icon: 'tablet' },
    ],
  },
  {
    id: 'cat-4',
    name: 'Phụ kiện',
    slug: 'phu-kien',
    icon: 'headphones',
    featured: true,
    children: [
      { id: 'cat-4-1', name: 'Tai nghe', slug: 'tai-nghe', icon: 'headphones' },
      { id: 'cat-4-2', name: 'Sạc dự phòng', slug: 'sac-du-phong', icon: 'battery' },
      { id: 'cat-4-3', name: 'Ốp lưng', slug: 'op-lung', icon: 'smartphone' },
      { id: 'cat-4-4', name: 'Cáp sạc', slug: 'cap-sac', icon: 'cable' },
      { id: 'cat-4-5', name: 'Loa Bluetooth', slug: 'loa-bluetooth', icon: 'speaker' },
    ],
  },
  {
    id: 'cat-5',
    name: 'Đồng hồ thông minh',
    slug: 'dong-ho-thong-minh',
    icon: 'watch',
    featured: true,
    children: [
      { id: 'cat-5-1', name: 'Apple Watch', slug: 'apple-watch', icon: 'watch' },
      { id: 'cat-5-2', name: 'Samsung Watch', slug: 'samsung-watch', icon: 'watch' },
      { id: 'cat-5-3', name: 'Garmin', slug: 'garmin', icon: 'activity' },
    ],
  },
  {
    id: 'cat-6',
    name: 'PC & Linh kiện',
    slug: 'pc-linh-kien',
    icon: 'monitor',
    featured: false,
    children: [
      { id: 'cat-6-1', name: 'CPU', slug: 'cpu', icon: 'cpu' },
      { id: 'cat-6-2', name: 'GPU', slug: 'gpu', icon: 'zap' },
      { id: 'cat-6-3', name: 'RAM', slug: 'ram', icon: 'memory' },
      { id: 'cat-6-4', name: 'SSD', slug: 'ssd', icon: 'hard-drive' },
      { id: 'cat-6-5', name: 'Nguồn', slug: 'nguon', icon: 'zap' },
      { id: 'cat-6-6', name: 'Vỏ case', slug: 'vo-case', icon: 'box' },
    ],
  },
  {
    id: 'cat-7',
    name: 'Màn hình',
    slug: 'man-hinh',
    icon: 'monitor',
    featured: false,
    children: [
      { id: 'cat-7-1', name: 'Gaming', slug: 'man-hinh-gaming', icon: 'monitor' },
      { id: 'cat-7-2', name: 'Văn phòng', slug: 'man-hinh-van-phong', icon: 'monitor' },
      { id: 'cat-7-3', name: 'Đồ họa', slug: 'man-hinh-do-hoa', icon: 'pen-tool' },
    ],
  },
  {
    id: 'cat-8',
    name: 'Camera',
    slug: 'camera',
    icon: 'camera',
    featured: false,
    children: [
      { id: 'cat-8-1', name: 'Webcam', slug: 'webcam', icon: 'video' },
      { id: 'cat-8-2', name: 'Camera IP', slug: 'camera-ip', icon: 'video' },
      { id: 'cat-8-3', name: 'Action Cam', slug: 'action-cam', icon: 'video' },
    ],
  },
] as const;

export const POPULAR_KEYWORDS = [
  'iPhone 16 Pro Max',
  'MacBook Pro M4',
  'Samsung Galaxy S25',
  'AirPods Pro 2',
  'Tai nghe Sony WH-1000XM5',
  'iPad Pro M4',
  'RTX 5090',
  'Apple Watch Ultra 3',
];

export const FOOTER_LINKS = {
  about: [
    { label: 'Về chúng tôi', href: '/about' },
    { label: 'Hệ thống cửa hàng', href: '/stores' },
    { label: 'Tuyển dụng', href: '/careers' },
  ],
  policies: [
    { label: 'Chính sách bảo hành', href: '/warranty' },
    { label: 'Chính sách đổi trả', href: '/return' },
    { label: 'Chính sách vận chuyển', href: '/shipping' },
    { label: 'Điều khoản sử dụng', href: '/terms' },
  ],
  support: [
    { label: 'FAQ', href: '/faq' },
    { label: 'Hướng dẫn mua hàng', href: '/guide' },
    { label: 'Liên hệ', href: '/contact' },
  ],
  social: [
    { label: 'Facebook', href: 'https://facebook.com', icon: 'facebook', external: true },
    { label: 'YouTube', href: 'https://youtube.com', icon: 'youtube', external: true },
    { label: 'TikTok', href: 'https://tiktok.com', icon: 'tiktok', external: true },
    { label: 'Instagram', href: 'https://instagram.com', icon: 'instagram', external: true },
    { label: 'Zalo', href: 'https://zalo.me', icon: 'zalo', external: true },
  ],
};

export const COMPANY_INFO = {
  name: 'Công ty TNHH Henzo Store',
  hotline: '1900 1234',
  email: 'contact@henzo.vn',
  address: '123 Đường ABC, Phường XYZ, Quận 1, TP. Hồ Chí Minh',
  taxId: '0123456789',
};

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  processing: 'Đang xử lý',
  shipping: 'Đang vận chuyển',
  delivered: 'Đã giao hàng',
  cancelled: 'Đã hủy',
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B',
  confirmed: '#3B82F6',
  processing: '#8B5CF6',
  shipping: '#2A6A85',
  delivered: '#10B981',
  cancelled: '#EF4444',
};
