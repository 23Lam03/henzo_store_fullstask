import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { SearchHistory, Product } from '../../types';
import { POPULAR_KEYWORDS } from '../../constants';
import { catalogApi } from '../../services/api/catalog';
import { useAuth } from '../AuthContext';

interface SearchContextValue {
  query: string;
  results: Product[];
  isSearching: boolean;
  history: SearchHistory[];
  popularKeywords: string[];
  error: string | null;
  setQuery: (q: string) => void;
  search: (q: string) => Promise<void>;
  addToHistory: (q: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  removeFromHistory: (id: string) => void;
}

const SearchContext = createContext<SearchContextValue | null>(null);

export const SearchProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const [query, setQueryState] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [history, setHistory] = useState<SearchHistory[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Lịch sử tìm kiếm lưu trên server (yêu cầu đăng nhập).
  const refreshHistory = useCallback(async () => {
    if (!isAuthenticated) {
      setHistory([]);
      return;
    }
    try {
      const data = await catalogApi.searchHistory();
      setHistory(data);
    } catch (err) {
      console.error('Load search history failed:', err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void refreshHistory();
  }, [refreshHistory]);

  const setQuery = useCallback((q: string) => {
    setQueryState(q);
  }, []);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const { products } = await catalogApi.search(q);
      setResults(products);
      setError(null);
    } catch (err) {
      console.error('Search failed:', err);
      setError(err instanceof Error ? err.message : 'Tìm kiếm thất bại');
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const addToHistory = useCallback(async (q: string) => {
    if (!q || !q.trim()) return;
    if (!isAuthenticated) return;

    // Cập nhật optimistically.
    setHistory(prev => {
      const filtered = prev.filter(h => h.query.toLowerCase() !== q.toLowerCase());
      return [
        { id: `local-${Date.now()}`, query: q, timestamp: new Date().toISOString() },
        ...filtered,
      ].slice(0, 10);
    });

    try {
      await catalogApi.recordSearch(q);
      await refreshHistory();
    } catch (err) {
      console.error('Record search history failed:', err);
    }
  }, [isAuthenticated, refreshHistory]);

  const clearHistory = useCallback(async () => {
    setHistory([]);
    if (!isAuthenticated) return;
    try {
      await catalogApi.clearSearchHistory();
    } catch (err) {
      console.error('Clear search history failed:', err);
    }
  }, [isAuthenticated]);

  const removeFromHistory = useCallback((id: string) => {
    setHistory(prev => prev.filter(h => h.id !== id));
  }, []);

  return (
    <SearchContext.Provider
      value={{
        query,
        results,
        isSearching,
        history,
        popularKeywords: POPULAR_KEYWORDS,
        error,
        setQuery,
        search,
        addToHistory,
        clearHistory,
        removeFromHistory,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = (): SearchContextValue => {
  const context = useContext(SearchContext);
  if (!context) throw new Error('useSearch must be used within SearchProvider');
  return context;
};
