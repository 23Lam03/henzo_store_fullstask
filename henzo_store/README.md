# HenzoStore - Công Nghệ Hàng Đầu

### Ngành hàng kinh doanh

- Điện thoại (iPhone, Samsung, Xiaomi, OPPO, Vivo, Google, OnePlus...)
- Laptop (MacBook, ASUS ROG, MSI, Dell, HP, Lenovo, Acer...)
- PC Gaming & Linh kiện (RTX 5090, CPU, RAM, SSD, Case, Nguồn...)
- Phụ kiện công nghệ (Chuột, Bàn phím, Tai nghe, Màn hình, Camera, Loa...)
- Đồng hồ thông minh, Máy tính bảng, Thiết bị mạng


---

## Cấu Trúc Thư Mục

```
src/
├── App.tsx                    # Component gốc (root)
├── main.tsx                  # Điểm khởi chạy ứng dụng
├── index.css                 # File CSS gốc (chuyển hướng sang global)
│
├── components/
│   ├── breadcrumb/           # Thanh điều hướng breadcrumb
│   ├── common/               # Các component dùng chung
│   │   ├── BackToTop/        # Nút quay về đầu trang
│   │   ├── Loading/          # Biểu tượng loading
│   │   ├── ProductCard/      # Component thẻ sản phẩm
│   │   └── RouteLoader/      # Loader khi chuyển route
│   ├── footer/Footer/        # Footer (chân trang)
│   ├── header/               # Hệ thống header
│   │   ├── Header/           # Header chính
│   │   ├── MegaMenu/         # Menu danh mục dạng mega
│   │   ├── MiniCart/         # Giỏ hàng thu nhỏ dạng dropdown
│   │   ├── NotificationCenter/ # Trung tâm thông báo
│   │   ├── SearchBar/        # Thanh tìm kiếm toàn cục
│   │   └── UserMenu/         # Menu tài khoản người dùng
│   ├── layouts/              # Các layout bao bọc trang
│   │   ├── AdminLayout/       # Layout trang quản trị
│   │   ├── AuthLayout/       # Layout đăng nhập / đăng ký
│   │   ├── CustomerLayout/    # Layout trang tài khoản khách hàng
│   │   ├── MainLayout/        # Layout trang công khai
│   │   └── ShopLayout/        # Layout portal người bán
│   ├── product/              # Các component liên quan sản phẩm
│   │   ├── Pagination/       # Phân trang
│   │   ├── ProductCompare/    # So sánh sản phẩm
│   │   ├── ProductFilter/     # Bộ lọc sản phẩm
│   │   ├── ProductGallery/    # Thư viện hình ảnh sản phẩm
│   │   ├── ProductGrid/      # Lưới hiển thị sản phẩm
│   │   ├── ProductReview/     # Hiển thị đánh giá sản phẩm
│   │   ├── ProductSort/       # Tuỳ chọn sắp xếp
│   │   └── ProductSpecification/ # Bảng thông số kỹ thuật
│   └── sidebar/              # Thanh điều hướng sidebar
│
├── constants/
│   ├── index.ts             # Màu sắc, breakpoint, danh mục, v.v.
│   └── routes.ts            # Hằng số route + tiêu đề trang
│
├── contexts/                # React Context providers
│   ├── AuthContext/          # Trạng thái xác thực
│   ├── CartContext/          # Trạng thái giỏ hàng
│   ├── CompareContext/       # Trạng thái so sánh sản phẩm
│   ├── NotificationContext/   # Trạng thái thông báo
│   ├── RecentlyViewedContext/ # Sản phẩm đã xem gần đây
│   ├── SearchContext/        # Trạng thái tìm kiếm + lịch sử
│   ├── ThemeContext/         # Chế độ sáng / tối
│   └── WishlistContext/      # Danh sách yêu thích
│
├── data/
│   └── products.ts           # Dữ liệu sản phẩm mock (100+ sản phẩm)
│
├── guards/
│   ├── PermissionRoute.tsx   # Guard phân quyền theo vai trò
│   └── ProtectedRoute.tsx    # Guard bảo vệ route theo đăng nhập
│
├── hooks/                   # Custom React hooks
│
├── pages/
│   ├── admin/               # Trang quản trị hệ thống
│   │   ├── AdminAccess/      # Quản lý phân quyền người dùng
│   │   ├── AdminCustomer/    # Quản lý khách hàng
│   │   ├── AdminDashboard/   # Bảng điều khiển tổng quan
│   │   ├── AdminFinance/     # Quản lý tài chính hệ thống
│   │   ├── AdminNotification/ # Quản lý thông báo
│   │   ├── AdminOrder/       # Quản lý đơn hàng
│   │   ├── AdminPayment/     # Quản lý thanh toán
│   │   ├── AdminProduct/     # Quản lý sản phẩm
│   │   ├── AdminPromotion/   # Quản lý khuyến mãi
│   │   ├── AdminReports/     # Báo cáo hệ thống
│   │   ├── AdminReview/      # Quản lý đánh giá
│   │   ├── AdminStore/       # Quản lý cửa hàng
│   │   └── AdminSupport/     # Quản lý hỗ trợ
│   │
│   ├── auth/                # Trang xác thực
│   │   ├── ForgotPasswordPage/ # Quên mật khẩu
│   │   ├── LoginPage/        # Trang đăng nhập
│   │   └── RegisterPage/     # Trang đăng ký
│   │
│   ├── customer/            # Trang người dùng (khách hàng)
│   │   ├── Account/          # Tài khoản cá nhân
│   │   ├── Brand/           # Trang chi tiết thương hiệu
│   │   ├── Cart/            # Giỏ hàng
│   │   ├── Category/        # Trang danh mục
│   │   ├── Checkout/        # Thanh toán
│   │   ├── Compare/         # So sánh sản phẩm
│   │   ├── Home/            # Trang chủ
│   │   ├── Notifications/    # Trung tâm thông báo
│   │   ├── Orders/          # Lịch sử và chi tiết đơn hàng
│   │   ├── ProductDetail/   # Chi tiết sản phẩm
│   │   ├── ProductList/      # Danh sách sản phẩm
│   │   ├── Promotion/        # Khuyến mãi & voucher
│   │   ├── RecentlyViewed/   # Sản phẩm đã xem gần đây
│   │   ├── Search/          # Trang tìm kiếm
│   │   ├── Shipping/         # Theo dõi vận chuyển
│   │   └── Wishlist/        # Danh sách yêu thích
│   │
│   ├── errors/              # Trang lỗi
│   │   └── ErrorPages.tsx    # 404, 403, 500
│   │
│   └── shop/                # Cổng người bán (seller portal)
│       ├── CreateProduct/     # Tạo sản phẩm mới
│       ├── ShopDashboard/     # Bảng điều khiển người bán
│       ├── ShopFinance/      # Tài chính cửa hàng
│       ├── ShopInventory/    # Quản lý kho
│       ├── ShopOrderList/    # Quản lý đơn hàng
│       ├── ShopPayment/      # Thanh toán người bán
│       ├── ShopProductList/  # Danh sách sản phẩm
│       ├── ShopProfile/      # Cài đặt cửa hàng
│       ├── ShopPromotions/   # Quản lý khuyến mãi
│       ├── ShopReports/      # Báo cáo
│       ├── ShopReviews/      # Quản lý đánh giá
│       ├── ShopShipping/     # Quản lý vận chuyển
│       └── ShopSupport/      # Hỗ trợ khách hàng
│
├── router/
│   └── index.tsx             # Cấu hình React Router
│
├── services/
│   ├── authService.ts       # Dịch vụ xác thực
│   └── mock/
│       └── api.ts           # API giả lập (mock)
│
├── styles/
│   └── global.css           # CSS hệ thống (design tokens / variables)
│
├── types/
│   ├── auth.ts             # Kiểu dữ liệu auth (UserRole, User, ...)
│   └── index.ts            # Các kiểu dữ liệu dùng chung
│
└── utils/
    └── index.ts            # Hàm tiện ích (format tiền, debounce, ...)
---

## Routing System

### Route Constants (`src/constants/routes.ts`)

```typescript
export const ROUTES = {
  // Public
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

  // Auth
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',

  // Customer (protected)
  ACCOUNT: '/account',
  ACCOUNT_DASHBOARD: '/account/dashboard',
  ORDERS: '/orders',
  ORDER_DETAIL: '/orders/:id',
  CART: '/cart',
  CHECKOUT: '/checkout',
  WISHLIST: '/wishlist',
  COMPARE: '/compare',
  RECENTLY_VIEWED: '/recently-viewed',
  ADDRESSES: '/addresses',
  PAYMENTS: '/payments',
  NOTIFICATIONS: '/notifications',
  SUPPORT: '/support',

  // Shop (protected - SHOP, ADMIN)
  SHOP_DASHBOARD: '/shop/dashboard',
  SHOP_PRODUCTS: '/shop/products',
  SHOP_PRODUCT_CREATE: '/shop/products/create',
  SHOP_PRODUCT_EDIT: '/shop/products/edit/:id',
  SHOP_ORDERS: '/shop/orders',
  SHOP_INVENTORY: '/shop/inventory',
  SHOP_PROMOTIONS: '/shop/promotions',
  SHOP_REVIEWS: '/shop/reviews',
  SHOP_REPORTS: '/shop/reports',
  SHOP_FINANCE: '/shop/finance',
  SHOP_PAYMENTS: '/shop/payments',
  SHOP_SUPPORT: '/shop/support',
  SHOP_PROFILE: '/shop/profile',

  // Admin (protected - ADMIN)
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_PRODUCTS: '/admin/products',
  ADMIN_ORDERS: '/admin/orders',
  ADMIN_CUSTOMERS: '/admin/customers',
  ADMIN_SHOPS: '/admin/shops',
  ADMIN_PAYMENTS: '/admin/payments',
  ADMIN_REVIEWS: '/admin/reviews',
  ADMIN_PROMOTIONS: '/admin/promotions',
  ADMIN_SUPPORT: '/admin/support',
  ADMIN_REPORTS: '/admin/reports',
  ADMIN_ROLES: '/admin/roles',

  // Errors
  NOT_FOUND: '/404',
  FORBIDDEN: '/403',
  SERVER_ERROR: '/500',
} as const;
```

### Route Structure

| Layout | Route | Role | Pages |
|--------|-------|------|-------|
| `AuthLayout` | `/login` | Public | Đăng nhập |
| `AuthLayout` | `/register` | Public | Đăng ký |
| `AuthLayout` | `/forgot-password` | Public | Quên mật khẩu |
| `MainLayout` | `/` | Public | Trang chủ |
| `MainLayout` | `/products` | Public | Danh sách sản phẩm |
| `MainLayout` | `/products/:slug` | Public | Chi tiết sản phẩm |
| `MainLayout` | `/categories/:slug` | Public | Danh mục |
| `MainLayout` | `/brands/:slug` | Public | Thương hiệu |
| `MainLayout` | `/search` | Public | Tìm kiếm |
| `MainLayout` | `/compare` | Public | So sánh |
| `MainLayout` | `/cart` | Public | Giỏ hàng |
| `MainLayout` | `/wishlist` | Public | Yêu thích |
| `MainLayout` | `/recently-viewed` | Public | Đã xem |
| `MainLayout` | `/promotions` | Public | Khuyến mãi |
| `MainLayout` | `/orders/:id` | Public | Chi tiết đơn |
| `CustomerLayout` | `/account` | CUSTOMER | Tài khoản |
| `CustomerLayout` | `/orders` | CUSTOMER | Lịch sử đơn hàng |
| `CustomerLayout` | `/notifications` | CUSTOMER | Thông báo |
| `CustomerLayout` | `/support` | CUSTOMER | Hỗ trợ |
| `ShopLayout` | `/shop` | SHOP, ADMIN | Dashboard |
| `ShopLayout` | `/shop/products` | SHOP, ADMIN | Quản lý sản phẩm |
| `ShopLayout` | `/shop/orders` | SHOP, ADMIN | Quản lý đơn hàng |
| `ShopLayout` | `/shop/inventory` | SHOP, ADMIN | Kho hàng |
| `ShopLayout` | `/shop/promotions` | SHOP, ADMIN | Khuyến mãi |
| `ShopLayout` | `/shop/reviews` | SHOP, ADMIN | Đánh giá |
| `ShopLayout` | `/shop/reports` | SHOP, ADMIN | Báo cáo |
| `ShopLayout` | `/shop/finance` | SHOP, ADMIN | Tài chính |
| `ShopLayout` | `/shop/payments` | SHOP, ADMIN | Thanh toán |
| `ShopLayout` | `/shop/support` | SHOP, ADMIN | Hỗ trợ |
| `ShopLayout` | `/shop/shipping` | SHOP, ADMIN | Vận chuyển |
| `ShopLayout` | `/shop/profile` | SHOP, ADMIN | Cài đặt shop |
| `AdminLayout` | `/admin` | ADMIN | Dashboard |
| `AdminLayout` | `/admin/products` | ADMIN | Quản lý SP |
| `AdminLayout` | `/admin/orders` | ADMIN | Quản lý đơn |
| `AdminLayout` | `/admin/customers` | ADMIN | Quản lý KH |
| `AdminLayout` | `/admin/stores` | ADMIN | Quản lý shop |
| `AdminLayout` | `/admin/payments` | ADMIN | Quản lý TT |
| `AdminLayout` | `/admin/reviews` | ADMIN | Quản lý DG |
| `AdminLayout` | `/admin/promotions` | ADMIN | Quản lý KM |
| `AdminLayout` | `/admin/support` | ADMIN | Quản lý HT |
| `AdminLayout` | `/admin/reports` | ADMIN | Báo cáo |
| `AdminLayout` | `/admin/notifications` | ADMIN | Thông báo |
| `AdminLayout` | `/admin/access` | ADMIN | Phân quyền |
| `AdminLayout` | `/admin/finance` | ADMIN | Tài chính |

---

## Authentication & Authorization

### User Roles (`src/types/auth.ts`)

```typescript
export type UserRole = 'GUEST' | 'CUSTOMER' | 'SHOP' | 'ADMIN';

