import { useState } from 'react';
import { useSeller } from '../../../contexts/SellerContext';
import './ShopReportsPage.css';

const formatVND = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);
const formatNum = (n: number) => new Intl.NumberFormat('vi-VN').format(n);

type ReportTab = 'revenue' | 'orders' | 'customers' | 'products';

export const ShopReportsPage = () => {
  const { monthlyData, orders } = useSeller();
  const [tab, setTab] = useState<ReportTab>('revenue');

  const totalRevenue = monthlyData.reduce((s, d) => s + d.revenue, 0);
  const totalOrders = monthlyData.reduce((s, d) => s + d.orders, 0);
  const totalCustomers = monthlyData.reduce((s, d) => s + d.customers, 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const productSales: Record<string, { name: string; sold: number; revenue: number }> = {};
  orders.forEach(o => {
    o.products.forEach(p => {
      if (!productSales[p.productId]) productSales[p.productId] = { name: p.productName, sold: 0, revenue: 0 };
      productSales[p.productId].sold += p.quantity;
      productSales[p.productId].revenue += p.totalPrice;
    });
  });
  const topProducts = Object.entries(productSales).sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 10);

  const maxRevenue = Math.max(...monthlyData.map(d => d.revenue), 1);
  const maxOrders = Math.max(...monthlyData.map(d => d.orders), 1);
  const maxCustomers = Math.max(...monthlyData.map(d => d.customers), 1);

  return (
    <div className="seller-reports admin-page">
      <div className="admin-page__header">
        <div>
          <h1 className="admin-page__title">Báo cáo doanh thu</h1>
          <p className="admin-page__subtitle">Phân tích hiệu quả kinh doanh</p>
        </div>
        <div className="seller-reports__export">
          <button className="btn btn-secondary btn-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Xuất Excel
          </button>
          <button className="btn btn-secondary btn-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            Xuất PDF
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="admin-stats admin-stats--4">
        <div className="seller-report-stat">
          <div className="seller-report-stat__icon" style={{ background: 'rgba(31,85,87,0.1)', color: '#1F5557' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <p className="seller-report-stat__label">Tổng doanh thu</p>
          <p className="seller-report-stat__value">{formatVND(totalRevenue)}</p>
        </div>
        <div className="seller-report-stat">
          <div className="seller-report-stat__icon" style={{ background: 'rgba(6,182,212,0.1)', color: '#2A6A85' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
          <p className="seller-report-stat__label">Tổng đơn hàng</p>
          <p className="seller-report-stat__value">{formatNum(totalOrders)}</p>
        </div>
        <div className="seller-report-stat">
          <div className="seller-report-stat__icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#2F7D52' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          </div>
          <p className="seller-report-stat__label">Tổng khách hàng</p>
          <p className="seller-report-stat__value">{formatNum(totalCustomers)}</p>
        </div>
        <div className="seller-report-stat">
          <div className="seller-report-stat__icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#A9741A' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <p className="seller-report-stat__label">Giá trị TB đơn</p>
          <p className="seller-report-stat__value">{formatVND(avgOrderValue)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="seller-tabs" style={{ borderBottom: '2px solid var(--color-border)', marginBottom: 20 }}>
        {(['revenue', 'orders', 'customers', 'products'] as ReportTab[]).map(t => (
          <button key={t} className={`seller-tab ${tab === t ? 'seller-tab--active' : ''}`} onClick={() => setTab(t)}>
            {{ revenue: 'Doanh thu', orders: 'Đơn hàng', customers: 'Khách hàng', products: 'Top sản phẩm' }[t]}
          </button>
        ))}
      </div>

      {/* Charts */}
      <div className="admin-section seller-reports__chart-section">
        <div className="seller-report-chart">
          {tab === 'revenue' && (
            <>
              <div className="seller-report-chart__header">
                <h3 className="seller-report-chart__title">Doanh thu theo tháng</h3>
                <span className="seller-report-chart__total">{formatVND(totalRevenue)}</span>
              </div>
              <div className="seller-bar-chart-lg">
                {monthlyData.map((d, i) => (
                  <div key={i} className="seller-bar-chart-lg__group">
                    <div className="seller-bar-chart-lg__bar-wrapper">
                      <div className="seller-bar-chart-lg__tooltip">{formatVND(d.revenue)}</div>
                      <div className="seller-bar-chart-lg__bar" style={{ height: `${(d.revenue / maxRevenue) * 100}%` }} />
                    </div>
                    <span className="seller-bar-chart-lg__label">{d.month}</span>
                  </div>
                ))}
              </div>
            </>
          )}
          {tab === 'orders' && (
            <>
              <div className="seller-report-chart__header">
                <h3 className="seller-report-chart__title">Số đơn hàng theo tháng</h3>
                <span className="seller-report-chart__total">{formatNum(totalOrders)} đơn</span>
              </div>
              <div className="seller-bar-chart-lg">
                {monthlyData.map((d, i) => (
                  <div key={i} className="seller-bar-chart-lg__group">
                    <div className="seller-bar-chart-lg__bar-wrapper">
                      <div className="seller-bar-chart-lg__tooltip">{formatNum(d.orders)} đơn</div>
                      <div className="seller-bar-chart-lg__bar" style={{ height: `${(d.orders / maxOrders) * 100}%`, background: 'linear-gradient(180deg, #2A6A85 0%, #0891B2 100%)' }} />
                    </div>
                    <span className="seller-bar-chart-lg__label">{d.month}</span>
                  </div>
                ))}
              </div>
            </>
          )}
          {tab === 'customers' && (
            <>
              <div className="seller-report-chart__header">
                <h3 className="seller-report-chart__title">Khách hàng mới theo tháng</h3>
                <span className="seller-report-chart__total">{formatNum(totalCustomers)} khách</span>
              </div>
              <div className="seller-bar-chart-lg">
                {monthlyData.map((d, i) => (
                  <div key={i} className="seller-bar-chart-lg__group">
                    <div className="seller-bar-chart-lg__bar-wrapper">
                      <div className="seller-bar-chart-lg__tooltip">{formatNum(d.customers)} khách</div>
                      <div className="seller-bar-chart-lg__bar" style={{ height: `${(d.customers / maxCustomers) * 100}%`, background: 'linear-gradient(180deg, #2F7D52 0%, #059669 100%)' }} />
                    </div>
                    <span className="seller-bar-chart-lg__label">{d.month}</span>
                  </div>
                ))}
              </div>
            </>
          )}
          {tab === 'products' && (
            <div className="seller-report-products">
              <h3 className="seller-report-chart__title" style={{ marginBottom: 16 }}>Top 10 sản phẩm doanh thu cao nhất</h3>
              {topProducts.map(([pid, p], i) => (
                <div key={pid} className="seller-report-product-row">
                  <span className="seller-report-product-row__rank">{i + 1}</span>
                  <span className="seller-report-product-row__name">{p.name}</span>
                  <span className="seller-report-product-row__sold">{formatNum(p.sold)} đã bán</span>
                  <span className="seller-report-product-row__revenue">{formatVND(p.revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Monthly Table */}
      <div className="admin-section">
        <div className="admin-section__header">
          <h3 className="admin-section__title">Báo cáo chi tiết theo tháng</h3>
        </div>
        <div className="seller-table-wrap">
          <table className="seller-table">
            <thead>
              <tr>
                <th>Tháng</th>
                <th>Doanh thu</th>
                <th>Số đơn</th>
                <th>Khách hàng</th>
                <th>Giá trị TB</th>
                <th>Tăng trưởng</th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.map((d, i) => {
                const prev = i > 0 ? monthlyData[i - 1].revenue : d.revenue;
                const growth = prev > 0 ? ((d.revenue - prev) / prev * 100) : 0;
                return (
                  <tr key={i}>
                    <td><strong>{d.month}/2024</strong></td>
                    <td><strong style={{ color: 'var(--color-primary)' }}>{formatVND(d.revenue)}</strong></td>
                    <td>{formatNum(d.orders)}</td>
                    <td>{formatNum(d.customers)}</td>
                    <td>{formatVND(d.orders > 0 ? d.revenue / d.orders : 0)}</td>
                    <td>
                      {i > 0 && (
                        <span className={`badge ${growth >= 0 ? 'badge-success' : 'badge-danger'}`}>
                          {growth >= 0 ? '↑' : '↓'} {Math.abs(growth).toFixed(1)}%
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
