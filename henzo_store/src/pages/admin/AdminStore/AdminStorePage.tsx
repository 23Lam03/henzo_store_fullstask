import { useState } from 'react';
import { useAdmin } from '../../../contexts/AdminContext';
import { adminApi } from '../../../services/api/admin';
import { AdminDataTable } from '../../../components/admin/AdminDataTable';
import type { Store } from '../../../types';
import { formatNumber } from '../../../utils';
import { useToast } from '../../../contexts/ToastContext/ToastContext';
import { ConfirmModal } from '../../../components/common/ConfirmModal';
import './AdminStorePage.css';

const STATUS_OPTIONS = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Đã xác minh', value: 'verified' },
  { label: 'Chưa xác minh', value: 'unverified' },
];

/** Form cửa hàng (dùng cho cả tạo mới và chỉnh sửa). */
interface StoreForm {
  name: string;
  email: string;
  phone: string;
  address: string;
  description: string;
}

const EMPTY_STORE_FORM: StoreForm = {
  name: '',
  email: '',
  phone: '',
  address: '',
  description: '',
};

export const AdminStorePage = () => {
  const { stores, deleteStore, refresh } = useAdmin();
  const toast = useToast();
  const [filter, setFilter] = useState('all');
  const [detail, setDetail] = useState<Store | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<{ id: string; action: 'verify' | 'unverify' | 'delete' } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal tạo / sửa cửa hàng (trước đây điều hướng tới route không tồn tại).
  const [showForm, setShowForm] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [form, setForm] = useState<StoreForm>(EMPTY_STORE_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  /** Mở modal tạo (store = null) hoặc sửa (store có id). */
  const openForm = (store: Store | null) => {
    setEditingStore(store);
    setForm(
      store
        ? {
            name: store.name ?? '',
            email: store.email ?? '',
            phone: store.phone ?? '',
            address: store.address ?? '',
            description: store.description ?? '',
          }
        : EMPTY_STORE_FORM,
    );
    setFormErrors({});
    setShowForm(true);
  };

  /** Lưu cửa hàng (tạo mới hoặc cập nhật). */
  const handleSubmitForm = async () => {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = 'Vui lòng nhập tên cửa hàng.';
    if (!form.email.trim()) errors.email = 'Vui lòng nhập email.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = 'Email không hợp lệ.';
    }
    if (!form.phone.trim()) errors.phone = 'Vui lòng nhập số điện thoại.';
    if (!form.address.trim()) errors.address = 'Vui lòng nhập địa chỉ.';
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);
    try {
      if (editingStore) {
        await adminApi.updateStore(editingStore.id, form as unknown as Record<string, unknown>);
        toast({ title: 'Đã cập nhật cửa hàng', variant: 'success' });
      } else {
        await adminApi.createStore(form as unknown as Record<string, unknown>);
        toast({ title: 'Đã thêm cửa hàng', variant: 'success' });
      }
      setShowForm(false);
      setEditingStore(null);
      await refresh();
    } catch (err) {
      console.error('Save store failed:', err);
      toast({
        title: 'Lưu thất bại',
        message: err instanceof Error ? err.message : 'Vui lòng thử lại.',
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Thực thi hành động đã xác nhận (xoá / xác minh / huỷ xác minh).
   * Trước đây nút "Xóa cửa hàng" chỉ hiện toast mà không gọi API nên
   * cửa hàng không bao giờ thực sự bị xoá.
   */
  const handleConfirmAction = async () => {
    if (!pendingConfirm) return;
    const { id, action } = pendingConfirm;
    setIsSubmitting(true);
    try {
      if (action === 'delete') {
        await deleteStore(id);
        toast({ title: 'Đã xóa cửa hàng', variant: 'success' });
        setDetail(null);
      } else if (action === 'verify') {
        await adminApi.storeAction(id, 'verify');
        toast({ title: 'Đã xác minh cửa hàng', variant: 'success' });
        await refresh();
      } else {
        await adminApi.storeAction(id, 'unverify');
        toast({ title: 'Đã hủy xác minh', variant: 'success' });
        await refresh();
      }
      setPendingConfirm(null);
    } catch (err) {
      console.error('Store action failed:', err);
      toast({
        title: action === 'delete' ? 'Xóa thất bại' : 'Cập nhật thất bại',
        message: err instanceof Error ? err.message : 'Vui lòng thử lại.',
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = filter === 'verified' ? stores.filter(s => s.isVerified) :
                  filter === 'unverified' ? stores.filter(s => !s.isVerified) : stores;

  const columns = [
    {
      key: 'id', label: 'Mã cửa hàng', width: '120px',
      render: (_: unknown, r: Store) => (
        <code className="store-id">{(r as Store).id.replace('store-', 'SH')}</code>
      ),
    },
    {
      key: 'name', label: 'Tên cửa hàng', sortable: true,
      render: (_: unknown, r: Store) => (
        <div className="store-name-cell">
          <img src={(r as Store).avatar} alt="" className="admin-avatar admin-avatar--sm" />
          <div>
            <p className="store-name">{(r as Store).name}</p>
            <p className="store-address">{(r as Store).address}</p>
          </div>
        </div>
      ),
    },
    { key: 'email', label: 'Email', render: (_: unknown, r: Store) => <span className="text-muted">{(r as Store).email}</span> },
    { key: 'phone', label: 'Điện thoại', render: (_: unknown, r: Store) => <span>{(r as Store).phone}</span> },
    { key: 'rating', label: 'Đánh giá', sortable: true, align: 'center' as const, width: '100px',
      render: (_: unknown, r: Store) => (
        <div className="admin-stars">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="#A9741A" stroke="#A9741A" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          <span style={{ color: '#A9741A', fontWeight: 700 }}>{(r as Store).rating}</span>
        </div>
      ),
    },
    { key: 'productCount', label: 'Sản phẩm', sortable: true, align: 'center' as const, width: '100px',
      render: (_: unknown, r: Store) => <span className="badge badge-secondary">{(r as Store).productCount.toLocaleString()}</span>,
    },
    {
      key: 'isVerified', label: 'Trạng thái', align: 'center' as const, width: '130px',
      render: (_: unknown, r: Store) => (
        (r as Store).isVerified
          ? <span className="admin-status admin-status--verified">✓ Đã xác minh</span>
          : <span className="admin-status admin-status--locked">Chưa xác minh</span>
      ),
    },
    { key: 'createdAt', label: 'Ngày tạo', width: '120px',
      render: (_: unknown, r: Store) => new Date((r as Store).createdAt).toLocaleDateString('vi-VN'),
    },
  ];

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <div>
          <h1 className="admin-page__title">Quản Lý Cửa Hàng</h1>
          <p className="admin-page__subtitle">Xem và quản lý thông tin cửa hàng trên hệ thống</p>
        </div>
        <div className="admin-page-header__actions">
          <span className="admin-page__meta">{formatNumber(stores.length)} cửa hàng</span>
          <button className="btn btn-primary" onClick={() => openForm(null)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Thêm cửa hàng
          </button>
        </div>
      </div>

      <div className="admin-section">
        <AdminDataTable
          columns={columns}
          data={filtered}
          rowKey="id"
          filterable
          filterOptions={STATUS_OPTIONS}
          currentFilter={filter}
          onFilterChange={setFilter}
          searchable
          searchableFields={['name', 'email', 'phone', 'address']}
          actions={(record) => (
            <>
              <button className="btn btn-sm btn-secondary" onClick={() => setDetail(record as Store)}>Chi tiết</button>
              <button className="btn btn-sm btn-outline" onClick={() => openForm(record as Store)}>Sửa</button>
            </>
          )}
          emptyText="Không có cửa hàng nào"
        />
      </div>

      {detail && (
        <>
          <div className="admin-detail-panel-overlay" onClick={() => setDetail(null)} />
          <div className="admin-detail-panel">
            <div className="admin-detail-panel__header">
              <h3 className="admin-detail-panel__title">Chi tiết cửa hàng</h3>
              <button className="admin-detail-panel__close" onClick={() => setDetail(null)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="admin-detail-panel__body">
              <div className="admin-detail-avatar">
                <img src={detail.avatar} alt={detail.name} className="admin-avatar admin-avatar--lg" style={{ width: 72, height: 72 }} />
                <div>
                  <h2 className="admin-detail-avatar__name">{detail.name}</h2>
                  <span className={`admin-status ${detail.isVerified ? 'admin-status--verified' : 'admin-status--locked'}`}>
                    {detail.isVerified ? '✓ Đã xác minh' : 'Chưa xác minh'}
                  </span>
                </div>
              </div>

              <div className="admin-detail-section">
                <h4 className="admin-detail-section__title">Thông tin liên hệ</h4>
                <div className="admin-detail-row">
                  <span className="admin-detail-label">Email</span>
                  <span className="admin-detail-value">{detail.email}</span>
                </div>
                <div className="admin-detail-row">
                  <span className="admin-detail-label">Số điện thoại</span>
                  <span className="admin-detail-value">{detail.phone}</span>
                </div>
                <div className="admin-detail-row">
                  <span className="admin-detail-label">Địa chỉ</span>
                  <span className="admin-detail-value">{detail.address}</span>
                </div>
              </div>

              <div className="admin-detail-section">
                <h4 className="admin-detail-section__title">Thống kê</h4>
                <div className="admin-detail-row">
                  <span className="admin-detail-label">Đánh giá</span>
                  <span className="admin-detail-value" style={{ color: '#A9741A', fontWeight: 700 }}>⭐ {detail.rating}/5</span>
                </div>
                <div className="admin-detail-row">
                  <span className="admin-detail-label">Số sản phẩm</span>
                  <span className="admin-detail-value">{formatNumber(detail.productCount)}</span>
                </div>
                <div className="admin-detail-row">
                  <span className="admin-detail-label">Ngày đăng ký</span>
                  <span className="admin-detail-value">{new Date(detail.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>
              </div>

              <div className="admin-detail-actions">
                <button className="btn btn-primary btn-full" onClick={() => { setDetail(null); openForm(detail); }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Chỉnh sửa
                </button>
                <button className={`btn ${detail.isVerified ? 'btn-outline' : 'btn-primary'} btn-full`} onClick={() => setPendingConfirm({ id: detail.id, action: detail.isVerified ? 'unverify' : 'verify' })}>
                  {detail.isVerified ? 'Hủy xác minh' : 'Xác minh cửa hàng'}
                </button>
                <button className="btn btn-danger-outline btn-full" onClick={() => setPendingConfirm({ id: detail.id, action: 'delete' })}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                  Xóa cửa hàng
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <ConfirmModal
        open={!!pendingConfirm}
        title={pendingConfirm?.action === 'delete' ? 'Xóa cửa hàng' : pendingConfirm?.action === 'verify' ? 'Xác minh cửa hàng' : 'Hủy xác minh'}
        message={
          pendingConfirm?.action === 'delete'
            ? 'Bạn có chắc muốn xóa cửa hàng này? Hành động này không thể hoàn tác.'
            : pendingConfirm?.action === 'verify'
            ? 'Xác minh cửa hàng này để hiển thị trên hệ thống?'
            : 'Hủy xác minh cửa hàng này?'
        }
        confirmLabel={pendingConfirm?.action === 'delete' ? 'Xóa' : 'Xác nhận'}
        variant={pendingConfirm?.action === 'delete' ? 'danger' : 'primary'}
        loading={isSubmitting}
        onConfirm={() => void handleConfirmAction()}
        onCancel={() => setPendingConfirm(null)}
      />

      {/* Modal tạo / sửa cửa hàng */}
      {showForm && (
        <div className="admin-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h2 className="admin-modal__title">
                {editingStore ? 'Cập nhật cửa hàng' : 'Thêm cửa hàng mới'}
              </h2>
              <button className="admin-modal__close" onClick={() => setShowForm(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="admin-modal__body">
              <div className="admin-form">
                <div className="admin-form-group">
                  <label className="admin-form-label">Tên cửa hàng <span>*</span></label>
                  <input
                    className="admin-form-input"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="VD: TechPro Shop"
                  />
                  {formErrors.name && <span className="input-error">{formErrors.name}</span>}
                </div>
                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label className="admin-form-label">Email <span>*</span></label>
                    <input
                      className="admin-form-input"
                      type="email"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="shop@henzo.com"
                    />
                    {formErrors.email && <span className="input-error">{formErrors.email}</span>}
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Điện thoại <span>*</span></label>
                    <input
                      className="admin-form-input"
                      value={form.phone}
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="0912345678"
                    />
                    {formErrors.phone && <span className="input-error">{formErrors.phone}</span>}
                  </div>
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Địa chỉ <span>*</span></label>
                  <input
                    className="admin-form-input"
                    value={form.address}
                    onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                    placeholder="123 Nguyễn Huệ, Quận 1, TP.HCM"
                  />
                  {formErrors.address && <span className="input-error">{formErrors.address}</span>}
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Mô tả</label>
                  <textarea
                    className="admin-form-textarea"
                    rows={4}
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Giới thiệu ngắn về cửa hàng..."
                  />
                </div>
              </div>
            </div>
            <div className="admin-modal__footer">
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Hủy</button>
              <button
                className="btn btn-primary"
                onClick={() => void handleSubmitForm()}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Đang lưu...' : editingStore ? 'Lưu thay đổi' : 'Thêm cửa hàng'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
