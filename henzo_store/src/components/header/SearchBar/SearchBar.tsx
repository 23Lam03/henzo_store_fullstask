import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearch } from '../../../contexts/SearchContext';
import { useDebouncedCallback } from '../../../hooks';
import { formatPrice } from '../../../utils';
import './SearchBar.css';

interface SearchBarProps {
  autoFocus?: boolean;
  compact?: boolean;
}

const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
);

const IconX = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const IconClock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);

const IconTrending = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
  </svg>
);

export const SearchBar = ({ autoFocus = false, compact = false }: SearchBarProps) => {
  const navigate = useNavigate();
  const { query, results, isSearching, history, popularKeywords, setQuery, search, addToHistory, clearHistory, removeFromHistory } = useSearch();

  const [localQuery, setLocalQuery] = useState(query);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const debouncedSearch = useDebouncedCallback((q: string) => {
    setQuery(q);
    search(q);
  }, 300);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    setLocalQuery(query);
  }, [query]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalQuery(value);
    debouncedSearch(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localQuery.trim()) {
      addToHistory(localQuery.trim());
      navigate(`/products?search=${encodeURIComponent(localQuery.trim())}`);
      setIsFocused(false);
    }
  };

  const handleHistoryClick = (q: string) => {
    setLocalQuery(q);
    setQuery(q);
    search(q);
    navigate(`/products?search=${encodeURIComponent(q)}`);
  };

  const handleClear = () => {
    setLocalQuery('');
    setQuery('');
    setIsFocused(false);
    if (inputRef.current) inputRef.current.focus();
  };

  const showSuggestions = isFocused && (localQuery.length > 0 || history.length > 0);

  return (
    <div className={`search-bar ${compact ? 'search-bar--compact' : ''} ${isFocused ? 'search-bar--focused' : ''}`} ref={containerRef}>
      <form className="search-bar__form" onSubmit={handleSubmit}>
        <span className="search-bar__icon">
          {isSearching ? (
            <div className="spinner spinner-sm" />
          ) : (
            <IconSearch />
          )}
        </span>
        <input
          ref={inputRef}
          type="text"
          className="search-bar__input"
          placeholder="Tìm kiếm sản phẩm, thương hiệu..."
          value={localQuery}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          autoComplete="off"
        />
        {localQuery && (
          <button type="button" className="search-bar__clear" onClick={handleClear}>
            <IconX />
          </button>
        )}
        <button type="submit" className="search-bar__submit btn btn-primary btn-sm">
          Tìm
        </button>
      </form>

      {showSuggestions && (
        <div className="search-bar__dropdown">
          {localQuery.length === 0 && history.length > 0 && (
            <div className="search-bar__section">
              <div className="search-bar__section-header">
                <span className="search-bar__section-title">
                  <IconClock /> Lịch sử tìm kiếm
                </span>
                <button className="search-bar__clear-history" onClick={clearHistory}>Xóa tất cả</button>
              </div>
              {history.slice(0, 5).map(item => (
                <button key={item.id} className="search-bar__suggestion" onClick={() => handleHistoryClick(item.query)}>
                  <IconClock />
                  <span>{item.query}</span>
                  <button className="search-bar__remove" onClick={e => { e.stopPropagation(); removeFromHistory(item.id); }}>
                    <IconX />
                  </button>
                </button>
              ))}
            </div>
          )}

          {localQuery.length > 0 && results.length > 0 && (
            <div className="search-bar__section">
              <div className="search-bar__section-header">
                <span className="search-bar__section-title">Sản phẩm gợi ý</span>
              </div>
              {results.slice(0, 5).map(product => (
                <button
                  key={product.id}
                  className="search-bar__suggestion search-bar__suggestion--product"
                  onClick={() => {
                    setLocalQuery(product.name);
                    setQuery(product.name);
                    navigate(`/products/${product.slug}`);
                    setIsFocused(false);
                  }}
                >
                  <img src={product.images[0]} alt={product.name} className="search-bar__product-img" />
                  <div className="search-bar__product-info">
                    <span className="search-bar__product-name">{product.name}</span>
                    <span className="search-bar__product-price">{formatPrice(product.price)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {localQuery.length > 0 && results.length === 0 && !isSearching && (
            <div className="search-bar__empty">
              Không tìm thấy kết quả cho "{localQuery}"
            </div>
          )}

          {localQuery.length === 0 && history.length === 0 && (
            <div className="search-bar__section">
              <div className="search-bar__section-header">
                <span className="search-bar__section-title">
                  <IconTrending /> Từ khóa hot
                </span>
              </div>
              <div className="search-bar__keywords">
                {popularKeywords.slice(0, 6).map(keyword => (
                  <button
                    key={keyword}
                    className="search-bar__keyword"
                    onClick={() => handleHistoryClick(keyword)}
                  >
                    {keyword}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
