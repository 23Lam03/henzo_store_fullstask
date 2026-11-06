import { useState } from 'react';
import { useAdmin } from '../../../contexts/AdminContext';
import { AdminDataTable } from '../../../components/admin/AdminDataTable';
import { ConfirmModal } from '../../../components/common/ConfirmModal';
import { useToast } from '../../../contexts/ToastContext/ToastContext';
import type { Promotion } from '../../../types';
import './AdminPromotionPage.css';

const TYPE_OPTIONS = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Giảm giá sản phẩm', value: 'product' },
  { label: 'Mã giảm giá', value: 'voucher' },
  { label: 'Flash Sale', value: 'flashsale' },
  { label: 'Voucher', value: 'voucher2' },
];

const STATUS_OPTIONS = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Đang hoạt động', value: 'active' },
  { label: 'Sắp diễn ra', value: 'upcoming' },
  { label: 'Đã kết thúc', value: 'ended' },
];

const TYPE_LABELS = ['Giảm giá sản phẩm', 'Mã giảm giá', 'Flash Sale', 'Voucher', 'Quà tặng kèm', 'Free Ship'];

const getPromoStatus = (promo: Promotion): { label: string; key: string } => {
  const now = new Date();
  const start = new Date(promo.startDate);
  const end = new Date(promo.endDate);
  if (now < start) return { label: 'Sắp diễn ra', key: 'upcoming' };
  if (now > end) return { label: 'Đã kết thúc', key: 'ended' };
  return { label: 'Đang hoạt động', key: 'active' };
};

const getPromoType = (id: string): string => {
  const idx = parseInt(id.replace(/\D/g, '')) || 0;
  return TYPE_LABELS[idx % TYPE_LABELS.length];
};

interface PromoForm {
  title: string;
  code: string;
  description: string;
  discount: number;
  startDate: string;
  endDate: string;
}

const EMPTY_PROMO_FORM: PromoForm = {
  title: '',
  code: '',
  description: '',
  discount: 0,
  startDate: '',
  endDate: '',
};

const toDateInput = (value?: string): string => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
};

