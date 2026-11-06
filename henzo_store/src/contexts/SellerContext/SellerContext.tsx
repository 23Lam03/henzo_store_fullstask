import {
  createContext, useContext, useState, useCallback, type ReactNode, useMemo, useEffect,
} from 'react';
import type {
  SellerStore, SellerOrder, SellerPayment, SellerReview,
  SellerPromotion, SellerSupportTicket, SellerInventoryItem,
  SellerShipping, SellerNotification, SellerDashboardStats,
  DailyRevenue, MonthlyData, OrderStatus,
} from '../../types/seller';
import { sellerApi, sellerNotificationApi } from '../../services/api/seller';
import type { SellerOrderListResult } from '../../services/api/seller';
import { useAuth } from '../AuthContext';

interface SellerContextValue {
  store: SellerStore;
  stats: SellerDashboardStats;
  orders: SellerOrder[];
    ordersTotal: number;
    orderStatusCounts: Record<string, number>;
  payments: SellerPayment[];
  reviews: SellerReview[];
  promotions: SellerPromotion[];
  tickets: SellerSupportTicket[];
  inventory: SellerInventoryItem[];
  shippings: SellerShipping[];
  notifications: SellerNotification[];
  dailyRevenue: DailyRevenue[];
  monthlyData: MonthlyData[];
  isLoading: boolean;
  error: string | null;

  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  updateReviewVisibility: (reviewId: string, hidden: boolean) => Promise<void>;
  respondToReview: (reviewId: string, response: string) => Promise<void>;
  updatePromotionStatus: (promotionId: string, status: SellerPromotion['status']) => Promise<void>;
  createPromotion: (promo: Omit<SellerPromotion, 'id' | 'createdAt' | 'usedCount'>) => Promise<void>;
  deletePromotion: (promotionId: string) => Promise<void>;
  updateTicketStatus: (ticketId: string, status: SellerSupportTicket['status']) => Promise<void>;
  addTicketMessage: (ticketId: string, content: string) => Promise<void>;
  updateInventoryStock: (sku: string, newStock: number) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  getOrderById: (id: string) => SellerOrder | undefined;
  getProductById: (id: string) => unknown | undefined;
  refresh: () => Promise<void>;
    loadOrders: (params?: {
    status?: string;
    q?: string;
    page?: number;
    pageSize?: number;
  }) => Promise<SellerOrderListResult>;
}

const SellerContext = createContext<SellerContextValue | null>(null);

export const useSeller = () => {
  const ctx = useContext(SellerContext);
  if (!ctx) throw new Error('useSeller must be used within SellerProvider');
  return ctx;
};

const EMPTY_STORE: SellerStore = {
  id: '',
  name: '',
  email: '',
  phone: '',
  address: '',
  avatar: '',
  banner: '',
  rating: 0,
  productCount: 0,
  orderCount: 0,
  followerCount: 0,
  isVerified: false,
  status: 'active',
  createdAt: new Date().toISOString(),
  description: '',
  taxId: '',
  bankAccount: '',
  bankName: '',
};

const EMPTY_STATS: SellerDashboardStats = {
  totalRevenue: 0,
  revenueChange: 0,
  totalOrders: 0,
  ordersChange: 0,
  pendingOrders: 0,
  completedOrders: 0,
  totalProducts: 0,
  outOfStockProducts: 0,
  newCustomers: 0,
  conversionRate: 0,
  avgRating: 0,
};

