import { useState } from 'react';
import { useSeller } from '../../../contexts/SellerContext';
import { useToast } from '../../../contexts/ToastContext/ToastContext';
import './ShopProfilePage.css';

const formatNum = (n: number) => new Intl.NumberFormat('vi-VN').format(n);

export const ShopProfilePage = () => {
  const { store } = useSeller();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: store.name,
    email: store.email,
    phone: store.phone,
    address: store.address,
    description: store.description,
    taxId: store.taxId,
    bankAccount: store.bankAccount,
    bankName: store.bankName,
  });
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [pwError, setPwError] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleChangePassword = () => {
    if (!pwForm.current) { setPwError('Vui lòng nhập mật khẩu hiện tại'); return; }
    if (pwForm.newPw.length < 6) { setPwError('Mật khẩu mới phải có ít nhất 6 ký tự'); return; }
    if (pwForm.newPw !== pwForm.confirm) { setPwError('Mật khẩu xác nhận không khớp'); return; }
    setPwError('');
    setPwForm({ current: '', newPw: '', confirm: '' });
    toast({ title: 'Đổi mật khẩu thành công!', message: 'Mật khẩu của bạn đã được cập nhật.', variant: 'success' });
  };

  return (
    <div className="seller-profile admin-page">
      <div className="admin-page__header">
        <div>
          <h1 className="admin-page__title">Hồ sơ cửa hàng</h1>
          <p className="admin-page__subtitle">Quản lý thông tin cửa hàng của bạn</p>
        </div>
        {saved && <span className="seller-profile__saved"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg> Đã lưu!</span>}
      </div>

      {}
      <div className="seller-profile__banner-section">
        <div className="seller-profile__banner">
          <img src={store.banner} alt="Banner" className="seller-profile__banner-img"
            onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=1200&h=300&fit=crop'; }} />
          <div className="seller-profile__banner-overlay">
            {editing && (
              <button className="btn btn-secondary btn-sm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                Đổi banner
              </button>
            )}
          </div>
        </div>
        <div className="seller-profile__avatar-row">
          <div className="seller-profile__avatar-wrap">
            <img src={store.avatar} alt={store.name} className="seller-profile__avatar"
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://api.dicebear.com/7.x/identicon/svg?seed=store'; }} />
            {editing && (
              <button className="seller-profile__avatar-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              </button>
            )}
          </div>
          <div className="seller-profile__store-info">
            <h2 className="seller-profile__store-name">
              {store.name}
              {store.isVerified && (
                <span className="seller-profile__verified">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#2F7D52" stroke="none"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01" stroke="#fff" strokeWidth="2" fill="none"/></svg>
                  Đã xác minh
                </span>
              )}
            </h2>
            <p className="seller-profile__store-desc">{store.description}</p>
            <div className="seller-profile__stats">
              <span><strong>{formatNum(store.productCount)}</strong> sản phẩm</span>
              <span><strong>{formatNum(store.orderCount)}</strong> đơn hàng</span>
              <span><strong>{formatNum(store.followerCount)}</strong> người theo dõi</span>
              <span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#A9741A" stroke="#A9741A" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                {store.rating}
              </span>
            </div>
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => setEditing(!editing)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            {editing ? 'Hủy' : 'Chỉnh sửa'}
          </button>
        </div>
      </div>

      {}
      <div className="seller-profile__content">
        <div className="admin-section">
          <div className="admin-section__header">
            <h3 className="admin-section__title">Thông tin cửa hàng</h3>
          </div>
          <div className="admin-section__body">
            <div className="admin-form">
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-form-label">Tên cửa hàng <span>*</span></label>
                  <input className="admin-form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} disabled={!editing} />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Email <span>*</span></label>
                  <input className="admin-form-input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} disabled={!editing} />
                </div>
              </div>
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-form-label">Số điện thoại <span>*</span></label>
                  <input className="admin-form-input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} disabled={!editing} />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Mã số thuế</label>
                  <input className="admin-form-input" value={form.taxId} onChange={e => setForm(f => ({ ...f, taxId: e.target.value }))} disabled={!editing} />
                </div>
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Địa chỉ cửa hàng</label>
                <input className="admin-form-input" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} disabled={!editing} />
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Mô tả cửa hàng</label>
                <textarea className="admin-form-textarea" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} disabled={!editing} />
              </div>
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-form-label">Số tài khoản</label>
                  <input className="admin-form-input" value={form.bankAccount} onChange={e => setForm(f => ({ ...f, bankAccount: e.target.value }))} disabled={!editing} />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Ngân hàng</label>
                  <input className="admin-form-input" value={form.bankName} onChange={e => setForm(f => ({ ...f, bankName: e.target.value }))} disabled={!editing} />
                </div>
              </div>
              {editing && (
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button className="btn btn-secondary" onClick={() => setEditing(false)}>Hủy</button>
                  <button className="btn btn-primary" onClick={handleSave}>Lưu thay đổi</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {}
        <div className="admin-section">
          <div className="admin-section__header">
            <h3 className="admin-section__title">Đổi mật khẩu</h3>
          </div>
          <div className="admin-section__body">
            <div className="admin-form">
              <div className="admin-form-group">
                <label className="admin-form-label">Mật khẩu hiện tại <span>*</span></label>
                <input type="password" className="admin-form-input" placeholder="Nhập mật khẩu hiện tại" value={pwForm.current} onChange={e => setPwForm(p => ({ ...p, current: e.target.value }))} />
              </div>
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-form-label">Mật khẩu mới <span>*</span></label>
                  <input type="password" className="admin-form-input" placeholder="Ít nhất 6 ký tự" value={pwForm.newPw} onChange={e => setPwForm(p => ({ ...p, newPw: e.target.value }))} />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Xác nhận mật khẩu mới <span>*</span></label>
                  <input type="password" className="admin-form-input" placeholder="Nhập lại mật khẩu mới" value={pwForm.confirm} onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))} />
                </div>
              </div>
              {pwError && <p className="seller-profile__pw-error">{pwError}</p>}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-primary" onClick={handleChangePassword}>Cập nhật mật khẩu</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
