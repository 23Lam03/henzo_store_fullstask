import { useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext/AuthContext';
import { authApi } from '../../../services/api/auth';
import { addressesApi, type Address } from '../../../services/api/support';
import { useToast } from '../../../contexts/ToastContext/ToastContext';
import './CustomerSettingsPage.css';

type Tab = 'profile' | 'password' | 'address';

const PROVINCES = [
  'TP. Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Cần Thơ', 'Hải Phòng',
  'Biên Hòa', 'Nha Trang', 'Huế', 'Quy Nhơn', 'Vũng Tàu',
  'Bắc Ninh', 'Thái Nguyên', 'Lào Cai', 'Nghệ An', 'Hà Tĩnh',
];

export const CustomerSettingsPage = () => {
  const { user, updateUser, refreshUser } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [saved, setSaved] = useState(false);

  // Profile form
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    gender: 'Nam',
    dob: '',
    bio: '',
  });
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});

  // Password form
  const [password, setPassword] = useState({ current: '', next: '', confirm: '' });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  // Address form
  const [address, setAddress] = useState({
    name: '',
    phone: '',
    street: '',
    ward: '',
    district: '',
    province: '',
    isDefault: true,
  });
  const [addressErrors, setAddressErrors] = useState<Record<string, string>>({});

  /** Nạp hồ sơ thật từ API. */
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const me = await authApi.me();
        if (cancelled) return;
        setProfile({
          name: me.name ?? '',
          email: me.email ?? '',
          phone: me.phone ?? '',
          gender: me.gender || 'Nam',
          dob: me.dob ? new Date(me.dob).toISOString().slice(0, 10) : '',
          bio: me.bio ?? '',
        });
      } catch (err) {
        console.error('Load profile failed:', err);
      }

      try {
        const list = await addressesApi.list();
        if (cancelled) return;
        const def = list.find(a => a.isDefault) ?? list[0];
        if (def) {
          setAddress({
            name: def.name,
            phone: def.phone,
            street: def.address ?? '',
            ward: def.ward ?? '',
            district: def.district ?? '',
            province: def.province ?? def.city ?? '',
            isDefault: def.isDefault,
          });
        }
      } catch (err) {
        console.error('Load addresses failed:', err);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const showSaved = (fn: () => void) => {
    fn();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const validateProfile = () => {
    const e: Record<string, string> = {};
    if (!profile.name.trim()) e.name = 'Vui lòng nhập họ tên';
    if (!profile.email.trim()) e.email = 'Vui lòng nhập email';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) e.email = 'Email không hợp lệ';
    if (!profile.phone.trim()) e.phone = 'Vui lòng nhập số điện thoại';
    return e;
  };

  const validatePassword = () => {
    const e: Record<string, string> = {};
    if (!password.current) e.current = 'Vui lòng nhập mật khẩu hiện tại';
    if (!password.next) e.next = 'Vui lòng nhập mật khẩu mới';
    else if (password.next.length < 6) e.next = 'Mật khẩu mới phải ít nhất 6 ký tự';
    if (password.next !== password.confirm) e.confirm = 'Xác nhận mật khẩu không khớp';
    return e;
  };

  const validateAddress = () => {
    const e: Record<string, string> = {};
    if (!address.name.trim()) e.name = 'Vui lòng nhập tên người nhận';
    if (!address.phone.trim()) e.phone = 'Vui lòng nhập số điện thoại';
    if (!address.street.trim()) e.street = 'Vui lòng nhập địa chỉ';
    if (!address.province) e.province = 'Vui lòng chọn tỉnh/thành phố';
    return e;
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const e2 = validateProfile();
    if (Object.keys(e2).length > 0) { setProfileErrors(e2); return; }
    setProfileErrors({});
    try {
      const updated = await authApi.updateProfile({
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        gender: profile.gender as 'Nam' | 'Nữ' | 'Khác',
        dob: profile.dob || undefined,
        bio: profile.bio,
      });
      updateUser(updated);
      await refreshUser();
      showSaved(() => {});
    } catch (err) {
      console.error('Update profile failed:', err);
      toast({
        title: 'Lưu thất bại',
        message: err instanceof Error ? err.message : 'Vui lòng thử lại.',
        variant: 'error',
      });
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const e2 = validatePassword();
    if (Object.keys(e2).length > 0) { setPasswordErrors(e2); return; }
    setPasswordErrors({});
    try {
      await authApi.changePassword({
        currentPassword: password.current,
        newPassword: password.next,
        confirmPassword: password.confirm,
      });
      setPassword({ current: '', next: '', confirm: '' });
      showSaved(() => {});
    } catch (err) {
      console.error('Change password failed:', err);
      toast({
        title: 'Đổi mật khẩu thất bại',
        message: err instanceof Error ? err.message : 'Vui lòng thử lại.',
        variant: 'error',
      });
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    const e2 = validateAddress();
    if (Object.keys(e2).length > 0) { setAddressErrors(e2); return; }
    setAddressErrors({});
    try {
      const list = await addressesApi.list();
      const existing = list.find(a => a.isDefault);
      const payload: Partial<Address> = {
        name: address.name,
        phone: address.phone,
        address: address.street,
        ward: address.ward,
        district: address.district,
        province: address.province,
        city: address.province,
        isDefault: address.isDefault,
      };
      if (existing) {
        await addressesApi.update(existing.id, payload);
      } else {
        await addressesApi.create({
          name: address.name,
          phone: address.phone,
          address: address.street,
          ward: address.ward,
          district: address.district,
          province: address.province,
          city: address.province,
          isDefault: address.isDefault,
        });
      }
      showSaved(() => {});
    } catch (err) {
      console.error('Save address failed:', err);
      toast({
        title: 'Lưu địa chỉ thất bại',
        message: err instanceof Error ? err.message : 'Vui lòng thử lại.',
        variant: 'error',
      });
    }
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'profile', label: 'Hồ sơ' },
    { id: 'password', label: 'Đổi mật khẩu' },
    { id: 'address', label: 'Địa chỉ' },
  ];

  return (
    <div className="settings-page">
      <div className="settings-page__header">
        <h1 className="settings-page__title">Cài đặt tài khoản</h1>
        <p className="settings-page__subtitle">Quản lý thông tin cá nhân, bảo mật và địa chỉ giao hàng</p>
      </div>

      {saved && (
        <div className="settings-save-toast">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Lưu thành công!
        </div>
      )}

      {/* Tabs */}
      <div className="settings-tabs">
        {tabs.map(t => (
          <button
            key={t.id}
            className={`settings-tab ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="settings-content">
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="settings-card card">
            <div className="settings-card__header">
              <h2 className="settings-card__title">Thông tin cá nhân</h2>
              <p className="settings-card__desc">Cập nhật thông tin hồ sơ của bạn</p>
            </div>
            <div className="settings-card__body">
              <form className="settings-form" onSubmit={handleSaveProfile} noValidate>
                <div className="settings-avatar-row">
                  <img
                    src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.email ?? 'customer')}`}
                    alt="Avatar"
                    className="settings-avatar"
                  />
                  <div>
                    <p className="settings-avatar-name">{profile.name}</p>
                    <button type="button" className="btn btn-sm btn-outline settings-avatar-btn">Đổi ảnh</button>
                  </div>
                </div>
                <div className="form-row-2">
                  <div className="input-group">
                    <label className="input-label">Họ và tên <span>*</span></label>
                    <input
                      type="text"
                      className={`input ${profileErrors.name ? 'input--error' : ''}`}
                      value={profile.name}
                      onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                      placeholder="Nhập họ và tên"
                    />
                    {profileErrors.name && <span className="input-error">{profileErrors.name}</span>}
                  </div>
                  <div className="input-group">
                    <label className="input-label">Số điện thoại</label>
                    <input
                      type="tel"
                      className={`input ${profileErrors.phone ? 'input--error' : ''}`}
                      value={profile.phone}
                      onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                      placeholder="0901 234 567"
                    />
                    {profileErrors.phone && <span className="input-error">{profileErrors.phone}</span>}
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Email <span>*</span></label>
                  <input
                    type="email"
                    className={`input ${profileErrors.email ? 'input--error' : ''}`}
                    value={profile.email}
                    onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                    placeholder="email@example.com"
                  />
                  {profileErrors.email && <span className="input-error">{profileErrors.email}</span>}
                </div>
                <div className="form-row-2">
                  <div className="input-group">
                    <label className="input-label">Giới tính</label>
                    <select className="input" value={profile.gender} onChange={e => setProfile(p => ({ ...p, gender: e.target.value }))}>
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                      <option value="Khác">Khác</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Ngày sinh</label>
                    <input type="date" className="input" value={profile.dob} onChange={e => setProfile(p => ({ ...p, dob: e.target.value }))} />
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Giới thiệu bản thân</label>
                  <textarea
                    className="input input-textarea"
                    rows={3}
                    value={profile.bio}
                    onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
                    placeholder="Chia sẻ một chút về bản thân bạn..."
                  />
                </div>
                <div className="settings-form__footer">
                  <button type="submit" className="btn btn-primary">Lưu thay đổi</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Password Tab */}
        {activeTab === 'password' && (
          <div className="settings-card card">
            <div className="settings-card__header">
              <h2 className="settings-card__title">Đổi mật khẩu</h2>
              <p className="settings-card__desc">Để bảo mật tài khoản, hãy sử dụng mật khẩu mạnh</p>
            </div>
            <div className="settings-card__body">
              <form className="settings-form" onSubmit={handleSavePassword} noValidate>
                <div className="input-group">
                  <label className="input-label">Mật khẩu hiện tại <span>*</span></label>
                  <input
                    type="password"
                    className={`input ${passwordErrors.current ? 'input--error' : ''}`}
                    value={password.current}
                    onChange={e => setPassword(p => ({ ...p, current: e.target.value }))}
                    placeholder="Nhập mật khẩu hiện tại"
                    autoComplete="current-password"
                  />
                  {passwordErrors.current && <span className="input-error">{passwordErrors.current}</span>}
                </div>
                <div className="input-group">
                  <label className="input-label">Mật khẩu mới <span>*</span></label>
                  <input
                    type="password"
                    className={`input ${passwordErrors.next ? 'input--error' : ''}`}
                    value={password.next}
                    onChange={e => setPassword(p => ({ ...p, next: e.target.value }))}
                    placeholder="Ít nhất 6 ký tự"
                    autoComplete="new-password"
                  />
                  {passwordErrors.next && <span className="input-error">{passwordErrors.next}</span>}
                </div>
                <div className="input-group">
                  <label className="input-label">Xác nhận mật khẩu mới <span>*</span></label>
                  <input
                    type="password"
                    className={`input ${passwordErrors.confirm ? 'input--error' : ''}`}
                    value={password.confirm}
                    onChange={e => setPassword(p => ({ ...p, confirm: e.target.value }))}
                    placeholder="Nhập lại mật khẩu mới"
                    autoComplete="new-password"
                  />
                  {passwordErrors.confirm && <span className="input-error">{passwordErrors.confirm}</span>}
                </div>

                <div className="settings-password-rules">
                  <p className="settings-password-rules__title">Mật khẩu mạnh cần có:</p>
                  <ul>
                    <li className={password.next.length >= 6 ? 'ok' : ''}>Ít nhất 6 ký tự</li>
                    <li className={/[A-Z]/.test(password.next) ? 'ok' : ''}>Ít nhất 1 chữ hoa</li>
                    <li className={/[0-9]/.test(password.next) ? 'ok' : ''}>Ít nhất 1 chữ số</li>
                  </ul>
                </div>

                <div className="settings-form__footer">
                  <button type="submit" className="btn btn-primary">Cập nhật mật khẩu</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Address Tab */}
        {activeTab === 'address' && (
          <div className="settings-card card">
            <div className="settings-card__header">
              <h2 className="settings-card__title">Địa chỉ giao hàng</h2>
              <p className="settings-card__desc">Quản lý địa chỉ nhận hàng mặc định</p>
            </div>
            <div className="settings-card__body">
              <form className="settings-form" onSubmit={handleSaveAddress} noValidate>
                <div className="form-row-2">
                  <div className="input-group">
                    <label className="input-label">Tên người nhận <span>*</span></label>
                    <input
                      type="text"
                      className={`input ${addressErrors.name ? 'input--error' : ''}`}
                      value={address.name}
                      onChange={e => setAddress(a => ({ ...a, name: e.target.value }))}
                      placeholder="Họ và tên"
                    />
                    {addressErrors.name && <span className="input-error">{addressErrors.name}</span>}
                  </div>
                  <div className="input-group">
                    <label className="input-label">Số điện thoại <span>*</span></label>
                    <input
                      type="tel"
                      className={`input ${addressErrors.phone ? 'input--error' : ''}`}
                      value={address.phone}
                      onChange={e => setAddress(a => ({ ...a, phone: e.target.value }))}
                      placeholder="0901 234 567"
                    />
                    {addressErrors.phone && <span className="input-error">{addressErrors.phone}</span>}
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Địa chỉ cụ thể <span>*</span></label>
                  <input
                    type="text"
                    className={`input ${addressErrors.street ? 'input--error' : ''}`}
                    value={address.street}
                    onChange={e => setAddress(a => ({ ...a, street: e.target.value }))}
                    placeholder="Số nhà, tên đường"
                  />
                  {addressErrors.street && <span className="input-error">{addressErrors.street}</span>}
                </div>
                <div className="form-row-2">
                  <div className="input-group">
                    <label className="input-label">Phường / Xã</label>
                    <input type="text" className="input" value={address.ward}
                      onChange={e => setAddress(a => ({ ...a, ward: e.target.value }))}
                      placeholder="Phường Bến Thành"
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Quận / Huyện</label>
                    <input type="text" className="input" value={address.district}
                      onChange={e => setAddress(a => ({ ...a, district: e.target.value }))}
                      placeholder="Quận 1"
                    />
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Tỉnh / Thành phố <span>*</span></label>
                  <select
                    className={`input ${addressErrors.province ? 'input--error' : ''}`}
                    value={address.province}
                    onChange={e => setAddress(a => ({ ...a, province: e.target.value }))}
                  >
                    <option value="">-- Chọn tỉnh/thành phố --</option>
                    {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  {addressErrors.province && <span className="input-error">{addressErrors.province}</span>}
                </div>

                <label className="settings-default-checkbox">
                  <input
                    type="checkbox"
                    checked={address.isDefault}
                    onChange={e => setAddress(a => ({ ...a, isDefault: e.target.checked }))}
                  />
                  <span>Đặt làm địa chỉ giao hàng mặc định</span>
                </label>

                <div className="settings-form__footer">
                  <button type="submit" className="btn btn-primary">Lưu địa chỉ</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
