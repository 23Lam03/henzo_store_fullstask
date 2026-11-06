import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSeller } from '../../../contexts/SellerContext';
import './ShopDashboardPage.css';

const formatVND = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);
const formatNum = (n: number) => new Intl.NumberFormat('vi-VN').format(n);

export const ShopDashboardPage = () => {
  const { store, stats, orders, dailyRevenue, monthlyData } = useSeller();

  const [recentOrders] = useState(() => orders.slice(0, 8));

  const productSales: Record<string, { name: string; image: string; sold: number; revenue: number }> = {};
  orders.forEach(o => {
    o.products.forEach(p => {
      if (!productSales[p.productId]) {
        productSales[p.productId] = { name: p.productName, image: p.productImage, sold: 0, revenue: 0 };
      }
      productSales[p.productId].sold += p.quantity;
      productSales[p.productId].revenue += p.totalPrice;
    });
  });
  const topProducts = Object.entries(productSales)
    .sort((a, b) => b[1].sold - a[1].sold)
    .slice(0, 5);

  const statCards = [
    {
      label: 'Doanh thu tháng',
      value: formatVND(stats.totalRevenue),
      change: stats.revenueChange,
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
      iconBg: 'rgba(31,85,87,0.1)',
      iconColor: '#1F5557',
    },
    {
      label: 'Tổng đơn hàng',
      value: formatNum(stats.totalOrders),
      change: stats.ordersChange,
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
      iconBg: 'rgba(6,182,212,0.1)',
      iconColor: '#2A6A85',
    },
    {
      label: 'Đơn đang xử lý',
      value: formatNum(stats.pendingOrders),
      change: null,
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
      iconBg: 'rgba(245,158,11,0.1)',
      iconColor: '#A9741A',
    },
    {
      label: 'Đơn hoàn thành',
      value: formatNum(stats.completedOrders),
      change: null,
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
      iconBg: 'rgba(16,185,129,0.1)',
      iconColor: '#2F7D52',
    },
    {
      label: 'Sản phẩm đang bán',
      value: formatNum(stats.totalProducts),
      change: null,
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
      iconBg: 'rgba(139,92,246,0.1)',
      iconColor: '#1A4345',
    },
    {
      label: 'Sản phẩm hết hàng',
      value: formatNum(stats.outOfStockProducts),
      change: null,
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
      iconBg: 'rgba(239,68,68,0.1)',
      iconColor: '#B4322F',
    },
    {
      label: 'Khách hàng mới',
      value: formatNum(stats.newCustomers),
      change: null,
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
      iconBg: 'rgba(16,185,129,0.1)',
      iconColor: '#2F7D52',
    },
    {
      label: 'Tỷ lệ chuyển đổi',
      value: `${stats.conversionRate}%`,
      change: null,
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
      iconBg: 'rgba(245,158,11,0.1)',
      iconColor: '#A9741A',
    },
  ];

  const statusConfig: Record<string, { label: string; cls: string }> = {
    pending: { label: 'Chờ xác nhận', cls: 'badge-warning' },
    confirmed: { label: 'Đã xác nhận', cls: 'badge-primary' },
    preparing: { label: 'Đang chuẩn bị', cls: 'badge-accent' },
    shipped: { label: 'Đã giao shipper', cls: 'badge-primary' },
    delivering: { label: 'Đang giao', cls: 'badge-accent' },
    delivered: { label: 'Hoàn thành', cls: 'badge-success' },
    cancelled: { label: 'Đã hủy', cls: 'badge-danger' },
    returned: { label: 'Hoàn trả', cls: 'badge-danger' },
  };

  const chartData = dailyRevenue.slice(-14);
  const maxRevenue = Math.max(...chartData.map(d => d.revenue), 1);

  return (
    <div className="seller-dashboard">
      {}
      <div className="seller-dashboard__header">
        <div>
          <h1 className="seller-dashboard__title">Tổng quan cửa hàng</h1>
          <p className="seller-dashboard__subtitle">
            Chào mừng <strong>{store.name}</strong> quay trở lại! Đây là báo cáo hoạt động của cửa hàng.
          </p>
        </div>
        <div className="seller-dashboard__actions">
          <Link to="/seller/products/create" className="btn btn-primary btn-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Đăng sản phẩm
          </Link>
          <Link to="/seller/orders" className="btn btn-secondary btn-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            Xem đơn hàng
          </Link>
        </div>
      </div>

      {}
      <div className="admin-stats admin-stats--4" data-reveal-stagger>
        {statCards.map((card, i) => (
          <div key={i} className="seller-stat-card">
            <div className="seller-stat-card__icon" style={{ background: card.iconBg, color: card.iconColor }}>
              {card.icon}
            </div>
            <div className="seller-stat-card__info">
              <p className="seller-stat-card__label">{card.label}</p>
              <p className="seller-stat-card__value">{card.value}</p>
              {card.change !== null && (
                <span className={`seller-stat-card__change ${card.change >= 0 ? 'seller-stat-card__change--up' : 'seller-stat-card__change--down'}`}>
                  {card.change >= 0 ? '↑' : '↓'} {Math.abs(card.change)}%
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {}
      <div className="seller-dashboard__charts">
        {}
        <div className="seller-chart-card">
          <div className="seller-chart-card__header">
            <h3 className="seller-chart-card__title">Doanh thu 14 ngày gần nhất</h3>
            <span className="seller-chart-card__total">{formatVND(chartData.reduce((s, d) => s + d.revenue, 0))}</span>
          </div>
          <div className="seller-bar-chart">
            {chartData.map((d, i) => (
              <div key={i} className="seller-bar-chart__group">
                <div className="seller-bar-chart__bar-wrapper">
                  <div
                    className="seller-bar-chart__bar"
                    style={{ height: `${(d.revenue / maxRevenue) * 100}%` }}
                    title={formatVND(d.revenue)}
                  />
                </div>
                <span className="seller-bar-chart__label">{d.date}</span>
              </div>
            ))}
          </div>
        </div>

        {}
        <div className="seller-chart-card">
          <div className="seller-chart-card__header">
            <h3 className="seller-chart-card__title">Doanh thu theo tháng (12 tháng)</h3>
            <span className="seller-chart-card__total">{formatVND(monthlyData.reduce((s, d) => s + d.revenue, 0))}</span>
          </div>
          <div className="seller-bar-chart">
            {monthlyData.map((d, i) => {
              const maxM = Math.max(...monthlyData.map(m => m.revenue), 1);
              return (
                <div key={i} className="seller-bar-chart__group">
                  <div className="seller-bar-chart__bar-wrapper">
                    <div
                      className="seller-bar-chart__bar"
                      style={{ height: `${(d.revenue / maxM) * 100}%`, background: 'linear-gradient(180deg, #2A6A85 0%, #0891B2 100%)' }}
                      title={formatVND(d.revenue)}
                    />
                  </div>
                  <span className="seller-bar-chart__label">{d.month}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {}
      <div className="seller-dashboard__bottom">
        {}
        <div className="admin-section seller-orders-section">
          <div className="admin-section__header">
            <h3 className="admin-section__title">Đơn hàng gần đây</h3>
            <Link to="/seller/orders" className="seller-section-link">Xem tất cả →</Link>
          </div>
          <div className="seller-table-wrap">
            <table className="seller-table">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Khách hàng</th>
                  <th>Tổng tiền</th>
                  <th>Ngày đặt</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(order => {
                  const sc = statusConfig[order.status] || { label: order.status, cls: 'badge-dark' };
                  return (
                    <tr key={order.id}>
                      <td><span className="seller-table__code">{order.orderCode}</span></td>
                      <td>
                        <div className="seller-table__customer">
                          <img src={order.customerAvatar} alt={order.customerName} className="seller-table__avatar" />
                          <span>{order.customerName}</span>
                        </div>
                      </td>
                      <td><strong>{formatVND(order.finalAmount)}</strong></td>
                      <td>{new Date(order.createdAt).toLocaleDateString('vi-VN')}</td>
                      <td><span className={`badge ${sc.cls}`}>{sc.label}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {}
        <div className="admin-section seller-top-products-section">
          <div className="admin-section__header">
            <h3 className="admin-section__title">Top sản phẩm bán chạy</h3>
            <Link to="/seller/products" className="seller-section-link">Quản lý →</Link>
          </div>
          <div className="seller-top-products">
            {topProducts.map(([pid, p], i) => (
              <div key={pid} className="seller-top-product">
                <span className="seller-top-product__rank">{i + 1}</span>
                <img src={p.image} alt={p.name} className="seller-top-product__img"
                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/40x40/cccccc/999999?text=IMG'; }} />
                <div className="seller-top-product__info">
                  <p className="seller-top-product__name">{p.name}</p>
                  <p className="seller-top-product__sold">{formatNum(p.sold)} đã bán</p>
                </div>
                <span className="seller-top-product__revenue">{formatVND(p.revenue)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {}
      <div className="seller-dashboard__quick-bar">
        <div className="seller-quick-stat">
          <span className="seller-quick-stat__label">Đánh giá trung bình</span>
          <span className="seller-quick-stat__value">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#A9741A" stroke="#A9741A" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            {stats.avgRating} / 5
          </span>
        </div>
        <div className="seller-quick-stat">
          <span className="seller-quick-stat__label">Giá trị TB đơn hàng</span>
          <span className="seller-quick-stat__value">{formatVND(stats.totalOrders > 0 ? stats.totalRevenue / stats.totalOrders : 0)}</span>
        </div>
        <div className="seller-quick-stat">
          <span className="seller-quick-stat__label">Tổng doanh thu năm</span>
          <span className="seller-quick-stat__value">{formatVND(monthlyData.reduce((s, d) => s + d.revenue, 0))}</span>
        </div>
        <div className="seller-quick-stat">
          <span className="seller-quick-stat__label">Đơn hàng năm</span>
          <span className="seller-quick-stat__value">{formatNum(monthlyData.reduce((s, d) => s + d.orders, 0))}</span>
        </div>
      </div>
    </div>
  );
};