export const AdminPromotionPage = () => {
  const { promotions, deletePromotion, addPromotion, updatePromotion } = useAdmin();
  const toast = useToast();
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);
  const [form, setForm] = useState<PromoForm>(EMPTY_PROMO_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const enrichedPromos = promotions.map(p => ({
    ...p,
    statusInfo: getPromoStatus(p),
    typeLabel: getPromoType(p.id),
  }));

  const filtered = enrichedPromos.filter(p =>
    (typeFilter === 'all' || p.typeLabel === typeFilter) &&
    (statusFilter === 'all' || p.statusInfo.key === statusFilter)
  );

    const openForm = (promo: Promotion | null) => {
    setEditingPromo(promo);
    setForm(
      promo
        ? {
            title: promo.title ?? '',
            code: promo.code ?? '',
            description: promo.description ?? '',
            discount: promo.discount ?? 0,
            startDate: toDateInput(promo.startDate),
            endDate: toDateInput(promo.endDate),
          }
        : EMPTY_PROMO_FORM,
    );
    setFormErrors({});
    setShowForm(true);
  };

    const handleSubmitForm = async () => {
    const errors: Record<string, string> = {};
    if (!form.title.trim()) errors.title = 'Vui lòng nhập tên chương trình.';
    if (form.discount < 0 || form.discount > 100) {
      errors.discount = 'Phần trăm giảm phải từ 0 đến 100.';
    }
    if (!form.startDate) errors.startDate = 'Vui lòng chọn ngày bắt đầu.';
    if (!form.endDate) errors.endDate = 'Vui lòng chọn ngày kết thúc.';
    if (form.startDate && form.endDate && form.endDate <= form.startDate) {
      errors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu.';
    }
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);
    try {
      const payload = {
        title: form.title.trim(),
        code: form.code.trim(),
        description: form.description.trim(),
        discount: Number(form.discount),
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
      };
      if (editingPromo) {
        await updatePromotion(editingPromo.id, payload as Partial<Promotion>);
        toast({ title: 'Đã cập nhật khuyến mãi', variant: 'success' });
      } else {
        await addPromotion(payload as Partial<Promotion>);
        toast({ title: 'Đã tạo khuyến mãi', variant: 'success' });
      }
      setShowForm(false);
      setEditingPromo(null);
    } catch (err) {
      console.error('Save promotion failed:', err);
      toast({
        title: 'Lưu thất bại',
        message: err instanceof Error ? err.message : 'Vui lòng thử lại.',
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

    const handleDelete = async (id: string) => {
    setIsSubmitting(true);
    try {
      await deletePromotion(id);
      toast({ title: 'Đã xóa khuyến mãi', variant: 'success' });
    } catch (err) {
      console.error('Delete promotion failed:', err);
      toast({
        title: 'Xóa thất bại',
        message: err instanceof Error ? err.message : 'Vui lòng thử lại.',
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
      setPendingDelete(null);
    }
  };

  const columns = [
    {
      key: 'title', label: 'Chương trình', sortable: true,
      render: (_: unknown, r: Promotion & { typeLabel: string; statusInfo: { label: string; key: string } }) => (
        <div className="promo-cell">
          <p className="promo-title">{(r as Promotion).title}</p>
          {(r as Promotion).code && <code className="promo-code">{(r as Promotion).code}</code>}
        </div>
      ),
    },
    {
      key: 'type', label: 'Loại',
      render: (_: unknown, r: Promotion & { typeLabel: string }) => (
        <span className="badge badge-secondary">{(r as Promotion & { typeLabel: string }).typeLabel}</span>
      ),
    },
    {
      key: 'discount', label: 'Giảm', align: 'center' as const, width: '100px',
      render: (_: unknown, r: Promotion) => (
        <span className="promo-discount">-{r.discount}%</span>
      ),
    },
    {
      key: 'dates', label: 'Thời gian',
      render: (_: unknown, r: Promotion) => (
        <div className="promo-dates">
          <span>{new Date(r.startDate).toLocaleDateString('vi-VN')}</span>
          <span className="promo-dates-arrow">→</span>
          <span>{new Date(r.endDate).toLocaleDateString('vi-VN')}</span>
        </div>
      ),
    },
    {
      key: 'isActive', label: 'Trạng thái', align: 'center' as const, width: '130px',
      render: (_: unknown, r: Promotion & { statusInfo: { label: string; key: string } }) => {
        const s = (r as Promotion & { statusInfo: { label: string; key: string } }).statusInfo;
        return <span className={`admin-status admin-status--${s.key === 'active' ? 'active' : s.key === 'upcoming' ? 'new' : 'locked'}`}>{s.label}</span>;
      },
    },
    {
      key: 'created', label: 'Ngày tạo', sortable: true, width: '110px',
      render: (_: unknown, r: Promotion) => new Date(r.startDate).toLocaleDateString('vi-VN'),
    },
  ];

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <div>
          <h1 className="admin-page__title">Quản Lý Khuyến Mãi</h1>
          <p className="admin-page__subtitle">Tạo và quản lý các chương trình khuyến mãi trên hệ thống</p>
        </div>
        <div className="admin-page-header__actions">
          <span className="admin-page__meta">{promotions.length} chương trình</span>
          <button className="btn btn-primary" onClick={() => openForm(null)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Tạo khuyến mãi
          </button>
        </div>
      </div>

      <div className="admin-section">
        <div className="promo-filter-bar">
          <div className="promo-filter-group">
            <label>Loại khuyến mãi:</label>
            <select className="admin-form-select promo-filter-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="promo-filter-group">
            <label>Trạng thái:</label>
            <select className="admin-form-select promo-filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
        <AdminDataTable
          columns={columns}
          data={filtered}
          rowKey="id"
          searchable
          searchableFields={['title', 'code', 'description']}
          actions={(record) => (
            <>
              <button className="btn btn-sm btn-secondary" onClick={() => openForm(record as Promotion)}>Chi tiết</button>
              <button className="btn btn-sm btn-outline" onClick={() => openForm(record as Promotion)}>Sửa</button>
              <button
                className="btn btn-sm btn-outline"
                style={{ color: 'var(--color-danger)' }}
                onClick={() => setPendingDelete((record as Promotion).id)}
              >
                Xóa
              </button>
            </>
          )}
          emptyText="Không có chương trình khuyến mãi nào"
        />
      </div>

      {}
      {showForm && (
        <div className="admin-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="admin-modal admin-modal--lg" onClick={e => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h2 className="admin-modal__title">
                {editingPromo ? 'Cập nhật khuyến mãi' : 'Tạo khuyến mãi mới'}
              </h2>
              <button className="admin-modal__close" onClick={() => setShowForm(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="admin-modal__body">
              <div className="admin-form">
                <div className="admin-form-group">
                  <label className="admin-form-label">Tên chương trình <span>*</span></label>
                  <input
                    className="admin-form-input"
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="VD: Flash Sale Cuối Tuần"
                  />
                  {formErrors.title && <span className="input-error">{formErrors.title}</span>}
                </div>
                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label className="admin-form-label">Mã giảm giá</label>
                    <input
                      className="admin-form-input"
                      value={form.code}
                      onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                      placeholder="VD: SUMMER30"
                    />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Giảm (%) <span>*</span></label>
                    <input
                      type="number"
                      className="admin-form-input"
                      value={form.discount}
                      onChange={e => setForm(f => ({ ...f, discount: Number(e.target.value) }))}
                    />
                    {formErrors.discount && <span className="input-error">{formErrors.discount}</span>}
                  </div>
                </div>
                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label className="admin-form-label">Ngày bắt đầu <span>*</span></label>
                    <input
                      type="date"
                      className="admin-form-input"
                      value={form.startDate}
                      onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                    />
                    {formErrors.startDate && <span className="input-error">{formErrors.startDate}</span>}
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Ngày kết thúc <span>*</span></label>
                    <input
                      type="date"
                      className="admin-form-input"
                      value={form.endDate}
                      onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                    />
                    {formErrors.endDate && <span className="input-error">{formErrors.endDate}</span>}
                  </div>
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Mô tả</label>
                  <textarea
                    className="admin-form-textarea"
                    rows={4}
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Mô tả chương trình khuyến mãi..."
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
                {isSubmitting ? 'Đang lưu...' : editingPromo ? 'Lưu thay đổi' : 'Tạo khuyến mãi'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!pendingDelete}
        title="Xóa khuyến mãi"
        message="Bạn có chắc muốn xóa chương trình khuyến mãi này? Hành động này không thể hoàn tác."
        confirmLabel="Xóa"
        variant="danger"
        loading={isSubmitting}
        onConfirm={() => {
          if (pendingDelete) void handleDelete(pendingDelete);
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
};
