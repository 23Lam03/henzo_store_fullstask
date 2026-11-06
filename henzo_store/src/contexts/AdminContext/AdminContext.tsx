import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import type {
  Store,
  User,
  Order,
  Payment,
  Review,
  Promotion,
  SupportTicket,
} from '../../types';
import { adminApi, type AdminStats } from '../../services/api/admin';
import { useAuth } from '../AuthContext';

const EMPTY_STATS: AdminStats = {
  totalRevenue: 0,
  totalOrders: 0,
  totalProducts: 0,
  totalCustomers: 0,
  totalStores: 0,
  totalPayments: 0,
  totalReviews: 0,
  totalPromotions: 0,
  totalTickets: 0,
};

interface AdminContextValue {
  // Data
  stores: Store[];
  customers: User[];
  orders: Order[];
  payments: Payment[];
  reviews: Review[];
  promotions: Promotion[];
  tickets: SupportTicket[];
  stats: AdminStats;
  isLoading: boolean;
  error: string | null;

  // Store actions
  addStore: (store: Partial<Store>) => Promise<void>;
  updateStore: (id: string, data: Partial<Store>) => Promise<void>;
  deleteStore: (id: string) => Promise<void>;
  lockStore: (id: string) => Promise<void>;
  unlockStore: (id: string) => Promise<void>;

  // Customer actions
  updateCustomer: (id: string, data: Partial<User>) => Promise<void>;
  lockCustomer: (id: string) => Promise<void>;
  unlockCustomer: (id: string) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;

  // Order actions
  updateOrderStatus: (id: string, status: Order['status']) => Promise<void>;

  // Review actions
  approveReview: (id: string) => Promise<void>;
  hideReview: (id: string) => Promise<void>;
  deleteReview: (id: string) => Promise<void>;

  // Promotion actions
  addPromotion: (promo: Partial<Promotion>) => Promise<void>;
  updatePromotion: (id: string, data: Partial<Promotion>) => Promise<void>;
  deletePromotion: (id: string) => Promise<void>;

  // Ticket actions
  updateTicketStatus: (id: string, status: SupportTicket['status']) => Promise<void>;
  assignTicket: (id: string, assignee: string) => Promise<void>;

  refresh: () => Promise<void>;
}

// ─── Context ───────────────────────────────────────────────────────────────────
const AdminContext = createContext<AdminContextValue | null>(null);

export const useAdmin = () => {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
};

