import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { WishlistItem, Product } from '../../types';
import { wishlistApi } from '../../services/api/wishlist';
import { useAuth } from '../AuthContext';

interface WishlistContextValue {
  items: WishlistItem[];
  addItem: (product: Product) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  toggleItem: (product: Product) => Promise<void>;
  clearWishlist: () => Promise<void>;
  count: number;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setItems([]);
      return;
    }
    setIsLoading(true);
    try {
      const data = await wishlistApi.get();
      setItems(data.items ?? []);
    } catch (err) {
      console.error('Load wishlist failed:', err);
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

  const addItem = useCallback(async (product: Product): Promise<void> => {
    if (!isAuthenticated) return;
    try {
      await wishlistApi.add(product.id);
      // Tải lại để có đầy đủ thông tin sản phẩm & thời điểm thêm.
      await refresh();
    } catch (err) {
      console.error('Add to wishlist failed:', err);
    }
  }, [isAuthenticated, refresh]);

  const removeItem = useCallback(async (productId: string): Promise<void> => {
    try {
      await wishlistApi.remove(productId);
      setItems(prev => prev.filter(i => i.product.id !== productId));
    } catch (err) {
      console.error('Remove from wishlist failed:', err);
    }
  }, []);

  const isInWishlist = useCallback(
    (productId: string) => items.some(i => i.product.id === productId),
    [items],
  );

  const toggleItem = useCallback(async (product: Product): Promise<void> => {
    if (isInWishlist(product.id)) {
      await removeItem(product.id);
    } else {
      await addItem(product);
    }
  }, [isInWishlist, removeItem, addItem]);

  const clearWishlist = useCallback(async (): Promise<void> => {
    if (!items.length) return;
    // Xoá tuần tự để backend kiểm tra quyền theo từng sản phẩm.
    await Promise.all(items.map(i => wishlistApi.remove(i.product.id)));
    setItems([]);
  }, [items]);

  return (
    <WishlistContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        isInWishlist,
        toggleItem,
        clearWishlist,
        count: items.length,
        isLoading,
        refresh,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = (): WishlistContextValue => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used within WishlistProvider');
  return context;
};