export const SellerProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, userRole } = useAuth();
  const [store, setStore] = useState<SellerStore>(EMPTY_STORE);
  const [stats, setStats] = useState<SellerDashboardStats>(EMPTY_STATS);
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [orderStatusCounts, setOrderStatusCounts] = useState<Record<string, number>>({});
  const [payments, setPayments] = useState<SellerPayment[]>([]);
  const [reviews, setReviews] = useState<SellerReview[]>([]);
  const [promotions, setPromotions] = useState<SellerPromotion[]>([]);
  const [tickets, setTickets] = useState<SellerSupportTicket[]>([]);
  const [inventory, setInventory] = useState<SellerInventoryItem[]>([]);
  const [shippings, setShippings] = useState<SellerShipping[]>([]);
  const [notifications, setNotifications] = useState<SellerNotification[]>([]);
  const [dailyRevenue, setDailyRevenue] = useState<DailyRevenue[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isShop = isAuthenticated && (userRole === 'SHOP' || userRole === 'ADMIN');

    const refresh = useCallback(async () => {
    if (!isShop) return;
    setIsLoading(true);

    const failures: string[] = [];

        const safe = async <T,>(
      label: string,
      fn: () => Promise<T>,
      fallback: T,
    ): Promise<T> => {
      try {
        return await fn();
      } catch (err) {
        console.error(`Load seller ${label} failed:`, err);
        failures.push(
          `${label}: ${err instanceof Error ? err.message : 'Lỗi không xác định'}`,
        );
        return fallback;
      }
    };

    const [dash, ord, pay, rev, promo, tkt, inv, ship] = await Promise.all([
      safe('dashboard', () => sellerApi.dashboard('month'), null),
      safe('orders', () => sellerApi.orders({ pageSize: 100 }), null),
      safe('payments', () => sellerApi.payments({ pageSize: 100 }), null),
      safe('reviews', () => sellerApi.reviews({ pageSize: 100 }), null),
      safe('promotions', () => sellerApi.promotions(), null),
      safe('tickets', () => sellerApi.tickets({ pageSize: 100 }), null),
      safe('inventory', () => sellerApi.inventory({ pageSize: 100 }), null),
      safe('shipping', () => sellerApi.shipping({ pageSize: 100 }), null),
    ]);

    if (dash) {
      if (dash.store) setStore(dash.store as SellerStore);
      setStats(dash.stats ?? EMPTY_STATS);
      setDailyRevenue(dash.dailyRevenue ?? []);
      setMonthlyData(dash.monthlyData ?? []);
    }
    if (ord) {
      setOrders(ord.orders);
      setOrdersTotal(ord.total);
      setOrderStatusCounts(ord.statusCounts ?? {});
    }
    if (pay) setPayments(pay.payments);
    if (rev) setReviews(rev.reviews);
    if (promo) setPromotions(promo.promotions);
    if (tkt) setTickets(tkt.tickets);
    if (inv) setInventory(inv.items);
    if (ship) setShippings(ship.shippings);

    if (failures.length) {
      console.error('Load seller data had failures:', failures);
      setError(
        failures.length === 1
          ? `Không tải được một phần dữ liệu cửa hàng (${failures[0]}).`
          : `Không tải được ${failures.length} nhóm dữ liệu cửa hàng.`,
      );
    } else {
      setError(null);
    }

    setIsLoading(false);
  }, [isShop]);

  const refreshNotifications = useCallback(async () => {
    if (!isShop) return;
    try {
      const data = await sellerNotificationApi.list({ pageSize: 50 });
      setNotifications(data.notifications);
    } catch (err) {
      console.error('Load seller notifications failed:', err);
    }
  }, [isShop]);

  useEffect(() => {
    void refresh();
    void refreshNotifications();
  }, [refresh, refreshNotifications]);

  useEffect(() => {
    const handleAuthChange = () => {
      void refresh();
      void refreshNotifications();
    };
    window.addEventListener('henzo-auth-change', handleAuthChange);
    return () => {
      window.removeEventListener('henzo-auth-change', handleAuthChange);
    };
  }, [refresh, refreshNotifications]);

    const loadOrders = useCallback(
    async (params: {
      status?: string;
      q?: string;
      page?: number;
      pageSize?: number;
    } = {}): Promise<SellerOrderListResult> => {
      const result = await sellerApi.orders({
        status: params.status,
        q: params.q,
        page: params.page,
        pageSize: params.pageSize ?? 15,
      });
      setOrders(result.orders);
      setOrdersTotal(result.total);

      setOrderStatusCounts(result.statusCounts ?? {});
      return result;
    },
    [],
  );

  const updateOrderStatus = useCallback(
    async (orderId: string, status: OrderStatus): Promise<void> => {
      try {
        const updated = await sellerApi.updateOrderStatus(orderId, status);
        setOrders(prev => prev.map(o => (o.id === orderId ? updated : o)));
      } catch (err) {
        console.error('Update seller order status failed:', err);
        setError(err instanceof Error ? err.message : 'Không cập nhật được đơn hàng');
      }
    },
    [],
  );

  const updateReviewVisibility = useCallback(
    async (reviewId: string, hidden: boolean): Promise<void> => {
      try {
        const updated = await sellerApi.updateReview(
          reviewId,
          hidden ? 'hide' : 'unhide',
        );
        setReviews(prev => prev.map(r => (r.id === reviewId ? updated : r)));
      } catch (err) {
        console.error('Update review visibility failed:', err);
        setError(err instanceof Error ? err.message : 'Không cập nhật được đánh giá');
      }
    },
    [],
  );

  const respondToReview = useCallback(
    async (reviewId: string, response: string): Promise<void> => {
      try {
        const updated = await sellerApi.updateReview(reviewId, 'respond', response);
        setReviews(prev => prev.map(r => (r.id === reviewId ? updated : r)));
      } catch (err) {
        console.error('Respond to review failed:', err);
        setError(err instanceof Error ? err.message : 'Không gửi được phản hồi');
      }
    },
    [],
  );

  const updatePromotionStatus = useCallback(
    async (promotionId: string, status: SellerPromotion['status']): Promise<void> => {
      try {
        const updated = await sellerApi.updatePromotionStatus(promotionId, status);
        setPromotions(prev => prev.map(p => (p.id === promotionId ? updated : p)));
      } catch (err) {
        console.error('Update promotion status failed:', err);
        setError(err instanceof Error ? err.message : 'Không cập nhật được khuyến mãi');
      }
    },
    [],
  );

  const createPromotion = useCallback(
    async (promo: Omit<SellerPromotion, 'id' | 'createdAt' | 'usedCount'>): Promise<void> => {
      try {
        const created = await sellerApi.createPromotion({
          name: promo.name,
          type: promo.type,
          code: promo.code,
          discountType: promo.discountType,
          discountValue: promo.discountValue,
          minOrderValue: promo.minOrderValue,
          maxDiscount: promo.maxDiscount,
          startDate: promo.startDate,
          endDate: promo.endDate,
          status: promo.status,
          usageLimit: promo.usageLimit,
          targetProducts: promo.targetProducts,
          targetCategories: promo.targetCategories,
        });
        setPromotions(prev => [created, ...prev]);
      } catch (err) {
        console.error('Create promotion failed:', err);
        setError(err instanceof Error ? err.message : 'Không tạo được khuyến mãi');
        throw err;
      }
    },
    [],
  );

  const deletePromotion = useCallback(
    async (promotionId: string): Promise<void> => {
      try {
        await sellerApi.deletePromotion(promotionId);
        setPromotions(prev => prev.filter(p => p.id !== promotionId));
      } catch (err) {
        console.error('Delete promotion failed:', err);
        setError(err instanceof Error ? err.message : 'Không xóa được khuyến mãi');
        throw err;
      }
    },
    [],
  );

  const updateTicketStatus = useCallback(
    async (ticketId: string, status: SellerSupportTicket['status']): Promise<void> => {
      try {
        const updated = await sellerApi.updateTicketStatus(ticketId, status);
        setTickets(prev => prev.map(t => (t.id === ticketId ? updated : t)));
      } catch (err) {
        console.error('Update ticket status failed:', err);
        setError(err instanceof Error ? err.message : 'Không cập nhật được phiếu hỗ trợ');
      }
    },
    [],
  );

  const addTicketMessage = useCallback(
    async (ticketId: string, content: string): Promise<void> => {
      try {
        const updated = await sellerApi.replyTicket(ticketId, content);
        setTickets(prev => prev.map(t => (t.id === ticketId ? updated : t)));
      } catch (err) {
        console.error('Reply ticket failed:', err);
        setError(err instanceof Error ? err.message : 'Không gửi được trả lời');
      }
    },
    [],
  );

  const updateInventoryStock = useCallback(
    async (sku: string, newStock: number): Promise<void> => {
      try {
        const updated = await sellerApi.updateInventoryStock(sku, newStock);
        setInventory(prev => prev.map(i => (i.sku === sku ? updated : i)));
      } catch (err) {
        console.error('Update inventory stock failed:', err);
        setError(err instanceof Error ? err.message : 'Không cập nhật được tồn kho');
      }
    },
    [],
  );

  const markNotificationRead = useCallback(async (id: string): Promise<void> => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, isRead: true } : n)));
    try {
      await sellerNotificationApi.markRead(id);
    } catch (err) {
      console.error('Mark notification read failed:', err);
      void refreshNotifications();
    }
  }, [refreshNotifications]);

  const markAllNotificationsRead = useCallback(async (): Promise<void> => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    try {
      await sellerNotificationApi.markRead();
    } catch (err) {
      console.error('Mark all notifications read failed:', err);
      void refreshNotifications();
    }
  }, [refreshNotifications]);

  const deleteNotification = useCallback(async (id: string): Promise<void> => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    try {
      await sellerNotificationApi.remove(id);
    } catch (err) {
      console.error('Delete notification failed:', err);
      void refreshNotifications();
    }
  }, [refreshNotifications]);

  const getOrderById = useCallback(
    (id: string) => orders.find(o => o.id === id),
    [orders],
  );

  const getProductById = useCallback(
    (id: string) => inventory.find(i => i.productId === id),
    [inventory],
  );

  const value = useMemo(
    () => ({
      store,
      stats,
      orders,
      ordersTotal,
      orderStatusCounts,
      payments,
      reviews,
      promotions,
      tickets,
      inventory,
      shippings,
      notifications,
      dailyRevenue,
      monthlyData,
      isLoading,
      error,
      updateOrderStatus,
      updateReviewVisibility,
      respondToReview,
      updatePromotionStatus,
      createPromotion,
      deletePromotion,
      updateTicketStatus,
      addTicketMessage,
      updateInventoryStock,
      markNotificationRead,
      markAllNotificationsRead,
      deleteNotification,
      getOrderById,
      getProductById,
      loadOrders,
      refresh,
    }),
    [
      store, stats, orders, ordersTotal, orderStatusCounts, payments, reviews,
      promotions, tickets, inventory,
      shippings, notifications, dailyRevenue, monthlyData, isLoading, error,
      updateOrderStatus, updateReviewVisibility, respondToReview,
      updatePromotionStatus, createPromotion, deletePromotion, updateTicketStatus,
      addTicketMessage, updateInventoryStock, markNotificationRead,
      markAllNotificationsRead, deleteNotification, getOrderById, getProductById,
      loadOrders, refresh,
    ],
  );

  return (
    <SellerContext.Provider value={value}>
      {children}
    </SellerContext.Provider>
  );
};
