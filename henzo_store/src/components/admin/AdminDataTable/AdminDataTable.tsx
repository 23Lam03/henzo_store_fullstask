import { useState, useMemo, type ReactNode } from 'react';
import './AdminDataTable.css';

export interface Column<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: unknown, record: T) => ReactNode;
}

interface Props<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: keyof T;
  pageSize?: number;
  searchable?: boolean;
  searchableFields?: (keyof T)[];
  filterable?: boolean;
  filterOptions?: { label: string; value: string }[];
  onFilterChange?: (value: string) => void;
  currentFilter?: string;
  actions?: (record: T) => ReactNode;
  emptyText?: string;
  loading?: boolean;
  onSort?: (key: string, dir: 'asc' | 'desc') => void;
  sortKey?: string;
  sortDir?: 'asc' | 'desc';
}

function AdminDataTable<T>({
  columns,
  data,
  rowKey,
  pageSize = 10,
  searchable = true,
  searchableFields,
  filterable = false,
  filterOptions = [],
  onFilterChange,
  currentFilter = 'all',
  actions,
  emptyText = 'Không có dữ liệu',
  loading = false,
  onSort,
  sortKey,
  sortDir,
}: Props<T>) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!search.trim() || !searchableFields?.length) return data;
    const q = search.toLowerCase();
    return (data as T[]).filter(item =>
      (searchableFields as (keyof T)[]).some(key =>
        String((item as Record<string, unknown>)[key as string] ?? '').toLowerCase().includes(q)
      )
    );
  }, [data, search, searchableFields]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSearch = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  return (
    <div className="admin-data-table">
      {(searchable || filterable) && (
        <div className="admin-data-table__toolbar">
          {searchable && (
            <div className="admin-data-table__search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="text"
                placeholder="Tìm kiếm..."
                value={search}
                onChange={e => handleSearch(e.target.value)}
                className="admin-data-table__search-input"
              />
              {search && (
                <button className="admin-data-table__search-clear" onClick={() => handleSearch('')}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              )}
            </div>
          )}
          {filterable && filterOptions.length > 0 && (
            <div className="admin-data-table__filters">
              <select
                className="admin-data-table__filter-select"
                value={currentFilter}
                onChange={e => onFilterChange?.(e.target.value)}
              >
                <option value="all">Tất cả</option>
                {filterOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          )}
          <div className="admin-data-table__info">
            {filtered.length > 0 && (
              <span>Hiển thị <strong>{Math.min((currentPage - 1) * pageSize + 1, filtered.length)}–{Math.min(currentPage * pageSize, filtered.length)}</strong> / <strong>{filtered.length}</strong> bản ghi</span>
            )}
          </div>
        </div>
      )}

      <div className="admin-data-table__wrapper">
        <table className="admin-data-table__table">
          <thead>
            <tr>
              {columns.map(col => (
                <th
                  key={String(col.key)}
                  style={{ width: col.width, textAlign: col.align || 'left' }}
                  className={col.sortable ? 'sortable' : ''}
                  onClick={() => col.sortable && onSort?.(String(col.key), sortDir === 'asc' ? 'desc' : 'asc')}
                >
                  <span className="th-content">
                    {col.label}
                    {col.sortable && sortKey === String(col.key) && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`sort-icon ${sortDir}`}>
                        {sortDir === 'asc'
                          ? <polyline points="18 15 12 9 6 15"/>
                          : <polyline points="6 9 12 15 18 9"/>
                        }
                      </svg>
                    )}
                  </span>
                </th>
              ))}
              {actions && <th style={{ width: '160px', textAlign: 'center' }}>Thao tác</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="admin-data-table__loading-row">
                  {columns.map((_, j) => (
                    <td key={j}>
                      <div className="skeleton" style={{ height: '16px', width: j === 0 ? '80%' : '60%', borderRadius: '4px' }} />
                    </td>
                  ))}
                  {actions && <td><div className="skeleton" style={{ height: '28px', width: '80px', borderRadius: '6px' }} /></td>}
                </tr>
              ))
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)}>
                  <div className="admin-data-table__empty">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M3 3h18v4H3z"/><path d="M3 7v14h18V7"/><path d="M9 11h6"/>
                    </svg>
                    <p>{emptyText}</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginated.map((record, idx) => (
                <tr
                  key={String((record as Record<string, unknown>)[rowKey as string])}
                  className={`${idx % 2 === 0 ? 'even' : 'odd'} admin-data-table__row`}
                  style={{ animationDelay: `${Math.min(idx, 12) * 35}ms` }}
                >
                  {columns.map(col => (
                    <td key={String(col.key)} style={{ textAlign: col.align || 'left' }}>
                      {col.render
                        ? col.render((record as Record<string, unknown>)[col.key as string], record)
                        : String((record as Record<string, unknown>)[col.key as string] ?? '—')}
                    </td>
                  ))}
                  {actions && (
                    <td style={{ textAlign: 'center' }}>
                      <div className="admin-data-table__actions">{actions(record)}</div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="admin-data-table__pagination">
          <button
            className="admin-data-table__page-btn"
            disabled={currentPage === 1}
            onClick={() => setPage(p => p - 1)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            const p = totalPages <= 7
              ? i + 1
              : currentPage <= 4
                ? i + 1
                : currentPage >= totalPages - 3
                  ? totalPages - 6 + i
                  : currentPage - 3 + i;
            return (
              <button
                key={p}
                className={`admin-data-table__page-btn ${p === currentPage ? 'active' : ''}`}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            );
          })}
          <button
            className="admin-data-table__page-btn"
            disabled={currentPage === totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

export { AdminDataTable };
