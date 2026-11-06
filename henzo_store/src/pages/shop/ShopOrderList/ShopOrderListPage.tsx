import { useState, useCallback, useEffect } from 'react';
import { useSeller } from '../../../contexts/SellerContext';
import { useToast } from '../../../contexts/ToastContext/ToastContext';
import { ConfirmModal } from '../../../components/common/ConfirmModal';
import type { SellerOrder } from '../../../types/seller';
import './ShopOrderListPage.css';

const formatVND = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

const STATUS_TABS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'pending', label: 'Chờ xác nhận' },
  { key: 'confirmed', label: 'Đã xác nhận' },
  { key: 'preparing', label: 'Đang chuẩn bị' },
  { key: 'shipped', label: 'Đã giao shipper' },
  { key: 'delivering', label: 'Đang giao' },
  { key: 'delivered', label: 'Hoàn thành' },
  { key: 'cancelled', label: 'Đã hủy' },
  { key: 'returned', label: 'Hoàn trả' },
];

const STATUS_BADGE: Record<string, string> = {
  pending: 'badge-warning', confirmed: 'badge-primary', preparing: 'badge-accent',
  shipped: 'badge-primary', delivering: 'badge-accent', delivered: 'badge-success',
  cancelled: 'badge-danger', returned: 'badge-danger',
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'Chờ xác nhận', confirmed: 'Đã xác nhận', preparing: 'Đang chuẩn bị',
  shipped: 'Đã giao shipper', delivering: 'Đang giao', delivered: 'Hoàn thành',
  cancelled: 'Đã hủy', returned: 'Hoàn trả',
};

const PAYMENT_LABEL: Record<string, string> = {
  cod: 'COD', banking: 'Chuyển khoản', vnpay: 'VNPay', momo: 'MoMo', zalopay: 'ZaloPay',
};

const NEXT_STATUS: Partial<Record<string, { next: string; label: string }>> = {
  pending: { next: 'confirmed', label: 'Xác nhận đơn' },
  confirmed: { next: 'preparing', label: 'Bắt đầu chuẩn bị' },
  preparing: { next: 'shipped', label: 'Giao cho shipper' },
  shipped: { next: 'delivering', label: 'Đang vận chuyển' },
  delivering: { next: 'delivered', label: 'Xác nhận giao thành công' },
};

