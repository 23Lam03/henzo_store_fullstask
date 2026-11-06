import { RouterProvider } from 'react-router-dom';
import {
  ThemeProvider,
  AuthProvider,
  CartProvider,
  WishlistProvider,
  NotificationProvider,
  SearchProvider,
  CompareProvider,
  RecentlyViewedProvider,
  AdminProvider,
  OrderProvider,
  ReviewProvider,
  ToastProvider,
} from './contexts';
import { SellerProvider } from './contexts/SellerContext';
import { ErrorBoundary } from './components/common/ErrorBoundary/ErrorBoundary';
import { router } from './router';

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <SearchProvider>
            <CartProvider>
              <WishlistProvider>
                <NotificationProvider>
                  <CompareProvider>
                    <RecentlyViewedProvider>
                      <AdminProvider>
                        <OrderProvider>
                          <ReviewProvider>
                            <SellerProvider>
                            <ErrorBoundary>
                              <RouterProvider router={router} />
                            </ErrorBoundary>
                            </SellerProvider>
                          </ReviewProvider>
                        </OrderProvider>
                      </AdminProvider>
                    </RecentlyViewedProvider>
                  </CompareProvider>
                </NotificationProvider>
              </WishlistProvider>
            </CartProvider>
          </SearchProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
