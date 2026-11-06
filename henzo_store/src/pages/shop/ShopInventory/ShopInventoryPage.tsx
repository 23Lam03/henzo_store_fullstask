import { useState, useMemo } from 'react';
import { useSeller } from '../../../contexts/SellerContext';
import './ShopInventoryPage.css';

const formatNum = (n: number) => new Intl.NumberFormat('vi-VN').format(n);

const STOCK_STATUS: Record<string, { label: string; cls: string }> = {
  in_stock: { label: 'Còn hàng', cls: 'badge-success' },
  low_stock: { label: 'Sắp hết', cls: 'badge-warning' },
  out_of_stock: { label: 'Hết hàng', cls: 'badge-danger' },
};

const STOCK_FILTERS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'in_stock', label: 'Còn hàng' },
  { key: 'low_stock', label: 'Sắp hết' },
  { key: 'out_of_stock', label: 'Hết hàng' },
];

export const ShopInventoryPage = () => {
  const { inventory, updateInventoryStock } = useSeller();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editingSku, setEditingSku] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const perPage = 15;

  const outOfStockCount = inventory.filter(i => i.status === 'out_of_stock').length;
  const lowStockCount = inventory.filter(i => i.status === 'low_stock').length;

  const filtered = useMemo(() => {
    let list = filter === 'all' ? inventory : inventory.filter(i => i.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(i => i.productName.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q));
    }
    return list;
  }, [inventory, filter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const handleSaveEdit = (sku: string) => {
    const val = parseInt(editValue);
    if (!isNaN(val) && val >= 0) {
      updateInventoryStock(sku, val);
    }
    setEditingSku(null);
    setEditValue('');
  };

  return (
    <div className="seller-inventory admin-page">
      <div className="admin-page__header">
        <div>
          <h1 className="admin-page__title">Quản lý kho hàng</h1>
          <p className="admin-page__subtitle">Quản lý tồn kho và cảnh báo hàng hết</p>
        </div>
      </div>

      {/* Alerts */}
      {(outOfStockCount > 0 || lowStockCount > 0) && (
        <div className="seller-inventory__alerts">
          {outOfStockCount > 0 && (
            <div className="seller-inventory__alert seller-inventory__alert--danger">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <strong>{outOfStockCount} sản phẩm đã hết hàng</strong> — Cần nhập kho ngay!
            </div>
          )}
          {lowStockCount > 0 && (
            <div className="seller-inventory__alert seller-inventory__alert--warning">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <strong>{lowStockCount} sản phẩm sắp hết hàng</strong> — Cần nhập kho sớm!
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="admin-stats admin-stats--4">
        <div className="seller-inv-stat">
          <p className="seller-inv-stat__label">Tổng sản phẩm</p>
          <p className="seller-inv-stat__value">{formatNum(inventory.length)}</p>
        </div>
        <div className="seller-inv-stat">
          <p className="seller-inv-stat__label">Còn hàng</p>
          <p className="seller-inv-stat__value" style={{ color: 'var(--color-success)' }}>{formatNum(inventory.filter(i => i.status === 'in_stock').length)}</p>
        </div>
        <div className="seller-inv-stat">
          <p className="seller-inv-stat__label">Sắp hết</p>
          <p className="seller-inv-stat__value" style={{ color: 'var(--color-warning)' }}>{formatNum(lowStockCount)}</p>
        </div>
        <div className="seller-inv-stat">
          <p className="seller-inv-stat__label">Hết hàng</p>
          <p className="seller-inv-stat__value" style={{ color: 'var(--color-danger)' }}>{formatNum(outOfStockCount)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="seller-inventory__toolbar">
        <div className="seller-tabs" style={{ borderBottom: 'none', marginBottom: 0 }}>
          {STOCK_FILTERS.map(f => (
            <button key={f.key} className={`seller-tab ${filter === f.key ? 'seller-tab--active' : ''}`} onClick={() => { setFilter(f.key); setPage(1); }}>
              {f.label}
              {f.key !== 'all' && (
                <span className="seller-tab__count">{inventory.filter(i => i.status === f.key).length}</span>
              )}
            </button>
          ))}
        </div>
        <div className="seller-inventory__search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" placeholder="Tìm theo tên, SKU..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="seller-orders__search-input" />
        </div>
      </div>

      {/* Table */}
      <div className="admin-section">
        <div className="seller-table-wrap">
          <table className="seller-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Sản phẩm</th>
                <th>Danh mục</th>
                <th>Tồn kho</th>
                <th>Đã bán</th>
                <th>Có sẵn</th>
                <th>Tối thiểu</th>
                <th>Trạng thái</th>
                <th>Cập nhật</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={9}><div className="seller-empty"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg><p>Không có sản phẩm nào</p></div></td></tr>
              ) : paginated.map(item => {
                const sc = STOCK_STATUS[item.status] || STOCK_STATUS.in_stock;
                return (
                  <tr key={item.sku}>
                    <td><span className="seller-sku">{item.sku}</span></td>
                    <td>
                      <div className="seller-product-cell">
                        <img src={item.productImage} alt={item.productName} className="seller-product-cell__img"
                          onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/48x48/cccccc/999999?text=IMG'; }} />
                        <span className="seller-product-cell__name">{item.productName}</span>
                      </div>
                    </td>
                    <td><span className="seller-category">{item.category}</span></td>
                    <td>
                      {editingSku === item.sku ? (
                        <div className="seller-inv-edit">
                          <input
                            type="number"
                            className="seller-inv-edit__input"
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            min={0}
                            autoFocus
                            onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(item.sku); if (e.key === 'Escape') setEditingSku(null); }}
                          />
                          <button className="seller-inv-edit__btn seller-inv-edit__btn--save" onClick={() => handleSaveEdit(item.sku)}>✓</button>
                          <button className="seller-inv-edit__btn seller-inv-edit__btn--cancel" onClick={() => setEditingSku(null)}>✕</button>
                        </div>
                      ) : (
                        <button className="seller-stock-btn" onClick={() => { setEditingSku(item.sku); setEditValue(String(item.stock)); }} title="Nhấn để sửa">
                          {formatNum(item.stock)}
                        </button>
                      )}
                    </td>
                    <td>{formatNum(item.sold)}</td>
                    <td><strong style={{ color: item.available < item.minStock ? 'var(--color-warning)' : 'var(--color-text-primary)' }}>{formatNum(item.available)}</strong></td>
                    <td>{formatNum(item.minStock)}</td>
                    <td><span className={`badge ${sc.cls}`}>{sc.label}</span></td>
                    <td><span className="seller-date">{item.lastRestocked}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length > perPage && (
          <div className="seller-pagination">
            <span className="seller-pagination__info">Hiển thị {(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} của {filtered.length}</span>
            <div className="seller-pagination__buttons">
              <button className="seller-pagination__btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg></button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let p = i + 1;
                if (totalPages > 7) { if (page <= 4) p = i + 1; else if (page >= totalPages - 3) p = totalPages - 6 + i; else p = page - 3 + i; }
                return <button key={i} className={`seller-pagination__btn ${page === p ? 'seller-pagination__btn--active' : ''}`} onClick={() => setPage(p)}>{p}</button>;
              })}
              <button className="seller-pagination__btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
