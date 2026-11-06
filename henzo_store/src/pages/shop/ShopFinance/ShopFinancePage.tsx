import { useState } from 'react';
import { useSeller } from '../../../contexts/SellerContext';
import { PLATFORM_FEE_LABEL, PLATFORM_FEE_RATE } from '../../../constants';
import './ShopFinancePage.css';

const formatVND = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);
const formatNum = (n: number) => new Intl.NumberFormat('vi-VN').format(n);

type Period = 'today' | 'week' | 'month' | 'year';

export const ShopFinancePage = () => {
  const { monthlyData, payments } = useSeller();
  const [period, setPeriod] = useState<Period>('month');

  const successPayments = payments.filter(p => p.status === 'success');
  const refundedPayments = payments.filter(p => p.status === 'refunded');

  const totalRevenue = successPayments.reduce((s, p) => s + p.amount, 0);
  const totalPlatformFee = successPayments.reduce((s, p) => s + p.platformFee, 0);
  const totalRefund = refundedPayments.reduce((s, p) => s + p.amount, 0);
  const netRevenue = totalRevenue - totalRefund;
  const avgOrderValue = successPayments.length > 0 ? totalRevenue / successPayments.length : 0;
  const profit = netRevenue - totalPlatformFee;

  const maxRevenue = Math.max(...monthlyData.map(d => d.revenue), 1);

  return (
    <div className="seller-finance admin-page">
      <div className="admin-page__header">
        <div>
          <h1 className="admin-page__title">Quản lý tài chính</h1>
          <p className="admin-page__subtitle">Theo dõi doanh thu, chi phí và lợi nhuận</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Xuất Excel
          </button>
          <button className="btn btn-secondary btn-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            Xuất PDF
          </button>
        </div>
      </div>

      {/* Period Tabs */}
      <div className="seller-finance__period-tabs">
        {(['today', 'week', 'month', 'year'] as Period[]).map(p => (
          <button key={p} className={`seller-period-btn ${period === p ? 'seller-period-btn--active' : ''}`} onClick={() => setPeriod(p)}>
            {{ today: 'Hôm nay', week: 'Tuần này', month: 'Tháng này', year: 'Năm nay' }[p]}
          </button>
        ))}
      </div>

      {/* Finance Stats */}
      <div className="admin-stats admin-stats--3">
        <div className="seller-finance-stat seller-finance-stat--primary">
          <div className="seller-finance-stat__icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <div className="seller-finance-stat__content">
            <p className="seller-finance-stat__label">Tổng doanh thu</p>
            <p className="seller-finance-stat__value">{formatVND(totalRevenue)}</p>
          </div>
        </div>
        <div className="seller-finance-stat">
          <div className="seller-finance-stat__icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#A9741A' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>
          </div>
          <div className="seller-finance-stat__content">
            <p className="seller-finance-stat__label">Tổng phí sàn ({PLATFORM_FEE_LABEL})</p>
            <p className="seller-finance-stat__value" style={{ color: 'var(--color-warning)' }}>-{formatVND(totalPlatformFee)}</p>
          </div>
        </div>
        <div className="seller-finance-stat">
          <div className="seller-finance-stat__icon" style={{ background: 'rgba(239,68,68,0.1)', color: '#B4322F' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 11 12 7.5 15.5 2 10"/></svg>
          </div>
          <div className="seller-finance-stat__content">
            <p className="seller-finance-stat__label">Hoàn tiền</p>
            <p className="seller-finance-stat__value" style={{ color: 'var(--color-danger)' }}>-{formatVND(totalRefund)}</p>
          </div>
        </div>
      </div>

      <div className="admin-stats admin-stats--3">
        <div className="seller-finance-stat seller-finance-stat--success">
          <div className="seller-finance-stat__icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div className="seller-finance-stat__content">
            <p className="seller-finance-stat__label">Lợi nhuận ròng</p>
            <p className="seller-finance-stat__value">{formatVND(profit)}</p>
          </div>
        </div>
        <div className="seller-finance-stat">
          <div className="seller-finance-stat__icon" style={{ background: 'rgba(6,182,212,0.1)', color: '#2A6A85' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
          <div className="seller-finance-stat__content">
            <p className="seller-finance-stat__label">Tổng đơn hàng</p>
            <p className="seller-finance-stat__value">{formatNum(successPayments.length)}</p>
          </div>
        </div>
        <div className="seller-finance-stat">
          <div className="seller-finance-stat__icon" style={{ background: 'rgba(139,92,246,0.1)', color: '#1A4345' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <div className="seller-finance-stat__content">
            <p className="seller-finance-stat__label">Giá trị TB đơn hàng</p>
            <p className="seller-finance-stat__value">{formatVND(avgOrderValue)}</p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="admin-section seller-finance__chart-section">
        <div className="seller-finance-chart">
          <div className="seller-finance-chart__header">
            <h3 className="seller-finance-chart__title">Doanh thu theo tháng</h3>
            <div className="seller-finance-chart__legend">
              <span className="seller-finance-chart__legend-item">
                <span className="seller-finance-chart__legend-dot" style={{ background: 'var(--gradient-primary)' }} />
                Doanh thu
              </span>
            </div>
          </div>
          <div className="seller-finance-bar-chart">
            {monthlyData.map((d, i) => (
              <div key={i} className="seller-finance-bar-chart__group">
                <div className="seller-finance-bar-chart__bar-wrapper">
                  <div className="seller-finance-bar-chart__tooltip">{formatVND(d.revenue)}</div>
                  <div className="seller-finance-bar-chart__bar" style={{ height: `${(d.revenue / maxRevenue) * 100}%` }} />
                </div>
                <span className="seller-finance-bar-chart__label">{d.month}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Breakdown */}
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
                <th>Phí sàn</th>
                <th>Hoàn tiền</th>
                <th>Thu nhập ròng</th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.map((d, i) => {
                const fee = Math.floor(d.revenue * PLATFORM_FEE_RATE);
                const refund = Math.floor(d.revenue * 0.02);
                const net = d.revenue - fee - refund;
                return (
                  <tr key={i}>
                    <td><strong>{d.month}/2024</strong></td>
                    <td><strong style={{ color: 'var(--color-primary)' }}>{formatVND(d.revenue)}</strong></td>
                    <td>{formatNum(d.orders)}</td>
                    <td style={{ color: 'var(--color-warning)' }}>-{formatVND(fee)}</td>
                    <td style={{ color: 'var(--color-danger)' }}>-{formatVND(refund)}</td>
                    <td><strong style={{ color: 'var(--color-success)' }}>{formatVND(net)}</strong></td>
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
