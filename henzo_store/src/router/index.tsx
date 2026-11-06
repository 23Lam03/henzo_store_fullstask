import { Suspense, lazy, type ReactNode } from 'react';
import { createBrowserRouter, Navigate, useLocation } from 'react-router-dom';
import { ProtectedRoute } from '../guards';
import { PermissionRoute } from '../guards';
import { ROUTES } from '../constants/routes';
import { RouteLoader } from '../components/common/RouteLoader/RouteLoader';
import { MainLayout, ShopLayout, AdminLayout, AuthLayout } from '../components/layouts';
import type { UserRole } from '../types';

// ─── Các vai trò trong hệ thống ───────────────────────────────────────────────
const CUSTOMER_ROLE: UserRole[] = ['CUSTOMER' as UserRole];
const SHOP_ROLE: UserRole[] = ['SHOP' as UserRole, 'ADMIN' as UserRole];
const ADMIN_ROLE: UserRole[] = ['ADMIN' as UserRole];

// ─── Tải trang theo cơ chế lazy loading ───────────────────────────────────────
const load = <T extends object>(fn: () => Promise<T>, key: keyof T) =>
  lazy(async () => {
    const mod = await fn();
    return { default: mod[key] as unknown as React.ComponentType };
  });

// Các trang công khai
const HomePage = load(() => import('../pages/customer/Home/HomePage'), 'HomePage');
const ProductListPage = load(() => import('../pages/customer/ProductList/ProductListPage'), 'ProductListPage');
const ProductDetailPage = load(() => import('../pages/customer/ProductDetail/ProductDetailPage'), 'ProductDetailPage');
const CategoryPage = load(() => import('../pages/customer/Category/CategoryPage'), 'CategoryPage');
const BrandPage = load(() => import('../pages/customer/Brand/BrandPage'), 'BrandPage');
const ComparePage = load(() => import('../pages/customer/Compare/ComparePage'), 'ComparePage');
const CategoriesPage = load(() => import('../pages/customer/Categories/CategoriesPage'), 'CategoriesPage');
const BrandsPage = load(() => import('../pages/customer/Brands/BrandsPage'), 'BrandsPage');
const AboutPage = load(() => import('../pages/customer/About/AboutPage'), 'AboutPage');
const FAQPage = load(() => import('../pages/customer/Faq/FAQPage'), 'FAQPage');
const BlogPage = load(() => import('../pages/customer/Blog/BlogPage'), 'BlogPage');
const BlogDetailPage = load(() => import('../pages/customer/Blog/BlogDetailPage'), 'BlogDetailPage');
const ShopPage = load(() => import('../pages/customer/Shops/ShopPage'), 'ShopPage');
const ShopDetailPage = load(() => import('../pages/customer/Shops/ShopDetailPage'), 'ShopDetailPage');

// Các trang xác thực
const LoginPage = load(() => import('../pages/auth/LoginPage/LoginPage'), 'LoginPage');
const RegisterPage = load(() => import('../pages/auth/RegisterPage/RegisterPage'), 'RegisterPage');
const ForgotPasswordPage = load(() => import('../pages/auth/ForgotPasswordPage/ForgotPasswordPage'), 'ForgotPasswordPage');

// Các trang khách hàng
const CartPage = load(() => import('../pages/customer/Cart/CartPage'), 'CartPage');
const CheckoutPage = load(() => import('../pages/customer/Checkout/CheckoutPage'), 'CheckoutPage');
const WishlistPage = load(() => import('../pages/customer/Wishlist/WishlistPage'), 'WishlistPage');
const AccountPage = load(() => import('../pages/customer/Account/AccountPage'), 'AccountPage');
const OrderHistoryPage = load(() => import('../pages/customer/Orders/OrderHistoryPage'), 'OrderHistoryPage');
const OrderDetailPage = load(() => import('../pages/customer/Orders/OrderDetailPage'), 'OrderDetailPage');
const NotificationPage = load(() => import('../pages/customer/Notifications/NotificationPage'), 'NotificationPage');
const ShippingTrackingPage = load(() => import('../pages/customer/Shipping/ShippingTrackingPage'), 'ShippingTrackingPage');
const CustomerSupportPage = load(() => import('../pages/customer/CustomerSupport/CustomerSupportPage'), 'CustomerSupportPage');
const PromotionPage = load(() => import('../pages/customer/Promotion/PromotionPage'), 'PromotionPage');
const SearchPage = load(() => import('../pages/customer/Search/SearchPage'), 'SearchPage');
const RecentlyViewedPage = load(() => import('../pages/customer/RecentlyViewed/RecentlyViewedPage'), 'RecentlyViewedPage');
const ContactPage = load(() => import('../pages/customer/Contact/ContactPage'), 'ContactPage');
const CustomerSettingsPage = load(() => import('../pages/customer/CustomerSettings/CustomerSettingsPage'), 'CustomerSettingsPage');
const AddressesPage = load(() => import('../pages/customer/Addresses/AddressesPage'), 'AddressesPage');
const PaymentsPage = load(() => import('../pages/customer/Payments/PaymentsPage'), 'PaymentsPage');

