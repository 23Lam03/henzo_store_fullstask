import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Order, OrderStatus } from '../../types';
import { ordersApi, type CreateOrderInput } from '../../services/api/orders';
import { useAuth } from '../AuthContext';

interface OrderContextValue {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
  createOrder: (input: CreateOrderInput) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  cancelOrder: (orderId: string, reason?: string) => Promise<void>;
  getOrderById: (id: string) => Order | undefined;
  getOrderByNumber: (orderNumber: string) => Order | undefined;
  refresh: () => Promise<void>;
}

const OrderContext = createContext<OrderContextValue | null>(null);

export const OrderProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setOrders([]);
      return;
    }
    setIsLoading(true);
    try {
      const { orders: list } = await ordersApi.list({ pageSize: 100 });
      setOrders(list);
      setError(null);
    } catch (err) {
      console.error('Load orders failed:', err);
      setError(err instanceof Error ? err.message : 'Không tải được đơn hàng');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const handleAuthChange = () => {
      void refresh();
    };
    window.addEventListener('henzo-auth-change', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);
    return () => {
      window.removeEventListener('henzo-auth-change', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, [refresh]);

  /** Đặt hàng — server tính lại tiền, trừ kho & tạo vận đơn. */
  const createOrder = useCallback(async (input: CreateOrderInput): Promise<Order> => {
    const order = await ordersApi.create(input);
    setOrders(prev => [order, ...prev]);
    return order;
  }, []);

  const updateOrderStatus = useCallback(
    async (orderId: string, status: OrderStatus): Promise<void> => {
      try {
        const updated = await ordersApi.updateStatus(orderId, status);
        setOrders(prev => prev.map(o => (o.id === orderId ? updated : o)));
      } catch (err) {
        console.error('Update order status failed:', err);
        setError(err instanceof Error ? err.message : 'Không cập nhật được trạng thái');
      }
    },
    [],
  );

  const cancelOrder = useCallback(
    async (orderId: string, reason?: string): Promise<void> => {
      try {
        const updated = await ordersApi.cancel(orderId, reason);
        setOrders(prev => prev.map(o => (o.id === orderId ? updated : o)));
      } catch (err) {
        console.error('Cancel order failed:', err);
        setError(err instanceof Error ? err.message : 'Không huỷ được đơn hàng');
        throw err;
      }
    },
    [],
  );

  const getOrderById = useCallback(
    (id: string) => orders.find(order => order.id === id),
    [orders],
  );

  const getOrderByNumber = useCallback(
    (orderNumber: string) => orders.find(order => order.orderNumber === orderNumber),
    [orders],
  );

  const value = useMemo(
    () => ({
      orders,
      isLoading,
      error,
      createOrder,
      updateOrderStatus,
      cancelOrder,
      getOrderById,
      getOrderByNumber,
      refresh,
    }),
    [
      orders,
      isLoading,
      error,
      createOrder,
      updateOrderStatus,
      cancelOrder,
      getOrderById,
      getOrderByNumber,
      refresh,
    ],
  );

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
};

export const useOrder = (): OrderContextValue => {
  const context = useContext(OrderContext);
  if (!context) throw new Error('useOrder must be used within OrderProvider');
  return context;
};
