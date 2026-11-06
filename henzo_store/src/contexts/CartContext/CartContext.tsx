import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { CartItem, Product } from '../../types';
import { cartApi } from '../../services/api/cart';
import { useAuth } from '../AuthContext';

interface CartContextValue {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  totalOriginalPrice: number;
  savings: number;
  shippingFee: number;
  isLoading: boolean;
  error: string | null;
  addItem: (product: Product, quantity?: number) => Promise<boolean>;
  removeItem: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  toggleSelect: (productId: string) => Promise<void>;
  selectAll: (selected: boolean) => Promise<void>;
  clearCart: () => Promise<void>;
  clearSelectedItems: () => Promise<void>;
  getItemCount: () => number;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Tải giỏ từ server (server là nguồn sự thật cho giá & tồn kho). */
  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setItems([]);
      return;
    }
    setIsLoading(true);
    try {
      const cart = await cartApi.get();
      setItems(cart.items ?? []);
      setError(null);
    } catch (err) {
      console.error('Load cart failed:', err);
      setError(err instanceof Error ? err.message : 'Không tải được giỏ hàng');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Tải lại giỏ khi trạng thái đăng nhập thay đổi.
  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Đồng bộ giữa các tab (đăng nhập/đăng xuất ở tab khác).
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

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items
    .filter(i => i.selected)
    .reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const totalOriginalPrice = items
    .filter(i => i.selected)
    .reduce((sum, item) => sum + item.product.originalPrice * item.quantity, 0);
  const savings = totalOriginalPrice - totalPrice;

  /** Phí ship do server quyết định (miễn phí từ 500k). */
  const shippingFee = totalPrice >= 500000 ? 0 : 30000;

  const addItem = useCallback(
    async (product: Product, quantity = 1): Promise<boolean> => {
      if (!isAuthenticated) return false;
      try {
        const cart = await cartApi.addItem(product.id, quantity);
        setItems(cart.items ?? []);
        setError(null);
        return true;
      } catch (err) {
        console.error('Add to cart failed:', err);
        setError(err instanceof Error ? err.message : 'Không thêm được vào giỏ');
        return false;
      }
    },
    [isAuthenticated],
  );

  const removeItem = useCallback(async (productId: string): Promise<void> => {
    try {
      const cart = await cartApi.removeItem(productId);
      setItems(cart.items ?? []);
    } catch (err) {
      console.error('Remove cart item failed:', err);
      setError(err instanceof Error ? err.message : 'Không xoá được sản phẩm');
    }
  }, []);

  const updateQuantity = useCallback(
    async (productId: string, quantity: number): Promise<void> => {
      try {
        // quantity <= 0 => backend xoá luôn khỏi giỏ.
        const cart = await cartApi.updateItem(productId, Math.max(0, quantity));
        setItems(cart.items ?? []);
      } catch (err) {
        console.error('Update cart quantity failed:', err);
        setError(err instanceof Error ? err.message : 'Không cập nhật được số lượng');
      }
    },
    [],
  );

  const toggleSelect = useCallback(async (productId: string): Promise<void> => {
    const item = items.find(i => i.product.id === productId);
    if (!item) return;
    try {
      const cart = await cartApi.toggleItem(productId, !item.selected);
      setItems(cart.items ?? []);
    } catch (err) {
      console.error('Toggle cart item failed:', err);
      setError(err instanceof Error ? err.message : 'Không cập nhật được giỏ hàng');
    }
  }, [items]);

  const selectAll = useCallback(async (selected: boolean): Promise<void> => {
    try {
      const cart = await cartApi.selectAll(selected);
      setItems(cart.items ?? []);
    } catch (err) {
      console.error('Select all cart items failed:', err);
      setError(err instanceof Error ? err.message : 'Không cập nhật được giỏ hàng');
    }
  }, []);

  const clearCart = useCallback(async (): Promise<void> => {
    try {
      const cart = await cartApi.clear(false);
      setItems(cart.items ?? []);
    } catch (err) {
      console.error('Clear cart failed:', err);
      setError(err instanceof Error ? err.message : 'Không xoá được giỏ hàng');
    }
  }, []);

  const clearSelectedItems = useCallback(async (): Promise<void> => {
    try {
      const cart = await cartApi.clear(true);
      setItems(cart.items ?? []);
    } catch (err) {
      console.error('Clear selected cart items failed:', err);
      setError(err instanceof Error ? err.message : 'Không xoá được giỏ hàng');
    }
  }, []);

  const getItemCount = useCallback(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems,
        totalPrice,
        totalOriginalPrice,
        savings,
        shippingFee,
        isLoading,
        error,
        addItem,
        removeItem,
        updateQuantity,
        toggleSelect,
        selectAll,
        clearCart,
        clearSelectedItems,
        getItemCount,
        refresh,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextValue => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
