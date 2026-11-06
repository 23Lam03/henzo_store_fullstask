import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { sellerApi } from '../../../services/api/seller';
import { useToast } from '../../../contexts/ToastContext/ToastContext';
import { ConfirmModal } from '../../../components/common/ConfirmModal';
import type { SellerProduct } from '../../../types/seller';
import './ShopProductListPage.css';

const formatVND = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);
const formatNum = (n: number) => new Intl.NumberFormat('vi-VN').format(n);

const STOCK_STATUS = {
  all: { label: 'Tất cả', cls: '' },
  selling: { label: 'Đang bán', cls: 'badge-success' },
  out: { label: 'Hết hàng', cls: 'badge-danger' },
  low: { label: 'Sắp hết', cls: 'badge-warning' },
} as const;

type StockFilter = keyof typeof STOCK_STATUS;

export const ShopProductListPage = () => {
  const toast = useToast();
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  void loading;
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const perPage = 12;

    const loadProducts = useMemo(() => async () => {
    setLoading(true);
    try {
      const res = await sellerApi.products({ pageSize: 200 });
      setProducts(res.products);
    } catch (err) {
      console.error('Load seller products failed:', err);
      toast({
        title: 'Không tải được sản phẩm',
        message: err instanceof Error ? err.message : 'Vui lòng thử lại.',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const filtered = useMemo(() => {
    let list = products;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q),
      );
    }
    if (stockFilter === 'out') list = list.filter(p => p.stock === 0);
    else if (stockFilter === 'low') list = list.filter(p => p.stock > 0 && p.stock < 10);
    else if (stockFilter === 'selling') list = list.filter(p => p.stock > 0);
    return list;
  }, [products, search, stockFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="seller-product-list admin-page">
      {}
      <div className="admin-page__header">
        <div>
          <h1 className="admin-page__title">Quản lý sản phẩm</h1>
          <p className="admin-page__subtitle">
            Đang có <strong>{products.length}</strong> sản phẩm trong cửa hàng
          </p>
        </div>
        <Link to="/seller/products/create" className="btn btn-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Đăng sản phẩm mới
        </Link>
      </div>

      {}
      <div className="seller-product-list__toolbar">
        <div className="seller-product-list__search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            type="text"
            placeholder="Tìm theo tên, SKU, thương hiệu..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="seller-product-list__search-input"
          />
          {search && (
            <button className="seller-product-list__search-clear" onClick={() => { setSearch(''); setPage(1); }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          )}
        </div>
        <div className="seller-product-list__filters">
          {(Object.keys(STOCK_STATUS) as StockFilter[]).map(key => (
            <button
              key={key}
              className={`seller-filter-btn ${stockFilter === key ? 'seller-filter-btn--active' : ''}`}
              onClick={() => { setStockFilter(key); setPage(1); }}
            >
              {STOCK_STATUS[key].label}
            </button>
          ))}
        </div>
      </div>

      {}
      <div className="admin-section">
        <div className="seller-table-wrap">
          <table className="seller-table seller-product-table">
            <thead>
              <tr>
                <th style={{ width: 44 }}>
                  <input type="checkbox" />
                </th>
                <th>Sản phẩm</th>
                <th>Danh mục</th>
                <th>Giá</th>
                <th>Tồn kho</th>
                <th>Lượt xem</th>
                <th>Đã bán</th>
                <th>Trạng thái</th>
                <th style={{ width: 120 }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <div className="seller-empty">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                      <p>Không tìm thấy sản phẩm nào</p>
                    </div>
                  </td>
                </tr>
              ) : paginated.map(product => {
                const stockStatus = product.stock === 0 ? 'Hết hàng' : product.stock < 10 ? 'Sắp hết' : 'Còn hàng';
                const stockCls = product.stock === 0 ? 'badge-danger' : product.stock < 10 ? 'badge-warning' : 'badge-success';
                return (
                  <tr key={product.id}>
                    <td><input type="checkbox" /></td>
                    <td>
                      <div className="seller-product-cell">
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="seller-product-cell__img"
                          onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/48x48/cccccc/999999?text=IMG'; }}
                        />
                        <div className="seller-product-cell__info">
                          <p className="seller-product-cell__name">{product.name}</p>
                          <p className="seller-product-cell__sku">SKU: {product.id.slice(-8).toUpperCase()}</p>
                          <div className="seller-product-cell__tags">
                            {product.isHot && <span className="badge badge-danger">Hot</span>}
                            {product.isNew && <span className="badge badge-success">Mới</span>}
                            {product.isFeatured && <span className="badge badge-primary">Nổi bật</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="seller-table__category">{product.categoryName}</span>
                      <span className="seller-table__brand">{product.brand}</span>
                    </td>
                    <td>
                      <span className="seller-price__current">{formatVND(product.price)}</span>
                      {product.discount > 0 && (
                        <>
                          <span className="seller-price__original">{formatVND(product.originalPrice)}</span>
                          <span className="badge badge-danger" style={{ fontSize: 10 }}>-{product.discount}%</span>
                        </>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${stockCls}`}>{stockStatus} ({product.stock})</span>
                    </td>
                    <td><span className="seller-table__num">{formatNum(product.stock * 3 + product.sold)}</span></td>
                    <td><span className="seller-table__num">{formatNum(product.sold)}</span></td>
                    <td>
                      <span className={`badge ${stockCls}`}>{stockStatus}</span>
                    </td>
                    <td>
                      <div className="seller-table__actions">
                        <Link to={`/seller/products/edit/${product.id}`} className="seller-action-btn" title="Sửa">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </Link>
                        <button className="seller-action-btn seller-action-btn--danger" title="Xóa"
                          onClick={() => setPendingDelete(product.id)}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {}
        {filtered.length > perPage && (
          <div className="seller-pagination">
            <span className="seller-pagination__info">
              Hiển thị {(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} của {filtered.length} sản phẩm
            </span>
            <div className="seller-pagination__buttons">
              <button className="seller-pagination__btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let p = i + 1;
                if (totalPages > 7) {
                  if (page <= 4) p = i + 1;
                  else if (page >= totalPages - 3) p = totalPages - 6 + i;
                  else p = page - 3 + i;
                }
                return (
                  <button key={i} className={`seller-pagination__btn ${page === p ? 'seller-pagination__btn--active' : ''}`} onClick={() => setPage(p)}>
                    {p}
                  </button>
                );
              })}
              <button className="seller-pagination__btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        open={!!pendingDelete}
        title="Xóa sản phẩm"
        message="Bạn có chắc muốn xóa sản phẩm này? Hành động này không thể hoàn tác."
        confirmLabel="Xóa"
        variant="danger"
        onConfirm={async () => {
          if (pendingDelete) {
            try {
              await sellerApi.deleteProduct(pendingDelete);
              setProducts(prev => prev.filter(p => p.id !== pendingDelete));
              toast({ title: 'Đã xóa sản phẩm', variant: 'success' });
            } catch (err) {
              toast({
                title: 'Xóa thất bại',
                message: err instanceof Error ? err.message : 'Vui lòng thử lại.',
                variant: 'error',
              });
            }
          }
          setPendingDelete(null);
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
};