export const UserRole = {
  GUEST: 'GUEST',
  CUSTOMER: 'CUSTOMER',
  SHOP: 'SHOP',
  ADMIN: 'ADMIN',       // toàn quyền hệ thống
};
```

### Auth Flow



## Global Components

### Header System

- **Sticky Header**: Khi scroll xuống header sticky với backdrop-blur
- **Glassmorphism**: Header trong suốt ở đầu trang
- **Mega Menu**: Danh mục sản phẩm với sub-categories
- **Mini Cart**: Quick view giỏ hàng
- **Search Bar**: Tìm kiếm với debounce + history + suggestions
- **Notification Center**: Thông báo theo type
- **User Menu**: Dropdown với account options


## Tính Năng Chính

### Customer Module
- [x] Đăng ký / Đăng nhập / Quên mật khẩu
- [x] Giỏ hàng (thêm, xóa, cập nhật số lượng, chọn sản phẩm)
- [x] Checkout (chọn địa chỉ, phương thức thanh toán)
- [x] Lịch sử đơn hàng + Chi tiết đơn hàng
- [x] Theo dõi vận chuyển (Timeline)
- [x] Wishlist (lưu localStorage)
- [x] Recently Viewed (lưu localStorage)
- [x] So sánh sản phẩm (max 4 sản phẩm)
- [x] Tài khoản cá nhân (Profile, Bảo mật, Thông báo)
- [x] Thông báo (Read/Unread, Filter by type)
- [x] Khuyến mãi & Voucher
- [x] Search với Debounce + History

### Product Module
- [x] 100+ sản phẩm thực (không placeholder)
- [x] Filter (Category, Brand, Price, Rating, In Stock)
- [x] Sort (Mới nhất, Bán chạy, Giá, Đánh giá)
- [x] Pagination
- [x] Gallery ảnh sản phẩm
- [x] Thông số kỹ thuật
- [x] Reviews hiển thị
- [x] Sản phẩm liên quan

### Shop Portal
- [x] Dashboard với Stats Cards
- [x] Quản lý sản phẩm (CRUD)
- [x] Quản lý đơn hàng
- [x] Quản lý kho hàng
- [x] Quản lý vận chuyển
- [x] Quản lý đánh giá
- [x] Quản lý khuyến mãi
- [x] Báo cáo doanh thu
- [x] Tài chính
- [x] Thanh toán
- [x] Hỗ trợ khách hàng
- [x] Cài đặt cửa hàng

### Admin Dashboard
- [x] Dashboard tổng quan
- [x] Quản lý sản phẩm
- [x] Quản lý đơn hàng
- [x] Quản lý khách hàng
- [x] Quản lý cửa hàng
- [x] Quản lý thanh toán
- [x] Quản lý đánh giá
- [x] Quản lý khuyến mãi
- [x] Quản lý hỗ trợ
- [x] Báo cáo hệ thống
- [x] Quản lý thông báo
- [x] Phân quyền người dùng
- [x] Tài chính hệ thống

---


