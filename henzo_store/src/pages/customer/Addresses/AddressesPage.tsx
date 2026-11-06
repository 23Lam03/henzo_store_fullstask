import { useCallback, useEffect, useMemo, useState } from 'react';
import { addressesApi, type Address } from '../../../services/api/support';
import {
  locationsApi,
  type District,
  type Province,
  type Ward,
} from '../../../services/api/locations';
import { useToast } from '../../../contexts/ToastContext/ToastContext';
import './AddressesPage.css';

const EMPTY_FORM = {
  label: '',
  name: '',
  phone: '',
  address: '',
  city: '',
  district: '',
  ward: '',
  isDefault: false,
};

export const AddressesPage = () => {
  const toast = useToast();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Address, 'id' | 'province'>>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Danh sách hành chính lấy từ API (63 tỉnh + 705 huyện + 10.599 xã).
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [provinceCode, setProvinceCode] = useState('');
  const [districtCode, setDistrictCode] = useState('');
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  useEffect(() => {
    let cancelled = false;
    locationsApi
      .provinces()
      .then(list => {
        if (cancelled) return;
        setProvinces(list);
        // Điền tỉnh đang chọn (khi sửa địa chỉ cũ).
        const current = form.city.trim();
        if (!current) return;
        const hit = list.find(
          p =>
            p.name.toLowerCase() === current.toLowerCase() ||
            current.toLowerCase().includes(p.name.toLowerCase()),
        );
        if (hit) setProvinceCode(hit.code);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!provinceCode) {
      setDistricts([]);
      return;
    }
    let cancelled = false;
    setLoadingDistricts(true);
    locationsApi
      .districts(provinceCode)
      .then(list => {
        if (!cancelled) setDistricts(list);
      })
      .catch(() => {
        if (!cancelled) setDistricts([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingDistricts(false);
      });
    return () => {
      cancelled = true;
    };
  }, [provinceCode]);

  // Nạp phường/xã khi đổi quận/huyện.
  useEffect(() => {
    if (!districtCode) {
      setWards([]);
      return;
    }
    let cancelled = false;
    setLoadingWards(true);
    locationsApi
      .wardsOfDistrict(districtCode)
      .then(list => {
        if (!cancelled) setWards(list);
      })
      .catch(() => {
        if (!cancelled) setWards([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingWards(false);
      });
    return () => {
      cancelled = true;
    };
  }, [districtCode]);

  // Khi danh sách quận/huyện nạp xong, khớp lại mã quận theo tên đang lưu
  // (dùng khi sửa địa chỉ cũ) để nạp tiếp danh sách phường/xã.
  useEffect(() => {
    if (!form.district || districtCode) return;
    const hit = districts.find(d => d.name === form.district);
    if (hit) setDistrictCode(hit.code);
  }, [districts, form.district, districtCode]);

  /** Tỉnh đang chọn (tên) — dùng để gửi lên backend. */
  const provinceName = useMemo(
    () => provinces.find(p => p.code === provinceCode)?.name ?? form.city,
    [provinces, provinceCode, form.city],
  );

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.label.trim()) e.label = 'Vui lòng nhập nhãn (VD: Nhà riêng)';
    if (!form.name.trim()) e.name = 'Vui lòng nhập họ tên';
    if (!form.phone.trim()) e.phone = 'Vui lòng nhập số điện thoại';
    else if (!/^[0-9]{10,11}$/.test(form.phone.replace(/\s/g, ''))) e.phone = 'Số điện thoại không hợp lệ';
    if (!form.address.trim()) e.address = 'Vui lòng nhập địa chỉ';
    if (!provinceCode) e.city = 'Vui lòng chọn tỉnh/thành phố';
    if (!form.district.trim()) e.district = 'Vui lòng chọn quận/huyện';
    if (!form.ward.trim()) e.ward = 'Vui lòng chọn phường/xã';
    return e;
  };

  /** Tải danh sách địa chỉ từ API. */
  const loadAddresses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await addressesApi.list();
      setAddresses(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Load addresses failed:', err);
      toast({
        title: 'Không tải được địa chỉ',
        message: err instanceof Error ? err.message : 'Vui lòng thử lại.',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadAddresses();
  }, [loadAddresses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length > 0) { setErrors(e2); return; }
    try {
      // Gửi TÊN tỉnh (backend lưu snapshot địa chỉ dạng chữ).
      const payload = { ...form, city: provinceName || form.city };
      if (editingId) {
        await addressesApi.update(editingId, payload);
        toast({ title: 'Cập nhật thành công', message: 'Địa chỉ đã được cập nhật.', variant: 'success' });
        setEditingId(null);
      } else {
        await addressesApi.create(payload);
        toast({ title: 'Thêm thành công', message: 'Địa chỉ mới đã được lưu.', variant: 'success' });
      }
      setShowForm(false);
      setForm(EMPTY_FORM);
      setErrors({});
      setProvinceCode('');
      setDistrictCode('');
      await loadAddresses();
    } catch (err) {
      console.error('Save address failed:', err);
      toast({
        title: 'Lưu thất bại',
        message: err instanceof Error ? err.message : 'Vui lòng thử lại.',
        variant: 'error',
      });
    }
  };

  const handleEdit = (addr: Address) => {
    setForm({
      label: addr.label ?? '',
      name: addr.name,
      phone: addr.phone,
      address: addr.address ?? '',
      city: addr.city ?? '',
      district: addr.district ?? '',
      ward: addr.ward ?? '',
      isDefault: addr.isDefault,
    });
    // Tìm mã tỉnh tương ứng để nạp đúng danh sách quận/huyện.
    const hit = provinces.find(
      p =>
        p.name.toLowerCase() === (addr.city ?? '').toLowerCase() ||
        (addr.city ?? '').toLowerCase().includes(p.name.toLowerCase()),
    );
    setProvinceCode(hit?.code ?? '');
    setEditingId(addr.id);
    setShowForm(true);
    setErrors({});
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa địa chỉ này?')) return;
    try {
      await addressesApi.remove(id);
      toast({ title: 'Đã xóa', message: 'Địa chỉ đã được xóa.', variant: 'success' });
      await loadAddresses();
    } catch (err) {
      console.error('Delete address failed:', err);
      toast({
        title: 'Xóa thất bại',
        message: err instanceof Error ? err.message : 'Vui lòng thử lại.',
        variant: 'error',
      });
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await addressesApi.update(id, { isDefault: true });
      toast({ title: 'Đã đặt mặc định', message: 'Địa chỉ mặc định đã được cập nhật.', variant: 'success' });
      await loadAddresses();
    } catch (err) {
      console.error('Set default address failed:', err);
      toast({
        title: 'Cập nhật thất bại',
        message: err instanceof Error ? err.message : 'Vui lòng thử lại.',
        variant: 'error',
      });
    }
  };

  return (
    <div className="addresses-page container">
      <div className="page-header">
        <div>
          <h1 className="page-header__title">Địa chỉ giao hàng</h1>
          <p className="page-header__subtitle">Quản lý danh sách địa chỉ nhận hàng của bạn</p>
        </div>
        {!showForm && (
          <button className="btn btn-primary" onClick={() => { setShowForm(true); setEditingId(null); setForm(EMPTY_FORM); setErrors({}); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Thêm địa chỉ
          </button>
        )}
      </div>

      {showForm && (
        <div className="card addresses-form-card">
          <h3 className="card-header__title">{editingId ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới'}</h3>
          <form className="addresses-form" onSubmit={handleSubmit} noValidate>
            <div className="form-row-2">
              <div className="input-group">
                <label className="input-label">Nhãn <span>*</span></label>
                <input type="text" className={`input ${errors.label ? 'input--error' : ''}`} placeholder="VD: Nhà riêng, Văn phòng" value={form.label} onChange={e => setForm(p => ({ ...p, label: e.target.value }))} />
                {errors.label && <span className="input-error">{errors.label}</span>}
              </div>
              <div className="input-group">
                <label className="input-label">Họ tên <span>*</span></label>
                <input type="text" className={`input ${errors.name ? 'input--error' : ''}`} placeholder="Họ và tên người nhận" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                {errors.name && <span className="input-error">{errors.name}</span>}
              </div>
            </div>
            <div className="form-row-2">
              <div className="input-group">
                <label className="input-label">Số điện thoại <span>*</span></label>
                <input type="tel" className={`input ${errors.phone ? 'input--error' : ''}`} placeholder="0901 234 567" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
                {errors.phone && <span className="input-error">{errors.phone}</span>}
              </div>
              <div className="input-group">
                <label className="input-label">Tỉnh/Thành phố <span>*</span></label>
                <select
                  className={`input ${errors.city ? 'input--error' : ''}`}
                  value={provinceCode}
                  onChange={e => {
                    setProvinceCode(e.target.value);
                    setDistrictCode('');
                    setForm(p => ({ ...p, city: '', district: '', ward: '' }));
                  }}
                >
                  <option value="">Chọn tỉnh/thành phố</option>
                  {provinces.map(p => (
                    <option key={p.code} value={p.code}>
                      {p.name}
                    </option>
                  ))}
                </select>
                {errors.city && <span className="input-error">{errors.city}</span>}
              </div>
            </div>
            <div className="form-row-2">
              <div className="input-group">
                <label className="input-label">Quận/Huyện <span>*</span></label>
                <select
                  className={`input ${errors.district ? 'input--error' : ''}`}
                  value={districtCode}
                  disabled={!provinceCode || loadingDistricts}
                  onChange={e => {
                    setDistrictCode(e.target.value);
                    const picked = districts.find(d => d.code === e.target.value);
                    setForm(p => ({
                      ...p,
                      district: picked?.name ?? '',
                      ward: '',
                    }));
                  }}
                >
                  <option value="">
                    {!provinceCode
                      ? 'Chọn tỉnh/thành phố trước'
                      : loadingDistricts
                        ? 'Đang tải quận/huyện…'
                        : 'Chọn quận/huyện'}
                  </option>
                  {districts.map(d => (
                    <option key={d.code} value={d.code}>
                      {d.name}
                    </option>
                  ))}
                </select>
                {errors.district && <span className="input-error">{errors.district}</span>}
              </div>
              <div className="input-group">
                <label className="input-label">Phường/Xã <span>*</span></label>
                <select
                  className={`input ${errors.ward ? 'input--error' : ''}`}
                  value={form.ward}
                  disabled={!districtCode || loadingWards}
                  onChange={e => setForm(p => ({ ...p, ward: e.target.value }))}
                >
                  <option value="">
                    {!districtCode
                      ? 'Chọn quận/huyện trước'
                      : loadingWards
                        ? 'Đang tải phường/xã…'
                        : 'Chọn phường/xã'}
                  </option>
                  {wards.map(w => (
                    <option key={w.code} value={w.name}>
                      {w.name}
                    </option>
                  ))}
                </select>
                {errors.ward && <span className="input-error">{errors.ward}</span>}
              </div>
            </div>
            <div className="form-row-2">
              <div className="input-group">
                <label className="input-label">Địa chỉ cụ thể <span>*</span></label>
                <input type="text" className={`input ${errors.address ? 'input--error' : ''}`} placeholder="Số nhà, đường, phường/xã" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
                {errors.address && <span className="input-error">{errors.address}</span>}
              </div>
            </div>
            <label className="addresses-form__default">
              <input type="checkbox" checked={form.isDefault} onChange={e => setForm(p => ({ ...p, isDefault: e.target.checked }))} />
              Đặt làm địa chỉ mặc định
            </label>
            <div className="addresses-form__actions">
              <button type="submit" className="btn btn-primary">{editingId ? 'Lưu thay đổi' : 'Thêm địa chỉ'}</button>
              <button type="button" className="btn btn-outline" onClick={() => { setShowForm(false); setEditingId(null); setErrors({}); }}>Hủy</button>
            </div>
          </form>
        </div>
      )}

      <div className="addresses-list">
        {addresses.length === 0 && !showForm && !loading && (
          <div className="addresses-empty card">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            <p>Chưa có địa chỉ nào. Thêm địa chỉ giao hàng đầu tiên của bạn.</p>
          </div>
        )}
        {addresses.map(addr => (
          <div key={addr.id} className={`address-card card ${addr.isDefault ? 'address-card--default' : ''}`}>
            {addr.isDefault && <span className="address-card__badge">Mặc định</span>}
            <div className="address-card__header">
              <span className="address-card__label">{addr.label}</span>
              <div className="address-card__actions">
                <button className="address-card__action-btn" onClick={() => handleEdit(addr)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Sửa
                </button>
                {!addr.isDefault && (
                  <>
                    <button className="address-card__action-btn" onClick={() => handleSetDefault(addr.id)}>Đặt mặc định</button>
                    <button className="address-card__action-btn address-card__action-btn--danger" onClick={() => handleDelete(addr.id)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                      Xóa
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className="address-card__body">
              <p className="address-card__name">{addr.name}</p>
              <p className="address-card__phone">{addr.phone}</p>
              <p className="address-card__address">{addr.address}, {addr.district}, {addr.city}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
