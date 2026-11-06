import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Product } from '../../types';
import { getStorageItem, setStorageItem } from '../../utils';

interface RecentlyViewedContextValue {
  items: Product[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  clearAll: () => void;
}

const STORAGE_KEY = 'henzo_recently_viewed';
const MAX_ITEMS = 20;

const RecentlyViewedContext = createContext<RecentlyViewedContextValue | null>(null);

export const RecentlyViewedProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<Product[]>(() => {
    try {
      return getStorageItem<Product[]>(STORAGE_KEY, []) || [];
    } catch {
      return [];
    }
  });

  const addItem = useCallback((product: Product) => {
    setItems(prev => {
      const filtered = prev.filter(p => p.id !== product.id);
      const newItems = [product, ...filtered].slice(0, MAX_ITEMS);
      setStorageItem(STORAGE_KEY, newItems);
      return newItems;
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems(prev => {
      const newItems = prev.filter(p => p.id !== productId);
      setStorageItem(STORAGE_KEY, newItems);
      return newItems;
    });
  }, []);

  const clearAll = useCallback(() => {
    setItems([]);
    setStorageItem(STORAGE_KEY, []);
  }, []);

  return (
    <RecentlyViewedContext.Provider value={{ items, addItem, removeItem, clearAll }}>
      {children}
    </RecentlyViewedContext.Provider>
  );
};

export const useRecentlyViewed = (): RecentlyViewedContextValue => {
  const ctx = useContext(RecentlyViewedContext);
  if (!ctx) throw new Error('useRecentlyViewed must be used within RecentlyViewedProvider');
  return ctx;
};
