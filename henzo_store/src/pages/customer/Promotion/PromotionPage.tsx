import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { catalogApi, type Voucher } from '../../../services/api/catalog';
import { useAuth } from '../../../contexts/AuthContext';
import { Pagination } from '../../../components/product/Pagination/Pagination';
import type { Promotion } from '../../../types';
import './PromotionPage.css';

const fmt = (p: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(p);

export const PromotionPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [saved, setSaved] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [promoTotal, setPromoTotal] = useState(0);
  const [voucherTotal, setVoucherTotal] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const data = await catalogApi.promotions({ page, pageSize: 24 });
        if (cancelled) return;
        setPromotions(data.promotions ?? []);
        setVouchers(data.vouchers ?? []);
        setTotalPages(data.totalPages ?? 1);
        setPromoTotal(data.promoTotal ?? data.promotions.length);
        setVoucherTotal(data.voucherTotal ?? data.vouchers.length);
      } catch (err) {
        console.error('Load promotions failed:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [page]);

  const toggleSave = (id: string) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setSaved(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div className="promotion-page">
      <div className="container">
        <h1 className="promotion-page__title">Khuyến mãi & Voucher</h1>
        <p className="promotion-page__subtitle">
          {promoTotal} chương trình khuyến mãi đang diễn ra
          {voucherTotal > 0 ? ` và ${voucherTotal} voucher dành riêng cho bạn` : ''}
        </p>

        <section className="promo-section">
          <h2 className="promo-section__title">Voucher của bạn</h2>
          {vouchers.length === 0 && !loading ? (
            <p className="promo-section__empty">Hiện chưa có voucher nào đang hiệu lực.</p>
          ) : (
            <div className="voucher-grid">
              {vouchers.map(v => (
                <div key={v.id} className={`voucher-card ${saved.includes(v.id) ? 'saved' : ''}`}>
                  <div className="voucher-card__left">
                    <div className="voucher-card__icon">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M21 5H3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z"/>
                        <path d="M1 10h22"/>
                      </svg>
                    </div>
                    <div className="voucher-card__value">
                      {v.discountType === 'percent' ? (
                        <><span>{v.discountValue}%</span></>
                      ) : v.discountType === 'shipping' ? (
                        <><span>Miễn phí</span><small>Ship</small></>
                      ) : (
                        <><span>{fmt(v.discountValue)}</span></>
                      )}
                    </div>
                  </div>
                  <div className="voucher-card__right">
                    <span className="voucher-card__code">{v.code}</span>
                    <span className="voucher-card__desc">{v.desc || v.description}</span>
                    <span className="voucher-card__min">
                      Đơn tối thiểu: {v.minOrderValue === 0 ? 'Không giới hạn' : fmt(v.minOrderValue)}
                    </span>
                    <span className="voucher-card__exp">Hết hạn: {v.exp}</span>
                    <button className="btn btn-primary btn-sm" onClick={() => toggleSave(v.id)}>
                      {saved.includes(v.id) ? 'Đã lưu' : 'Lưu Voucher'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="promo-section">
          <h2 className="promo-section__title">Khuyến mãi đang diễn ra</h2>
          {promotions.length === 0 && !loading ? (
            <p className="promo-section__empty">Hiện chưa có chương trình khuyến mãi nào.</p>
          ) : (
            <div className="promo-grid">
              {promotions.map(p => (
                <div key={p.id} className="promo-card card">
                  <div className="promo-card__image">
                    <img src={p.image} alt={p.title} loading="lazy" />
                    <span className="promo-card__badge">-{p.discount}%</span>
                  </div>
                  <div className="promo-card__content">
                    <h3>{p.title}</h3>
                    <p>{p.description}</p>
                    <Link to="/products" className="btn btn-primary btn-sm">Xem sản phẩm</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {totalPages > 1 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        )}
      </div>
    </div>
  );
};