// Các trang shop
const ShopDashboardPage = load(() => import('../pages/shop/ShopDashboard/ShopDashboardPage'), 'ShopDashboardPage');
const ShopProductListPage = load(() => import('../pages/shop/ShopProductList/ShopProductListPage'), 'ShopProductListPage');
const CreateProductPage = load(() => import('../pages/shop/CreateProduct/CreateProductPage'), 'CreateProductPage');
const ShopOrderListPage = load(() => import('../pages/shop/ShopOrderList/ShopOrderListPage'), 'ShopOrderListPage');
const ShopInventoryPage = load(() => import('../pages/shop/ShopInventory/ShopInventoryPage'), 'ShopInventoryPage');
const ShopReviewsPage = load(() => import('../pages/shop/ShopReviews/ShopReviewsPage'), 'ShopReviewsPage');
const ShopPromotionsPage = load(() => import('../pages/shop/ShopPromotions/ShopPromotionsPage'), 'ShopPromotionsPage');
const ShopReportsPage = load(() => import('../pages/shop/ShopReports/ShopReportsPage'), 'ShopReportsPage');
const ShopFinancePage = load(() => import('../pages/shop/ShopFinance/ShopFinancePage'), 'ShopFinancePage');
const ShopPaymentPage = load(() => import('../pages/shop/ShopPayment/ShopPaymentPage'), 'ShopPaymentPage');
const ShopSupportPage = load(() => import('../pages/shop/ShopSupport/ShopSupportPage'), 'ShopSupportPage');
const ShopProfilePage = load(() => import('../pages/shop/ShopProfile/ShopProfilePage'), 'ShopProfilePage');
const ShopShippingPage = load(() => import('../pages/shop/ShopShipping/ShopShippingPage'), 'ShopShippingPage');
const ShopNotificationsPage = load(() => import('../pages/shop/ShopNotifications/ShopNotificationsPage'), 'ShopNotificationsPage');

// Các trang quản trị viên
const AdminDashboardPage = load(() => import('../pages/admin/AdminDashboard/DashboardPage'), 'AdminDashboardPage');
const AdminProductPage = load(() => import('../pages/admin/AdminProduct/AdminProductPage'), 'AdminProductPage');
const AdminProductEditPage = load(() => import('../pages/admin/AdminProduct/AdminProductEditPage'), 'AdminProductEditPage');
const AdminOrderPage = load(() => import('../pages/admin/AdminOrder/AdminOrderPage'), 'AdminOrderPage');
const AdminOrderDetailPage = load(() => import('../pages/admin/AdminOrderDetail/AdminOrderDetailPage'), 'AdminOrderDetailPage');
const AdminCustomerPage = load(() => import('../pages/admin/AdminCustomer/AdminCustomerPage'), 'AdminCustomerPage');
const AdminStorePage = load(() => import('../pages/admin/AdminStore/AdminStorePage'), 'AdminStorePage');
const AdminPaymentPage = load(() => import('../pages/admin/AdminPayment/AdminPaymentPage'), 'AdminPaymentPage');
const AdminReportsPage = load(() => import('../pages/admin/AdminReports/AdminReportsPage'), 'AdminReportsPage');
const AdminNotificationPage = load(() => import('../pages/admin/AdminNotification/AdminNotificationPage'), 'AdminNotificationPage');
const AdminSupportPage = load(() => import('../pages/admin/AdminSupport/AdminSupportPage'), 'AdminSupportPage');
const AdminReviewPage = load(() => import('../pages/admin/AdminReview/AdminReviewPage'), 'AdminReviewPage');
const AdminPromotionPage = load(() => import('../pages/admin/AdminPromotion/AdminPromotionPage'), 'AdminPromotionPage');
const AdminAccessPage = load(() => import('../pages/admin/AdminAccess/AdminAccessPage'), 'AdminAccessPage');
const AdminFinancePage = load(() => import('../pages/admin/AdminFinance/AdminFinancePage'), 'AdminFinancePage');

// Các trang lỗi
const NotFoundPage = load(() => import('../pages/errors/ErrorPages'), 'NotFoundPage');
const ForbiddenPage = load(() => import('../pages/errors/ErrorPages'), 'ForbiddenPage');
const ServerErrorPage = load(() => import('../pages/errors/ErrorPages'), 'ServerErrorPage');

