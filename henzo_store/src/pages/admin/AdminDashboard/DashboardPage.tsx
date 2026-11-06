import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { formatNumber } from '../../../utils';
import { adminApi, type AdminDashboard } from '../../../services/api/admin';
import { CountUp } from '../../../components/common/CountUp';
import './DashboardPage.css';

const formatCurrency = (n: number) => {
  if (n >= 1e12) return `${(n / 1e12).toFixed(1)}T`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(0)}M`;
  return formatNumber(n);
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  processing: 'Đang xử lý',
  shipping: 'Đang vận chuyển',
  delivered: 'Hoàn thành',
  cancelled: 'Đã hủy',
};

const ACTIVITY_ICONS = ['store', 'order', 'promo', 'product', 'payment'] as const;

export const AdminDashboardPage = () => {
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await adminApi.dashboard();
        if (!cancelled) setData(res);
      } catch (err) {
        console.error('Load admin dashboard failed:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = data?.stats;
  const monthlyRevenue = data?.monthlyRevenue ?? [];
  const recentOrders = data?.recentOrders ?? [];
  const topProducts = data?.topProducts ?? [];

  const maxRevenue = useMemo(
    () => Math.max(1, ...monthlyRevenue.map(m => m.revenue)),
    [monthlyRevenue],
  );

  const today = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  // Hoạt động hệ thống dựng từ đơn hàng & top sản phẩm gần nhất.
  const systemActivities = useMemo(
    () =>
      recentOrders.slice(0, 5).map((o, i) => ({
        action: `Đơn hàng ${o.id} · ${o.customer}`,
        time: new Date(o.date).toLocaleString('vi-VN', {
          day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
        }),
        icon: ACTIVITY_ICONS[i % ACTIVITY_ICONS.length],
      })),
    [recentOrders],
  );

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__header">
        <div>
          <h1 className="admin-dashboard__title">Tổng Quan Hệ Thống</h1>
          <p className="admin-dashboard__subtitle">{today}</p>
        </div>
        <div className="admin-dashboard__actions">
          <Link to="/admin/reports" className="btn btn-outline btn-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Xuất báo cáo
          </Link>
          <Link to="/admin/reports" className="btn btn-primary btn-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            Báo cáo chi tiết
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="admin-stats admin-stats--5" data-reveal-stagger>
        {[
          { label: 'Tổng doanh thu', raw: stats?.totalRevenue ?? 0, format: formatCurrency, change: '+15.2%', dir: 'up', icon: 'revenue', color: '#1F5557' },
          { label: 'Tổng đơn hàng', raw: stats?.totalOrders ?? 0, format: (n: number) => formatNumber(Math.round(n)), change: '+12.8%', dir: 'up', icon: 'orders', color: '#2A6A85' },
          { label: 'Tổng sản phẩm', raw: stats?.totalProducts ?? 0, format: (n: number) => formatNumber(Math.round(n)), change: '+8.3%', dir: 'up', icon: 'products', color: '#2F7D52' },
          { label: 'Tổng khách hàng', raw: stats?.totalCustomers ?? 0, format: (n: number) => formatNumber(Math.round(n)), change: '+5.7%', dir: 'up', icon: 'customers', color: '#A9741A' },
          { label: 'Tổng cửa hàng', raw: stats?.totalStores ?? 0, format: (n: number) => formatNumber(Math.round(n)), change: '+3.2%', dir: 'up', icon: 'stores', color: '#B4322F' },
        ].map((s, i) => (
          <div key={i} className="admin-stat-card">
            <div className="admin-stat-card__icon" style={{ background: `${s.color}15`, color: s.color }}>
              {s.icon === 'revenue' && <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
              {s.icon === 'orders' && <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>}
              {s.icon === 'products' && <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>}
              {s.icon === 'customers' && <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
              {s.icon === 'stores' && <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>}
            </div>
            <div className="admin-stat-card__info">
              <p className="admin-stat-card__label">{s.label}</p>
              <p className="admin-stat-card__value">
                <CountUp value={s.raw} format={s.format} />
              </p>
              <span className={`admin-stat-card__change admin-stat-card__change--${s.dir}`}>{s.change} tháng trước</span>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Chart + Quick Actions */}
      <div className="admin-dashboard__grid-2">
        <div className="admin-section">
          <div className="admin-section__header">
            <h3 className="admin-section__title">Doanh thu 6 tháng gần đây</h3>
            <div className="admin-dashboard__chart-legend">
              <span className="legend-dot" style={{ background: 'var(--color-primary)' }} />
              <span>Doanh thu (VNĐ)</span>
            </div>
          </div>
          <div className="admin-section__body">
            {loading ? (
              <div className="spinner spinner-lg" />
            ) : (
              <div className="admin-chart">
                {monthlyRevenue.map((m, i) => (
                  <div key={i} className="admin-chart__bar-group">
                    <div className="admin-chart__bar-wrapper">
                      <div className="admin-chart__bar" style={{ height: `${(m.revenue / maxRevenue) * 100}%` }}>
                        <span className={`admin-chart__bar-value ${m.revenue === 0 ? 'admin-chart__bar-value--zero' : ''}`}>
                          {formatCurrency(m.revenue)}
                        </span>
                      </div>
                    </div>
                    <span className="admin-chart__label">{m.month}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="admin-section">
          <div className="admin-section__header">
            <h3 className="admin-section__title">Hoạt động hệ thống</h3>
            <span className="admin-dashboard__live-badge">
              <span className="live-dot" />
              Live
            </span>
          </div>
          <div className="admin-section__body" style={{ padding: '0' }}>
            {systemActivities.map((a, i) => (
              <div key={i} className="admin-activity-item">
                <div className={`admin-activity-icon admin-activity-icon--${a.icon}`}>
                  {a.icon === 'store' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>}
                  {a.icon === 'order' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>}
                  {a.icon === 'promo' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>}
                  {a.icon === 'product' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/></svg>}
                  {a.icon === 'payment' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>}
                </div>
                <div className="admin-activity-content">
                  <p className="admin-activity-text">{a.action}</p>
                  <span className="admin-activity-time">{a.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders + Top Products */}
      <div className="admin-dashboard__grid-2">
        <div className="admin-section">
          <div className="admin-section__header">
            <h3 className="admin-section__title">Đơn hàng gần đây</h3>
            <Link to="/admin/orders" className="admin-dashboard__view-all">Xem tất cả →</Link>
          </div>
          <div className="admin-section__body" style={{ padding: '0' }}>
            <table className="admin-dashboard__orders-table">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Khách hàng</th>
                  <th>Cửa hàng</th>
                  <th>Tổng tiền</th>
                  <th>Trạng thái</th>
                  <th>Ngày</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(o => (
                  <tr key={o.id}>
                    <td><code className="order-code">{o.id}</code></td>
                    <td className="customer-cell">{o.customer}</td>
                    <td className="store-cell">{o.store ?? '—'}</td>
                    <td className="amount-cell">{formatNumber(o.amount)}đ</td>
                    <td>
                      <span className={`admin-status admin-status--${o.statusKey ?? o.status}`}>
                        {STATUS_LABELS[o.statusKey ?? o.status] ?? o.status}
                      </span>
                    </td>
                    <td className="date-cell">{new Date(o.date).toLocaleDateString('vi-VN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="admin-section">
          <div className="admin-section__header">
            <h3 className="admin-section__title">Top sản phẩm bán chạy</h3>
            <Link to="/admin/products" className="admin-dashboard__view-all">Xem tất cả →</Link>
          </div>
          <div className="admin-section__body" style={{ padding: '0' }}>
            {topProducts.map((p, i) => (
              <div key={p.id ?? i} className="admin-top-product">
                <span className="admin-top-product__rank">{i + 1}</span>
                <img src={p.img} alt={p.name} className="admin-top-product__img" loading="lazy" />
                <div className="admin-top-product__info">
                  <p className="admin-top-product__name">{p.name}</p>
                  <p className="admin-top-product__sold">{formatNumber(p.sold)} đã bán</p>
                </div>
                <div className="admin-top-product__revenue">{formatCurrency(p.revenue)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="admin-dashboard__quick-links">
        {[
          { label: 'Quản lý cửa hàng', href: '/admin/stores', icon: 'stores', count: stats?.totalStores ?? 0 },
          { label: 'Quản lý đơn hàng', href: '/admin/orders', icon: 'orders', count: stats?.totalOrders ?? 0 },
          { label: 'Quản lý khách hàng', href: '/admin/customers', icon: 'customers', count: stats?.totalCustomers ?? 0 },
          { label: 'Báo cáo tài chính', href: '/admin/finance', icon: 'finance', count: null },
          { label: 'Khuyến mãi', href: '/admin/promotions', icon: 'promo', count: stats?.totalPromotions ?? 0 },
          { label: 'Hỗ trợ', href: '/admin/support', icon: 'support', count: stats?.totalTickets ?? 0 },
        ].map((l, i) => (
          <Link key={i} to={l.href} className="admin-quick-link">
            <span className="admin-quick-link__label">{l.label}</span>
            {l.count !== null && <span className="admin-quick-link__count">{formatNumber(l.count)}</span>}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </Link>
        ))}
      </div>
    </div>
  );
};
