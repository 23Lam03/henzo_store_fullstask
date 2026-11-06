import { useState, useMemo } from 'react';
import { useSeller } from '../../../contexts/SellerContext';
import './ShopShippingPage.css';

const formatVND = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

const STATUS_TABS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'waiting_pickup', label: 'Chờ lấy hàng' },
  { key: 'picked_up', label: 'Đã lấy hàng' },
  { key: 'in_transit', label: 'Đang vận chuyển' },
  { key: 'delivering', label: 'Đang giao' },
  { key: 'delivered', label: 'Giao thành công' },
  { key: 'failed', label: 'Giao thất bại' },
  { key: 'returned', label: 'Hoàn trả' },
];

const STATUS_BADGE: Record<string, string> = {
  waiting_pickup: 'badge-warning', picked_up: 'badge-primary', in_transit: 'badge-accent',
  delivering: 'badge-accent', delivered: 'badge-success', failed: 'badge-danger', returned: 'badge-danger',
};
const STATUS_LABEL: Record<string, string> = {
  waiting_pickup: 'Chờ lấy hàng', picked_up: 'Đã lấy hàng', in_transit: 'Đang vận chuyển',
  delivering: 'Đang giao', delivered: 'Giao thành công', failed: 'Giao thất bại', returned: 'Hoàn trả',
};

export const ShopShippingPage = () => {
  const { shippings } = useSeller();
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 15;

  const filtered = useMemo(() => {
    const list = Array.isArray(shippings) ? shippings : [];
    let result = tab === 'all' ? list : list.filter(s => s.status === tab);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(s =>
        (s.trackingNumber ?? '').toLowerCase().includes(q) ||
        (s.orderCode ?? '').toLowerCase().includes(q) ||
        (s.receiverName ?? '').toLowerCase().includes(q),
      );
    }
    return result;
  }, [shippings, tab, search]);

  const shippingList = Array.isArray(shippings) ? shippings : [];
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const counts: Record<string, number> = { all: shippingList.length };
  STATUS_TABS.slice(1).forEach(t => { counts[t.key] = shippingList.filter(s => s.status === t.key).length; });

  return (
    <div className="seller-shipping admin-page">
      <div className="admin-page__header">
        <div>
          <h1 className="admin-page__title">Quản lý vận chuyển</h1>
          <p className="admin-page__subtitle">Theo dõi trạng thái giao hàng</p>
        </div>
      </div>

      {}
      <div className="admin-stats admin-stats--4">
        {STATUS_TABS.slice(1, 5).map(t => (
          <div key={t.key} className="seller-shipping-stat">
            <p className="seller-shipping-stat__label">{t.label}</p>
            <p className="seller-shipping-stat__value">{counts[t.key]}</p>
          </div>
        ))}
      </div>

      {}
      <div className="seller-tabs">
        {STATUS_TABS.map(t => (
          <button key={t.key} className={`seller-tab ${tab === t.key ? 'seller-tab--active' : ''}`} onClick={() => { setTab(t.key); setPage(1); }}>
            {t.label}
            {counts[t.key] > 0 && <span className="seller-tab__count">{counts[t.key]}</span>}
          </button>
        ))}
      </div>

      {}
      <div className="seller-orders__search">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" placeholder="Tìm mã vận đơn, mã đơn, tên người nhận..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="seller-orders__search-input" />
      </div>

      {}
      <div className="admin-section">
        <div className="seller-table-wrap">
          <table className="seller-table">
            <thead>
              <tr>
                <th>Mã vận đơn</th>
                <th>Mã đơn hàng</th>
                <th>Người nhận</th>
                <th>Địa chỉ</th>
                <th>Đơn vị</th>
                <th>Phí ship</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={7}><div className="seller-empty"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="3" width="15" height="13" rx="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg><p>Không có vận đơn nào</p></div></td></tr>
              ) : paginated.map(s => (
                <tr key={s.id}>
                  <td><span className="seller-order-code">{s.trackingNumber || '—'}</span></td>
                  <td><span className="seller-order-code">{s.orderCode}</span></td>
                  <td>
                    <p className="seller-table__customer-name">{s.receiverName}</p>
                    <p className="seller-table__customer-phone">{s.receiverPhone}</p>
                  </td>
                  <td style={{ maxWidth: 200 }}>
                    <p className="seller-shipping-address">{s.receiverAddress}</p>
                  </td>
                  <td><span className="seller-payment-method">{s.carrier}</span></td>
                  <td><strong>{formatVND(s.shippingFee)}</strong></td>
                  <td><span className={`badge ${STATUS_BADGE[s.status]}`}>{STATUS_LABEL[s.status]}</span></td>
                </tr>
              ))}
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