// ─── Thành phần bao cho từng trang ────────────────────────────────────────────
// Bọc kèm hiệu ứng chuyển trang: nội dung mờ dần và trượt nhẹ khi đổi route.
const Page = ({ children }: { children: ReactNode }) => {
  const { pathname } = useLocation();
  return (
    <Suspense fallback={<RouteLoader />}>
      <div className="page-transition" key={pathname}>
        {children}
      </div>
    </Suspense>
  );
};

// ─── Cấu hình router ──────────────────────────────────────────────────────────
// basename phải khớp với base trong vite.config.ts: base: '/henzo_store/'
const routerBasename = import.meta.env.BASE_URL || '/henzo_store/';

export const router = createBrowserRouter(
  [
    // ─── Tuyến xác thực ─────────────────────────────────────────────────────────
    {
      element: <AuthLayout />,
      children: [
        { path: ROUTES.LOGIN, element: <Page><LoginPage /></Page> },
        { path: ROUTES.REGISTER, element: <Page><RegisterPage /></Page> },
        { path: ROUTES.FORGOT_PASSWORD, element: <Page><ForgotPasswordPage /></Page> },
      ],
    },

    // ─── Tuyến công khai ────────────────────────────────────────────────────────
    {
      element: <MainLayout />,
      children: [
        { index: true, element: <Page><HomePage /></Page> },
        { path: ROUTES.PRODUCTS, element: <Page><ProductListPage /></Page> },
        { path: ROUTES.PRODUCT_DETAIL, element: <Page><ProductDetailPage /></Page> },
        { path: ROUTES.CATEGORIES, element: <Page><CategoriesPage /></Page> },
        { path: ROUTES.CATEGORY_DETAIL, element: <Page><CategoryPage /></Page> },
        { path: ROUTES.BRANDS, element: <Page><BrandsPage /></Page> },
        { path: ROUTES.BRAND_DETAIL, element: <Page><BrandPage /></Page> },
        { path: ROUTES.SEARCH, element: <Page><SearchPage /></Page> },
        { path: ROUTES.PROMOTIONS, element: <Page><PromotionPage /></Page> },
        { path: ROUTES.CONTACT, element: <Page><ContactPage /></Page> },
        { path: ROUTES.WISHLIST, element: <Page><WishlistPage /></Page> },
        { path: ROUTES.CART, element: <Page><CartPage /></Page> },
        { path: ROUTES.RECENTLY_VIEWED, element: <Page><RecentlyViewedPage /></Page> },
        { path: ROUTES.ORDER_DETAIL, element: <Page><OrderDetailPage /></Page> },
        { path: ROUTES.COMPARE, element: <Page><ComparePage /></Page> },
        { path: ROUTES.BLOGS, element: <Page><BlogPage /></Page> },
        { path: ROUTES.BLOG_DETAIL, element: <Page><BlogDetailPage /></Page> },
        { path: ROUTES.SHOPS, element: <Page><ShopPage /></Page> },
        { path: ROUTES.SHOP_DETAIL, element: <Page><ShopDetailPage /></Page> },
        { path: ROUTES.ABOUT, element: <Page><AboutPage /></Page> },
        { path: ROUTES.FAQ, element: <Page><FAQPage /></Page> },

        // ─── Tuyến khách hàng được bảo vệ ───────────────────────────────────────
        {
          path: ROUTES.ACCOUNT,
          element: (
            <ProtectedRoute>
              <PermissionRoute allowedRoles={CUSTOMER_ROLE}>
                <Page><AccountPage /></Page>
              </PermissionRoute>
            </ProtectedRoute>
          ),
        },
        {
          path: ROUTES.ORDERS,
          element: (
            <ProtectedRoute>
              <PermissionRoute allowedRoles={CUSTOMER_ROLE}>
                <Page><OrderHistoryPage /></Page>
              </PermissionRoute>
            </ProtectedRoute>
          ),
        },
        {
          path: ROUTES.CHECKOUT,
          element: (
            <ProtectedRoute>
              <Page><CheckoutPage /></Page>
            </ProtectedRoute>
          ),
        },
        {
          path: ROUTES.NOTIFICATIONS,
          element: (
            <ProtectedRoute>
              <PermissionRoute allowedRoles={CUSTOMER_ROLE}>
                <Page><NotificationPage /></Page>
              </PermissionRoute>
            </ProtectedRoute>
          ),
        },
        {
          path: ROUTES.SUPPORT,
          element: (
            <ProtectedRoute>
              <PermissionRoute allowedRoles={CUSTOMER_ROLE}>
                <Page><CustomerSupportPage /></Page>
              </PermissionRoute>
            </ProtectedRoute>
          ),
        },
        {
          path: ROUTES.ACCOUNT_SETTINGS,
          element: (
            <ProtectedRoute>
              <PermissionRoute allowedRoles={CUSTOMER_ROLE}>
                <Page><CustomerSettingsPage /></Page>
              </PermissionRoute>
            </ProtectedRoute>
          ),
        },
        {
          path: ROUTES.ORDER_TRACKING,
          element: (
            <ProtectedRoute>
              <PermissionRoute allowedRoles={CUSTOMER_ROLE}>
                <Page><ShippingTrackingPage /></Page>
              </PermissionRoute>
            </ProtectedRoute>
          ),
        },
        {
          path: ROUTES.ADDRESSES,
          element: (
            <ProtectedRoute>
              <PermissionRoute allowedRoles={CUSTOMER_ROLE}>
                <Page><AddressesPage /></Page>
              </PermissionRoute>
            </ProtectedRoute>
          ),
        },
        {
          path: ROUTES.PAYMENTS,
          element: (
            <ProtectedRoute>
              <PermissionRoute allowedRoles={CUSTOMER_ROLE}>
                <Page><PaymentsPage /></Page>
              </PermissionRoute>
            </ProtectedRoute>
          ),
        },
      ],
    },

    // ─── Tuyến shop (/seller/*) ────────────────────────────────────────────────
    {
      path: '/seller',
      element: (
        <ProtectedRoute>
          <PermissionRoute allowedRoles={SHOP_ROLE}>
            <ShopLayout />
          </PermissionRoute>
        </ProtectedRoute>
      ),
      children: [
        { index: true, element: <Page><ShopDashboardPage /></Page> },
        { path: 'dashboard', element: <Page><ShopDashboardPage /></Page> },
        { path: 'products', element: <Page><ShopProductListPage /></Page> },
        { path: 'products/create', element: <Page><CreateProductPage /></Page> },
        { path: 'products/edit/:id', element: <Page><CreateProductPage /></Page> },
        { path: 'orders', element: <Page><ShopOrderListPage /></Page> },
        { path: 'inventory', element: <Page><ShopInventoryPage /></Page> },
        { path: 'reviews', element: <Page><ShopReviewsPage /></Page> },
        { path: 'promotions', element: <Page><ShopPromotionsPage /></Page> },
        { path: 'reports', element: <Page><ShopReportsPage /></Page> },
        { path: 'finance', element: <Page><ShopFinancePage /></Page> },
        { path: 'payments', element: <Page><ShopPaymentPage /></Page> },
        { path: 'support', element: <Page><ShopSupportPage /></Page> },
        { path: 'shipping', element: <Page><ShopShippingPage /></Page> },
        { path: 'profile', element: <Page><ShopProfilePage /></Page> },
        { path: 'notifications', element: <Page><ShopNotificationsPage /></Page> },
      ],
    },

    // ─── Tuyến quản trị (/admin/*) ─────────────────────────────────────────────
    {
      path: '/admin',
      element: (
        <ProtectedRoute>
          <PermissionRoute allowedRoles={ADMIN_ROLE}>
            <AdminLayout />
          </PermissionRoute>
        </ProtectedRoute>
      ),
      children: [
        { index: true, element: <Page><AdminDashboardPage /></Page> },
        { path: 'products', element: <Page><AdminProductPage /></Page> },
        { path: 'products/edit/:id', element: <Page><AdminProductEditPage /></Page> },
        { path: 'orders', element: <Page><AdminOrderPage /></Page> },
        { path: 'orders/:id', element: <Page><AdminOrderDetailPage /></Page> },
        { path: 'customers', element: <Page><AdminCustomerPage /></Page> },
        { path: 'customers/:id', element: <Page><AdminCustomerPage /></Page> },
        { path: 'stores', element: <Page><AdminStorePage /></Page> },
        { path: 'payments', element: <Page><AdminPaymentPage /></Page> },
        { path: 'reviews', element: <Page><AdminReviewPage /></Page> },
        { path: 'promotions', element: <Page><AdminPromotionPage /></Page> },
        { path: 'support', element: <Page><AdminSupportPage /></Page> },
        { path: 'reports', element: <Page><AdminReportsPage /></Page> },
        { path: 'notifications', element: <Page><AdminNotificationPage /></Page> },
        { path: 'access', element: <Page><AdminAccessPage /></Page> },
        { path: 'finance', element: <Page><AdminFinancePage /></Page> },
      ],
    },

    // ─── Tuyến lỗi ──────────────────────────────────────────────────────────────
    { path: ROUTES.NOT_FOUND, element: <Page><NotFoundPage /></Page> },
    { path: ROUTES.FORBIDDEN, element: <Page><ForbiddenPage /></Page> },
    { path: ROUTES.SERVER_ERROR, element: <Page><ServerErrorPage /></Page> },

    // ─── Tuyến bắt tất cả ─────────────────────────────────────────────────────
    { path: '*', element: <Navigate to={ROUTES.NOT_FOUND} replace /> },
  ],
  { basename: routerBasename }
);
