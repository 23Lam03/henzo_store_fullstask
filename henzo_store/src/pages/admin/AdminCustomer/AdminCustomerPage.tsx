import { useState } from 'react';
import { useAdmin } from '../../../contexts/AdminContext';
import { AdminDataTable } from '../../../components/admin/AdminDataTable';
import { ConfirmModal } from '../../../components/common/ConfirmModal';
import { useToast } from '../../../contexts/ToastContext/ToastContext';
import type { User } from '../../../types';
import { formatNumber } from '../../../utils';
import './AdminCustomerPage.css';

const STATUS_OPTIONS = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Hoạt động', value: 'active' },
  { label: 'Bị khóa', value: 'locked' },
];

export const AdminCustomerPage = () => {
  const { customers, lockCustomer, unlockCustomer, deleteCustomer } = useAdmin();
  const toast = useToast();
  const [filter, setFilter] = useState('all');
  const [pendingAction, setPendingAction] = useState<
    { id: string; action: 'lock' | 'unlock' | 'delete' } | null
  >(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Modal chi tiết — trước đây điều hướng tới route `/admin/customers/:id`.
  const [detail, setDetail] = useState<User | null>(null);

  const filtered =
    filter === 'active'
      ? customers.filter(c => c.status !== 'locked')
      : filter === 'locked'
        ? customers.filter(c => c.status === 'locked')
        : customers;

  /** Khoá / mở khoá / xoá tài khoản khách hàng. */
  const handleConfirmAction = async () => {
    if (!pendingAction) return;
    const { id, action } = pendingAction;
    setIsSubmitting(true);
    try {
      if (action === 'delete') {
        await deleteCustomer(id);
        toast({ title: 'Đã xóa khách hàng', variant: 'success' });
      } else if (action === 'lock') {
        await lockCustomer(id);
        toast({ title: 'Đã khóa tài khoản', variant: 'success' });
      } else {
        await unlockCustomer(id);
        toast({ title: 'Đã mở khóa tài khoản', variant: 'success' });
      }
      setPendingAction(null);
    } catch (err) {
      console.error('Customer action failed:', err);
      toast({
        title: 'Thao tác thất bại',
        message: err instanceof Error ? err.message : 'Vui lòng thử lại.',
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    {
      key: 'id', label: 'Mã KH', width: '120px',
      render: (_: unknown, r: User) => <code className="customer-id">{(r as User).id.replace('customer-', 'CUS')}</code>,
    },
    {
      key: 'name', label: 'Khách hàng', sortable: true,
      render: (_: unknown, r: User) => (
        <div className="customer-cell">
          <img src={(r as User).avatar} alt="" className="admin-avatar admin-avatar--sm" />
          <div>
            <p className="customer-name">{(r as User).name}</p>
            <p className="customer-email">{(r as User).email}</p>
          </div>
        </div>
      ),
    },
    { key: 'phone', label: 'Điện thoại', render: (_: unknown, r: User) => <span>{(r as User).phone}</span> },
    { key: 'address', label: 'Địa chỉ', render: (_: unknown, r: User) => <span className="text-muted">{(r as User).address || '—'}</span> },
    { key: 'createdAt', label: 'Ngày đăng ký', sortable: true, width: '140px',
      render: (_: unknown, r: User) => new Date((r as User).createdAt).toLocaleDateString('vi-VN'),
    },
    {
      key: 'role', label: 'Trạng thái', align: 'center' as const, width: '130px',
      render: (_: unknown, r: User) => {
        const locked = (r as User & { status?: string }).status === 'locked';
        return (
          <span className={`admin-status ${locked ? 'admin-status--locked' : 'admin-status--active'}`}>
            {locked ? 'Bị khóa' : 'Hoạt động'}
          </span>
        );
      },
    },
  ];

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <div>
          <h1 className="admin-page__title">Quản Lý Khách Hàng</h1>
          <p className="admin-page__subtitle">Xem và quản lý tài khoản khách hàng trên hệ thống</p>
        </div>
        <div className="admin-page-header__actions">
          <span className="admin-page__meta">{formatNumber(customers.length)} khách hàng</span>
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
          actions={(record) => {
            const r = record as User & { status?: string };
            const locked = r.status === 'locked';
            return (
              <>
                <button className="btn btn-sm btn-secondary" onClick={() => setDetail(r)}>Chi tiết</button>
                <button
                  className="btn btn-sm btn-outline"
                  onClick={() => setPendingAction({ id: r.id, action: locked ? 'unlock' : 'lock' })}
                >
                  {locked ? 'Mở khóa' : 'Khóa'}
                </button>
                <button
                  className="btn btn-sm btn-outline"
                  style={{ color: 'var(--color-danger)' }}
                  onClick={() => setPendingAction({ id: r.id, action: 'delete' })}
                >
                  Xóa
                </button>
              </>
            );
          }}
          emptyText="Không có khách hàng nào"
        />
      </div>

      <ConfirmModal
        open={!!pendingAction}
        title={
          pendingAction?.action === 'delete'
            ? 'Xóa khách hàng'
            : pendingAction?.action === 'lock'
              ? 'Khóa tài khoản'
              : 'Mở khóa tài khoản'
        }
        message={
          pendingAction?.action === 'delete'
            ? 'Bạn có chắc muốn xóa khách hàng này? Hành động này không thể hoàn tác.'
            : pendingAction?.action === 'lock'
              ? 'Khóa tài khoản sẽ ngăn khách hàng đăng nhập. Xác nhận?'
              : 'Mở khóa tài khoản cho khách hàng này?'
        }
        confirmLabel={pendingAction?.action === 'delete' ? 'Xóa' : 'Xác nhận'}
        variant={pendingAction?.action === 'delete' ? 'danger' : 'primary'}
        loading={isSubmitting}
        onConfirm={() => void handleConfirmAction()}
        onCancel={() => setPendingAction(null)}
      />

      {/* Modal chi tiết khách hàng */}
      {detail && (
        <div className="admin-modal-overlay" onClick={() => setDetail(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h2 className="admin-modal__title">Chi tiết khách hàng</h2>
              <button className="admin-modal__close" onClick={() => setDetail(null)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="admin-modal__body">
              <div className="admin-detail-avatar">
                <img src={detail.avatar} alt={detail.name} className="admin-avatar admin-avatar--lg" style={{ width: 72, height: 72 }} />
                <div>
                  <h2 className="admin-detail-avatar__name">{detail.name}</h2>
                  <span className={`admin-status ${detail.status === 'locked' ? 'admin-status--locked' : 'admin-status--active'}`}>
                    {detail.status === 'locked' ? 'Bị khóa' : 'Hoạt động'}
                  </span>
                </div>
              </div>
              <div className="admin-detail-section">
                <h4 className="admin-detail-section__title">Thông tin liên hệ</h4>
                <div className="admin-detail-row">
                  <span className="admin-detail-label">Mã KH</span>
                  <span className="admin-detail-value">{detail.id.replace('customer-', 'CUS')}</span>
                </div>
                <div className="admin-detail-row">
                  <span className="admin-detail-label">Email</span>
                  <span className="admin-detail-value">{detail.email}</span>
                </div>
                <div className="admin-detail-row">
                  <span className="admin-detail-label">Điện thoại</span>
                  <span className="admin-detail-value">{detail.phone}</span>
                </div>
                <div className="admin-detail-row">
                  <span className="admin-detail-label">Địa chỉ</span>
                  <span className="admin-detail-value">{detail.address || '—'}</span>
                </div>
                <div className="admin-detail-row">
                  <span className="admin-detail-label">Ngày đăng ký</span>
                  <span className="admin-detail-value">{new Date(detail.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>
              </div>
            </div>
            <div className="admin-modal__footer">
              <button className="btn btn-secondary" onClick={() => setDetail(null)}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