export const ShopOrderListPage = () => {
  const { orders, ordersTotal, orderStatusCounts, loadOrders, updateOrderStatus } = useSeller();
  const toast = useToast();
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<SellerOrder | null>(null);
  const [pendingAdvance, setPendingAdvance] = useState<{ order: SellerOrder; next: { label: string; next: string } } | null>(null);
  const perPage = 15;

    const fetchOrders = useCallback(
    async (nextPage: number, nextTab: string, nextSearch: string) => {
      setLoading(true);
      try {
        await loadOrders({
          status: nextTab === 'all' ? undefined : nextTab,
          q: nextSearch.trim() || undefined,
          page: nextPage,
          pageSize: perPage,
        });
      } catch (err) {
        console.error('Load seller orders failed:', err);
        toast({
          title: 'Không tải được đơn hàng',
          message: err instanceof Error ? err.message : 'Vui lòng thử lại',
          variant: 'error',
        });
      } finally {
        setLoading(false);
      }
    },
    [loadOrders, toast],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchOrders(1, tab, search);
    }, search ? 300 : 0);
    return () => window.clearTimeout(timer);
  }, [tab, search, fetchOrders]);

  const totalPages = Math.max(1, Math.ceil((ordersTotal || orders.length) / perPage));
  const paginated = orders;

    const allCount = Object.values(orderStatusCounts).reduce(
    (sum, n) => sum + n,
    0,
  );
  const tabCounts: Record<string, number> = {
    all: allCount || ordersTotal || orders.length,
  };
  STATUS_TABS.slice(1).forEach(t => {
    tabCounts[t.key] = orderStatusCounts[t.key] ?? 0;
  });

  const handleAdvance = (order: SellerOrder) => {
    const next = NEXT_STATUS[order.status];
    if (next) { setPendingAdvance({ order, next }); }
  };

  const orderStatuses = STATUS_TABS.slice(1, STATUS_TABS.length - 2).map(t => t.key) as SellerOrder['status'][];

  return (
    <div className="seller-orders admin-page">
      <div className="admin-page__header">
        <div>
          <h1 className="admin-page__title">Quản lý đơn hàng</h1>
          <p className="admin-page__subtitle">Tổng cộng <strong>{ordersTotal || orders.length}</strong> đơn hàng</p>
        </div>
      </div>

      {}
      <div className="seller-tabs">
        {STATUS_TABS.map(t => (
          <button
            key={t.key}
            className={`seller-tab ${tab === t.key ? 'seller-tab--active' : ''}`}
            onClick={() => { setTab(t.key); setPage(1); }}
          >
            {t.label}
            {tabCounts[t.key] > 0 && (
              <span className="seller-tab__count">{tabCounts[t.key]}</span>
            )}
          </button>
        ))}
      </div>

      {}
      <div className="seller-orders__search">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input
          type="text"
          placeholder="Tìm theo mã đơn, tên khách hàng..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="seller-orders__search-input"
        />
      </div>

      {}
      <div className="admin-section">
        <div className="seller-table-wrap">
          <table className="seller-table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Khách hàng</th>
                <th>Tổng tiền</th>
                <th>Thanh toán</th>
                <th>Ngày đặt</th>
                <th>Trạng thái</th>
                <th style={{ width: 180 }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="seller-empty">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      <p>Không có đơn hàng nào</p>
                    </div>
                  </td>
                </tr>
              ) : paginated.map(order => (
                <tr key={order.id}>
                  <td><span className="seller-order-code">{order.orderCode}</span></td>
                  <td>
                    <div className="seller-table__customer">
                      <img src={order.customerAvatar} alt={order.customerName} className="seller-table__avatar" />
                      <div>
                        <p className="seller-table__customer-name">{order.customerName}</p>
                        <p className="seller-table__customer-phone">{order.customerPhone}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="seller-order-amount">{formatVND(order.finalAmount)}</span>
                    <span className="seller-order-items">{order.items} sản phẩm</span>
                  </td>
                  <td>
                    <span className="seller-payment-method">{PAYMENT_LABEL[order.paymentMethod] || order.paymentMethod}</span>
                    <span className={`badge ${order.paymentStatus === 'paid' ? 'badge-success' : order.paymentStatus === 'unpaid' ? 'badge-warning' : 'badge-danger'}`} style={{ fontSize: 10 }}>
                      {order.paymentStatus === 'paid' ? 'Đã thanh toán' : order.paymentStatus === 'unpaid' ? 'Chưa thanh toán' : 'Hoàn tiền'}
                    </span>
                  </td>
                  <td>
                    <span className="seller-order-date">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</span>
                    <span className="seller-order-time">{new Date(order.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                  </td>
                  <td><span className={`badge ${STATUS_BADGE[order.status]}`}>{STATUS_LABEL[order.status]}</span></td>
                  <td>
                    <div className="seller-order-actions">
                      <button className="seller-action-btn seller-action-btn--primary" title="Xem chi tiết" onClick={() => setSelectedOrder(order)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        Chi tiết
                      </button>
                      {NEXT_STATUS[order.status] && (
                        <button className="seller-action-btn seller-action-btn--success" title={NEXT_STATUS[order.status]!.label} onClick={() => handleAdvance(order)}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                          {NEXT_STATUS[order.status]!.label}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {}
        {(ordersTotal || orders.length) > perPage && (
          <div className="seller-pagination">
            <span className="seller-pagination__info">
              Hiển thị {(page - 1) * perPage + 1}–{Math.min(page * perPage, ordersTotal || orders.length)} của {ordersTotal || orders.length} đơn
            </span>
            <div className="seller-pagination__buttons">
              <button className="seller-pagination__btn" disabled={page === 1 || loading} onClick={() => { const p = page - 1; setPage(p); void fetchOrders(p, tab, search); }}>
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
                  <button key={i} className={`seller-pagination__btn ${page === p ? 'seller-pagination__btn--active' : ''}`} disabled={loading} onClick={() => { setPage(p); void fetchOrders(p, tab, search); }}>
                    {p}
                  </button>
                );
              })}
              <button className="seller-pagination__btn" disabled={page === totalPages || loading} onClick={() => { const p = page + 1; setPage(p); void fetchOrders(p, tab, search); }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {}
      {selectedOrder && (
        <>
          <div className="admin-detail-panel-overlay" onClick={() => setSelectedOrder(null)} />
          <div className="admin-detail-panel">
            <div className="admin-detail-panel__header">
              <h2 className="admin-detail-panel__title">Chi tiết đơn hàng {selectedOrder.orderCode}</h2>
              <button className="admin-detail-panel__close" onClick={() => setSelectedOrder(null)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="admin-detail-panel__body">
              {}
              <div className="seller-order-timeline">
                {orderStatuses.map(s => (
                  <div key={s} className={`seller-order-timeline__step ${s === selectedOrder.status ? 'active' : orderStatuses.indexOf(s) < orderStatuses.indexOf(selectedOrder.status) ? 'done' : ''}`}>
                    <div className="seller-order-timeline__dot" />
                    <span>{STATUS_LABEL[s]}</span>
                  </div>
                ))}
              </div>

              <div className="admin-detail-section">
                <h4 className="admin-detail-section__title">Thông tin khách hàng</h4>
                <div className="admin-detail-row">
                  <span className="admin-detail-label">Tên</span>
                  <span className="admin-detail-value">{selectedOrder.customerName}</span>
                </div>
                <div className="admin-detail-row">
                  <span className="admin-detail-label">Điện thoại</span>
                  <span className="admin-detail-value">{selectedOrder.customerPhone}</span>
                </div>
                <div className="admin-detail-row">
                  <span className="admin-detail-label">Địa chỉ giao</span>
                  <span className="admin-detail-value">{selectedOrder.shippingAddress}</span>
                </div>
                <div className="admin-detail-row">
                  <span className="admin-detail-label">Ghi chú</span>
                  <span className="admin-detail-value">{selectedOrder.note || 'Không có'}</span>
                </div>
              </div>

              <div className="admin-detail-section">
                <h4 className="admin-detail-section__title">Sản phẩm ({selectedOrder.items})</h4>
                {selectedOrder.products.map((item, i) => (
                  <div key={i} className="seller-order-product">
                    <img src={item.productImage} alt={item.productName}
                      className="seller-order-product__img"
                      onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/48x48/cccccc/999999?text=IMG'; }} />
                    <div className="seller-order-product__info">
                      <p className="seller-order-product__name">{item.productName}</p>
                      <p className="seller-order-product__sku">SKU: {item.sku}</p>
                    </div>
                    <div className="seller-order-product__right">
                      <p className="seller-order-product__price">{formatVND(item.unitPrice)}</p>
                      <p className="seller-order-product__qty">x{item.quantity}</p>
                      <p className="seller-order-product__total">{formatVND(item.totalPrice)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="admin-detail-section">
                <h4 className="admin-detail-section__title">Thanh toán</h4>
                <div className="admin-detail-row">
                  <span className="admin-detail-label">Tổng tiền</span>
                  <span className="admin-detail-value">{formatVND(selectedOrder.totalAmount)}</span>
                </div>
                <div className="admin-detail-row">
                  <span className="admin-detail-label">Phí vận chuyển</span>
                  <span className="admin-detail-value">{formatVND(selectedOrder.shippingFee)}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="admin-detail-row">
                    <span className="admin-detail-label">Giảm giá</span>
                    <span className="admin-detail-value" style={{ color: 'var(--color-success)' }}>-{formatVND(selectedOrder.discount)}</span>
                  </div>
                )}
                <div className="admin-detail-row" style={{ fontWeight: 700, fontSize: 'var(--font-size-md)' }}>
                  <span className="admin-detail-label">Thành tiền</span>
                  <span className="admin-detail-value" style={{ color: 'var(--color-danger)', fontSize: 'var(--font-size-lg)' }}>{formatVND(selectedOrder.finalAmount)}</span>
                </div>
                <div className="admin-detail-row">
                  <span className="admin-detail-label">Phương thức</span>
                  <span className="admin-detail-value">{PAYMENT_LABEL[selectedOrder.paymentMethod] || selectedOrder.paymentMethod}</span>
                </div>
                {selectedOrder.trackingNumber && (
                  <div className="admin-detail-row">
                    <span className="admin-detail-label">Mã vận đơn</span>
                    <span className="admin-detail-value">{selectedOrder.trackingNumber}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      <ConfirmModal
        open={!!pendingAdvance}
        title={pendingAdvance ? `${pendingAdvance.next.label} đơn hàng` : ''}
        message={pendingAdvance ? `Bạn có chắc muốn cập nhật trạng thái đơn hàng ${pendingAdvance.order.orderCode}?` : ''}
        confirmLabel="Xác nhận"
        onConfirm={() => {
          if (pendingAdvance) {
            updateOrderStatus(pendingAdvance.order.id, pendingAdvance.next.next as SellerOrder['status']);
            toast({ title: 'Cập nhật thành công', message: `Đơn hàng ${pendingAdvance.order.orderCode} đã được cập nhật`, variant: 'success' });
            setPendingAdvance(null);
          }
        }}
        onCancel={() => setPendingAdvance(null)}
      />
    </div>
  );
};
