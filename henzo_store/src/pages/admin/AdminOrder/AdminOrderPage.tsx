import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../../../contexts/AdminContext';
import { AdminDataTable } from '../../../components/admin/AdminDataTable';
import { ConfirmModal } from '../../../components/common/ConfirmModal';
import type { Order } from '../../../types';
import { formatNumber } from '../../../utils';
import './AdminOrderPage.css';

const STATUS_OPTIONS = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Chờ xác nhận', value: 'pending' },
  { label: 'Đã xác nhận', value: 'confirmed' },
  { label: 'Đang xử lý', value: 'processing' },
  { label: 'Đang giao', value: 'shipping' },
  { label: 'Hoàn thành', value: 'delivered' },
  { label: 'Đã hủy', value: 'cancelled' },
];

const STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  processing: 'Đang xử lý',
  shipping: 'Đang giao',
  delivered: 'Hoàn thành',
  cancelled: 'Đã hủy',
};

export const AdminOrderPage = () => {
  const navigate = useNavigate();
  const { orders, updateOrderStatus } = useAdmin();
  const [filter, setFilter] = useState('all');

  const [pendingAction, setPendingAction] = useState<{ orderId: string; newStatus: Order['status'] } | null>(null);

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  const confirmStatusChange = () => {
    if (!pendingAction) return;
    updateOrderStatus(pendingAction.orderId, pendingAction.newStatus);
    setPendingAction(null);
  };

  const columns = [
    { key: 'orderNumber', label: 'Mã đơn hàng', sortable: true, width: '160px',
      render: (_: unknown, r: Order) => <code className="order-id-code">{(r as Order).orderNumber}</code>,
    },
    { key: 'id', label: 'ID', width: '100px', render: (_: unknown, r: Order) => <span className="text-muted">#{(r as Order).id.replace('order-', '')}</span> },
    { key: 'shippingAddress', label: 'Địa chỉ giao hàng',
      render: (_: unknown, r: Order) => <span className="address-text">{(r as Order).shippingAddress}</span>,
    },
    { key: 'paymentMethod', label: 'Thanh toán', align: 'center' as const, width: '120px',
      render: (_: unknown, r: Order) => <span className="badge badge-secondary">{(r as Order).paymentMethod}</span>,
    },
    { key: 'totalPrice', label: 'Tổng tiền', sortable: true, align: 'right' as const, width: '140px',
      render: (_: unknown, r: Order) => <span className="order-amount">{formatNumber((r as Order).totalPrice)}đ</span>,
    },
    {
      key: 'status', label: 'Trạng thái', align: 'center' as const, width: '140px',
      render: (_: unknown, r: Order) => {
        const s = (r as Order).status;
        return <span className={`admin-status admin-status--${s}`}>{STATUS_LABELS[s]}</span>;
      },
    },
    { key: 'createdAt', label: 'Ngày đặt', sortable: true, width: '120px',
      render: (_: unknown, r: Order) => new Date((r as Order).createdAt).toLocaleDateString('vi-VN'),
    },
  ];

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <div>
          <h1 className="admin-page__title">Quản Lý Đơn Hàng</h1>
          <p className="admin-page__subtitle">Xem và xử lý các đơn hàng từ khách hàng trên toàn hệ thống</p>
        </div>
        <div className="admin-page-header__actions">
          <span className="admin-page__meta">{formatNumber(orders.length)} đơn hàng</span>
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
          searchableFields={['orderNumber', 'shippingAddress']}
          actions={(record) => {
            const isCancelled = (record as Order).status === 'cancelled';
            return (
              <>
                <button className="btn btn-sm btn-secondary" onClick={() => navigate(`/admin/orders/${(record as Order).id}`)}>Chi tiết</button>
                {!isCancelled && (
                  <select
                    className="order-status-select"
                    value={(record as Order).status}
                    onChange={(e) => setPendingAction({ orderId: (record as Order).id, newStatus: e.target.value as Order['status'] })}
                  >
                    <option value="pending">Chờ xác nhận</option>
                    <option value="confirmed">Đã xác nhận</option>
                    <option value="processing">Đang xử lý</option>
                    <option value="shipping">Đang giao</option>
                    <option value="delivered">Hoàn thành</option>
                    <option value="cancelled">Đã hủy</option>
                  </select>
                )}
              </>
            );
          }}
          emptyText="Không có đơn hàng nào"
        />

        <ConfirmModal
          open={!!pendingAction}
          title="Xác nhận thay đổi trạng thái"
          message={`Bạn có chắc muốn cập nhật trạng thái đơn hàng này thành "${pendingAction ? STATUS_LABELS[pendingAction.newStatus] : ''}" không?`}
          confirmLabel="Xác nhận"
          onConfirm={confirmStatusChange}
          onCancel={() => setPendingAction(null)}
        />
      </div>
    </div>
  );
};
