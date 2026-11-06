import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Product } from '../../types';
import { getStorageItem, setStorageItem } from '../../utils';

interface CompareItem {
  product: Product;
  addedAt: string;
}

interface CompareContextValue {
  items: CompareItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  clearAll: () => void;
  isInCompare: (productId: string) => boolean;
  maxItems: number;
}

const STORAGE_KEY = 'henzo_compare';

const CompareContext = createContext<CompareContextValue | null>(null);

export const CompareProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CompareItem[]>(() => {
    try {
      return getStorageItem<CompareItem[]>(STORAGE_KEY, []) || [];
    } catch {
      return [];
    }
  });

  const addItem = useCallback((product: Product) => {
    setItems(prev => {
      if (prev.find(i => i.product.id === product.id)) return prev;
      if (prev.length >= 4) return prev;
      const newItems = [...prev, { product, addedAt: new Date().toISOString() }];
      setStorageItem(STORAGE_KEY, newItems);
      return newItems;
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems(prev => {
      const newItems = prev.filter(i => i.product.id !== productId);
      setStorageItem(STORAGE_KEY, newItems);
      return newItems;
    });
  }, []);

  const clearAll = useCallback(() => {
    setItems([]);
    setStorageItem(STORAGE_KEY, []);
  }, []);

  const isInCompare = useCallback((productId: string) => {
    return items.some(i => i.product.id === productId);
  }, [items]);

  return (
    <CompareContext.Provider value={{ items, addItem, removeItem, clearAll, isInCompare, maxItems: 4 }}>
      {children}
    </CompareContext.Provider>
  );
};

export const useCompare = () => {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error('useCompare must be used within CompareProvider');
  return ctx;
};
