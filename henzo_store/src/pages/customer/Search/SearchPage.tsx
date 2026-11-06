import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { catalogApi } from '../../../services/api/catalog';
import type { Product } from '../../../types';
import { useSearch } from '../../../contexts';
import './SearchPage.css';

const POPULAR = ['iPhone 16', 'MacBook Pro', 'Samsung Galaxy', 'ASUS ROG', 'AirPods', 'RTX 5090'];

const fmt = (p: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(p);

export const SearchPage = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const { search: _searchCtx, results: _resultsCtx, history, addToHistory, clearHistory } = useSearch();
  void _searchCtx; void _resultsCtx;
  const [searchParams] = useSearchParams();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const initialQuery = searchParams.get('q') || '';
  const displayQuery = query || initialQuery;

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  const handleSearch = async (q: string) => {
    if (!q.trim()) { setResults([]); setSearched(false); return; }
    setLoading(true);
    try {
      const { products } = await catalogApi.search(q);
      setResults(products);
      setSearched(true);
      void addToHistory(q);
    } catch (err) {
      console.error('Search failed:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInput = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (value.trim()) handleSearch(value);
      else { setResults([]); setSearched(false); }
    }, 400);
  };

  const ProductCard = ({ p }: { p: Product }) => (
    <div className="search-result-item card">
      <Link to={`/products/${p.slug}`} className="search-result-item__image">
        <img src={p.images[0]} alt={p.name} loading="lazy" />
        {p.discount > 0 && <span className="search-result-item__badge">-{p.discount}%</span>}
      </Link>
      <div className="search-result-item__info">
        <span className="search-result-item__brand">{p.brand}</span>
        <Link to={`/products/${p.slug}`} className="search-result-item__name">{p.name}</Link>
        <div className="search-result-item__rating">
          {[1,2,3,4,5].map(s => (
            <span key={s} className={s <= Math.round(p.rating) ? 'star filled' : 'star'}>★</span>
          ))}
          <span>({p.rating})</span>
        </div>
        <div className="search-result-item__price">
          <span className="price-current">{fmt(p.price)}</span>
          {p.discount > 0 && <span className="price-original">{fmt(p.originalPrice)}</span>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="search-page">
      <div className="container">
        <div className="search-page__bar">
          <div className="search-input-wrapper">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder="Tìm kiếm sản phẩm..."
              value={displayQuery}
              onChange={e => handleInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch(displayQuery)}
            />
            {displayQuery && (
              <button className="search-clear" onClick={() => { setQuery(''); setResults([]); setSearched(false); }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>
          <button className="btn btn-primary" onClick={() => handleSearch(displayQuery)}>Tìm kiếm</button>
        </div>

        {!searched && !loading && (
          <div className="search-page__content">
            {history.length > 0 && (
              <div className="search-section">
                <div className="search-section__header">
                  <h3>Lịch sử tìm kiếm</h3>
                  <button className="btn btn-ghost btn-sm" onClick={clearHistory}>Xóa</button>
                </div>
                <div className="search-history">
                  {history.map(h => (
                    <button key={h.id} className="search-history__item" onClick={() => { setQuery(h.query); handleSearch(h.query); }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                      </svg>
                      {h.query}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="search-section">
              <h3>Từ khóa phổ biến</h3>
              <div className="search-popular">
                {POPULAR.map(k => (
                  <button key={k} className="search-popular__item" onClick={() => { setQuery(k); handleSearch(k); }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
                    </svg>
                    {k}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="search-loading">
            <div className="spinner spinner-lg" />
            <p>Đang tìm kiếm...</p>
          </div>
        )}

        {searched && !loading && (
          <div className="search-results">
            <div className="search-results__header">
              <span>Kết quả cho "<strong>{displayQuery}</strong>": {results.length} sản phẩm</span>
            </div>
            {results.length === 0 ? (
              <div className="search-no-results">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <p>Không tìm thấy sản phẩm nào cho "{displayQuery}"</p>
                <span>Thử tìm kiếm với từ khóa khác</span>
              </div>
            ) : (
              <div className="search-results__grid">
                {results.map(p => <ProductCard key={p.id} p={p} />)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