// ─── Provider ─────────────────────────────────────────────────────────────────
export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, userRole } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [stats, setStats] = useState<AdminStats>(EMPTY_STATS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = isAuthenticated && userRole === 'ADMIN';

  const refresh = useCallback(async () => {
    if (!isAdmin) return;
    setIsLoading(true);
    try {
      const [dash, st, cus, ord, pay, rev, promo, tkt] = await Promise.all([
        adminApi.dashboard(),
        adminApi.stores({ pageSize: 100 }),
        adminApi.customers({ pageSize: 100 }),
        adminApi.orders({ pageSize: 100 }),
        adminApi.payments({ pageSize: 100 }),
        adminApi.reviews({ pageSize: 100 }),
        adminApi.promotions({ pageSize: 100 }),
        adminApi.tickets({ pageSize: 100 }),
      ]);

      setStats(dash.stats ?? EMPTY_STATS);
      setStores(st.stores as unknown as Store[]);
      setCustomers(cus.customers as unknown as User[]);
      setOrders(ord.orders);
      setPayments(pay.payments);
      setReviews(rev.reviews);
      setPromotions(promo.promotions);
      setTickets(tkt.tickets as unknown as SupportTicket[]);
      setError(null);
    } catch (err) {
      console.error('Load admin data failed:', err);
      setError(err instanceof Error ? err.message : 'Không tải được dữ liệu quản trị');
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const handleAuthChange = () => {
      void refresh();
    };
    window.addEventListener('henzo-auth-change', handleAuthChange);
    return () => {
      window.removeEventListener('henzo-auth-change', handleAuthChange);
    };
  }, [refresh]);

  // ─── Stores ───────────────────────────────────────────────────────────────
  const addStore = useCallback(async (store: Partial<Store>) => {
    const created = await adminApi.createStore(store as Record<string, unknown>);
    setStores(prev => [created as unknown as Store, ...prev]);
  }, []);

  const updateStore = useCallback(async (id: string, data: Partial<Store>) => {
    const updated = await adminApi.updateStore(id, data as Record<string, unknown>);
    setStores(prev => prev.map(s => (s.id === id ? (updated as unknown as Store) : s)));
  }, []);

  const deleteStore = useCallback(async (id: string) => {
    await adminApi.deleteStore(id);
    setStores(prev => prev.filter(s => s.id !== id));
  }, []);

  const lockStore = useCallback(async (id: string) => {
    const updated = await adminApi.storeAction(id, 'lock');
    setStores(prev => prev.map(s => (s.id === id ? { ...s, ...updated } : s)));
  }, []);

  const unlockStore = useCallback(async (id: string) => {
    const updated = await adminApi.storeAction(id, 'unlock');
    setStores(prev => prev.map(s => (s.id === id ? { ...s, ...updated } : s)));
  }, []);
  // ─── Customers ────────────────────────────────────────────────────────────
  const updateCustomer = useCallback(async (id: string, data: Partial<User>) => {
    const updated = await adminApi.updateCustomer(id, data as Record<string, unknown>);
    setCustomers(prev => prev.map(c => (c.id === id ? (updated as unknown as User) : c)));
  }, []);

  const lockCustomer = useCallback(async (id: string) => {
    const updated = await adminApi.customerAction(id, 'lock');
    setCustomers(prev => prev.map(c => (c.id === id ? { ...c, ...updated } : c)));
  }, []);

  const unlockCustomer = useCallback(async (id: string) => {
    const updated = await adminApi.customerAction(id, 'unlock');
    setCustomers(prev => prev.map(c => (c.id === id ? { ...c, ...updated } : c)));
  }, []);

  const deleteCustomer = useCallback(async (id: string) => {
    await adminApi.deleteCustomer(id);
    setCustomers(prev => prev.filter(c => c.id !== id));
  }, []);

  // ─── Orders ───────────────────────────────────────────────────────────────
  const updateOrderStatus = useCallback(async (id: string, status: Order['status']) => {
    const updated = await adminApi.updateOrderStatus(id, status);
    setOrders(prev => prev.map(o => (o.id === id ? updated : o)));
  }, []);

  // ─── Reviews ──────────────────────────────────────────────────────────────
  const approveReview = useCallback(async (id: string) => {
    const updated = await adminApi.reviewAction(id, 'approve');
    setReviews(prev => prev.map(r => (r.id === id ? { ...r, ...updated } : r)));
  }, []);

  const hideReview = useCallback(async (id: string) => {
    const updated = await adminApi.reviewAction(id, 'hide');
    setReviews(prev => prev.map(r => (r.id === id ? { ...r, ...updated } : r)));
  }, []);

  const deleteReview = useCallback(async (id: string) => {
    await adminApi.reviewAction(id, 'delete');
    setReviews(prev => prev.filter(r => r.id !== id));
  }, []);

  // ─── Promotions ───────────────────────────────────────────────────────────
  const addPromotion = useCallback(async (promo: Partial<Promotion>) => {
    const created = await adminApi.createPromotion(promo as Record<string, unknown>);
    setPromotions(prev => [created, ...prev]);
  }, []);

  const updatePromotion = useCallback(async (id: string, data: Partial<Promotion>) => {
    const updated = await adminApi.updatePromotion(id, data as Record<string, unknown>);
    setPromotions(prev => prev.map(p => (p.id === id ? updated : p)));
  }, []);

  const deletePromotion = useCallback(async (id: string) => {
    await adminApi.deletePromotion(id);
    setPromotions(prev => prev.filter(p => p.id !== id));
  }, []);

  // ─── Tickets ──────────────────────────────────────────────────────────────
  const updateTicketStatus = useCallback(async (id: string, status: SupportTicket['status']) => {
    const updated = await adminApi.ticketAction(id, { status });
    setTickets(prev => prev.map(t => (t.id === id ? (updated as unknown as SupportTicket) : t)));
  }, []);

  const assignTicket = useCallback(async (id: string, assignee: string) => {
    const updated = await adminApi.ticketAction(id, { assignee, status: 'open' });
    setTickets(prev => prev.map(t => (t.id === id ? (updated as unknown as SupportTicket) : t)));
  }, []);

  const value = useMemo(
    () => ({
      stores,
      customers,
      orders,
      payments,
      reviews,
      promotions,
      tickets,
      stats,
      isLoading,
      error,
      addStore,
      updateStore,
      deleteStore,
      lockStore,
      unlockStore,
      updateCustomer,
      lockCustomer,
      unlockCustomer,
      deleteCustomer,
      updateOrderStatus,
      approveReview,
      hideReview,
      deleteReview,
      addPromotion,
      updatePromotion,
      deletePromotion,
      updateTicketStatus,
      assignTicket,
      refresh,
    }),
    [
      stores, customers, orders, payments, reviews, promotions, tickets, stats,
      isLoading, error,
      addStore, updateStore, deleteStore, lockStore, unlockStore,
      updateCustomer, lockCustomer, unlockCustomer, deleteCustomer,
      updateOrderStatus, approveReview, hideReview, deleteReview,
      addPromotion, updatePromotion, deletePromotion,
      updateTicketStatus, assignTicket, refresh,
    ],
  );

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};
