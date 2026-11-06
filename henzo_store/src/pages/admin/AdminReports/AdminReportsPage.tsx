import { useState, useEffect, useMemo } from 'react';
import { useAdmin } from '../../../contexts/AdminContext';
import { adminApi } from '../../../services/api/admin';
import { formatNumber } from '../../../utils';
import './AdminReportsPage.css';

const handleExportExcel = () => { window.print(); };
const handleExportPDF = () => { window.print(); };

interface ReportsData {
  totalRevenue: number;
  totalOrders: number;
  monthly: { month: string; revenue: number; orders: number; avgPerOrder: number }[];
  topProducts: { id: string; name: string; brand: string; images: string[]; sold: number; revenue: number }[];
  topStores: { id: string; name: string; revenue: number; orders: number }[];
}

export const AdminReportsPage = () => {
  const { stats } = useAdmin();
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = (await adminApi.reports()) as unknown as ReportsData;
        if (!cancelled) setData(res);
      } catch (err) {
        console.error('Load admin reports failed:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const monthly = useMemo(() => data?.monthly ?? [], [data]);
  const maxRev = useMemo(
    () => Math.max(1, ...monthly.map(m => m.revenue)),
    [monthly],
  );
  const totalRev = data?.totalRevenue ?? 0;
  const topProducts = data?.topProducts ?? [];
  const topStores = data?.topStores ?? [];

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <div>
          <h1 className="admin-page__title">Báo Cáo Hệ Thống</h1>
          <p className="admin-page__subtitle">Thống kê và báo cáo toàn diện về hoạt động của hệ thống</p>
        </div>
        <div className="admin-page-header__actions">
          <button className="btn btn-outline" onClick={() => handleExportExcel()}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Xuất Excel
          </button>
          <button className="btn btn-primary" onClick={() => handleExportPDF()}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            Xuất PDF
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="admin-stats admin-stats--4">
        {[
          { label: 'Tổng doanh thu', value: formatNumber(stats.totalRevenue) + 'đ', change: '+15.2%', dir: 'up', icon: 'revenue', color: '#1F5557' },
          { label: 'Tổng đơn hàng', value: formatNumber(stats.totalOrders), change: '+12.8%', dir: 'up', icon: 'orders', color: '#2A6A85' },
          { label: 'Tổng khách hàng', value: formatNumber(stats.totalCustomers), change: '+5.7%', dir: 'up', icon: 'customers', color: '#2F7D52' },
          { label: 'Tổng cửa hàng', value: formatNumber(stats.totalStores), change: '+3.2%', dir: 'up', icon: 'stores', color: '#A9741A' },
        ].map((s, i) => (
          <div key={i} className="admin-stat-card">
            <div className="admin-stat-card__icon" style={{ background: `${s.color}15`, color: s.color }}>
              {s.icon === 'revenue' && <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
              {s.icon === 'orders' && <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>}
              {s.icon === 'customers' && <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>}
              {s.icon === 'stores' && <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>}
            </div>
            <div className="admin-stat-card__info">
              <p className="admin-stat-card__label">{s.label}</p>
              <p className="admin-stat-card__value">{s.value}</p>
              <span className={`admin-stat-card__change admin-stat-card__change--${s.dir}`}>{s.change}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="admin-section">
        <div className="admin-section__header">
          <h3 className="admin-section__title">Doanh thu theo tháng (VNĐ)</h3>
          <div className="report-chart-total">
            Tổng: <strong>{formatNumber(totalRev)}đ</strong>
          </div>
        </div>
        <div className="admin-section__body">
          {loading ? (
            <div className="spinner spinner-lg" />
          ) : (
            <div className="admin-chart">
              {monthly.map((m, i) => (
                <div key={i} className="admin-chart__bar-group">
                  <div className="admin-chart__bar-wrapper">
                    <div className="admin-chart__bar" style={{ height: `${(m.revenue / maxRev) * 100}%` }}>
                      <span className="admin-chart__bar-value">
                        {m.revenue >= 1e9 ? `${(m.revenue / 1e9).toFixed(1)}B` : `${(m.revenue / 1e6).toFixed(0)}M`}
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

      {/* Orders + Revenue Table */}
      <div className="admin-section">
        <div className="admin-section__header">
          <h3 className="admin-section__title">Thống kê đơn hàng theo tháng</h3>
        </div>
        <div className="admin-section__body" style={{ padding: 0 }}>
          <table className="report-table">
            <thead>
              <tr>
                <th>Tháng</th>
                <th>Doanh thu</th>
                <th>Đơn hàng</th>
                <th>TB/Đơn hàng</th>
              </tr>
            </thead>
            <tbody>
              {monthly.map((m, i) => (
                <tr key={i}>
                  <td><strong>{m.month}</strong></td>
                  <td className="report-revenue">{formatNumber(m.revenue)}đ</td>
                  <td>{formatNumber(m.orders)}</td>
                  <td>{formatNumber(m.avgPerOrder)}đ</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Products + Stores */}
      <div className="admin-reports-grid">
        <div className="admin-section">
          <div className="admin-section__header">
            <h3 className="admin-section__title">Top sản phẩm bán chạy</h3>
          </div>
          <div className="admin-section__body" style={{ padding: 0 }}>
            {topProducts.map((p, i) => (
              <div key={p.id ?? i} className="report-top-item">
                <span className="report-top-rank">{i + 1}</span>
                <img src={p.images?.[0]} alt={p.name} className="report-top-img" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/48x44/cccccc/999999?text=No+Image'; }} />
                <div className="report-top-info">
                  <p className="report-top-name">{p.name}</p>
                  <p className="report-top-sub">{p.brand} · {formatNumber(p.sold)} đã bán</p>
                </div>
                <span className="report-top-revenue">{formatNumber(p.revenue)}đ</span>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-section">
          <div className="admin-section__header">
            <h3 className="admin-section__title">Top cửa hàng</h3>
          </div>
          <div className="admin-section__body" style={{ padding: 0 }}>
            {topStores.map((s, i) => (
              <div key={s.id ?? i} className="report-top-item">
                <span className="report-top-rank">{i + 1}</span>
                <div className="report-top-info">
                  <p className="report-top-name">{s.name}</p>
                  <p className="report-top-sub">{formatNumber(s.orders)} đơn hàng</p>
                </div>
                <span className="report-top-revenue">{formatNumber(s.revenue)}đ</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
