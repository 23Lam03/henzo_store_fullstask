import { useCallback, useEffect, useState } from 'react';
import { adminApi } from '../../../services/api/admin';
import { useToast } from '../../../contexts/ToastContext/ToastContext';
import { ConfirmModal } from '../../../components/common/ConfirmModal';
import './AdminAccessPage.css';

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  roleColor: string;
  roleBg: string;
  permissions: string[];
  lastLogin: string;
  status: 'active' | 'locked';
}

const ROLE_OPTIONS = [
  { name: 'ADMIN', label: 'Admin', desc: 'Quản lý toàn bộ nội dung và người dùng', color: '#1F5557', bg: 'rgba(31,85,87,0.1)', defaultPerms: ['Quản lý sản phẩm', 'Quản lý đơn hàng', 'Quản lý khách hàng', 'Quản lý cửa hàng', 'Báo cáo', 'Tài chính'] },
  { name: 'MODERATOR', label: 'Moderator', desc: 'Kiểm duyệt nội dung, đánh giá, sản phẩm', color: '#2A6A85', bg: 'rgba(6,182,212,0.1)', defaultPerms: ['Kiểm duyệt sản phẩm', 'Kiểm duyệt đánh giá', 'Xem báo cáo'] },
  { name: 'STAFF', label: 'Staff', desc: 'Hỗ trợ khách hàng, xem đơn hàng', color: '#2F7D52', bg: 'rgba(16,185,129,0.1)', defaultPerms: ['Hỗ trợ khách hàng', 'Xem đơn hàng'] },
  { name: 'SHOP', label: 'Shop', desc: 'Người bán — quản lý cửa hàng và sản phẩm', color: '#A9741A', bg: 'rgba(245,158,11,0.1)', defaultPerms: ['Quản lý sản phẩm', 'Quản lý đơn hàng', 'Quản lý khuyến mãi', 'Xem báo cáo', 'Quản lý kho'] },
];

const ROLE_PERMS: Record<string, string[]> = {
  ADMIN: ['Xem dashboard', 'Quản lý sản phẩm', 'Quản lý đơn hàng', 'Quản lý khách hàng', 'Quản lý cửa hàng', 'Quản lý thanh toán', 'Quản lý đánh giá', 'Quản lý khuyến mãi', 'Quản lý hỗ trợ', 'Báo cáo', 'Tài chính'],
  MODERATOR: ['Xem dashboard', 'Quản lý sản phẩm', 'Quản lý đánh giá', 'Xem báo cáo'],
  STAFF: ['Xem dashboard', 'Xem đơn hàng', 'Hỗ trợ khách hàng'],
  SHOP: ['Quản lý sản phẩm', 'Quản lý đơn hàng', 'Quản lý khuyến mãi', 'Xem báo cáo', 'Quản lý kho', 'Quản lý vận chuyển'],
};

const ALL_PERMISSIONS = [
  'Xem dashboard', 'Quản lý sản phẩm', 'Quản lý đơn hàng', 'Quản lý khách hàng',
  'Quản lý cửa hàng', 'Quản lý thanh toán', 'Quản lý đánh giá', 'Quản lý khuyến mãi',
  'Quản lý hỗ trợ', 'Báo cáo', 'Tài chính', 'Phân quyền',
  'Quản lý kho', 'Quản lý vận chuyển',
];

const ROLE_COLORS: Record<string, { color: string; bg: string }> = {
  ADMIN: { color: '#1F5557', bg: 'rgba(31,85,87,0.1)' },
  MODERATOR: { color: '#2A6A85', bg: 'rgba(6,182,212,0.1)' },
  STAFF: { color: '#2F7D52', bg: 'rgba(16,185,129,0.1)' },
  SHOP: { color: '#A9741A', bg: 'rgba(245,158,11,0.1)' },
};

const STATUS_LABELS = { active: 'Hoạt động', locked: 'Tạm khóa' };

export const AdminAccessPage = () => {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [selectedRole, setSelectedRole] = useState('ADMIN');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('all');
  const [search, setSearch] = useState('');
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<StaffMember | null>(null);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState('STAFF');
  const [formPerms, setFormPerms] = useState<string[]>([]);
  const [formPassword, setFormPassword] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [changingId, setChangingId] = useState<string | null>(null);

    const toStaffMember = (s: any): StaffMember => {
    const role = s.role ?? 'STAFF';
    const color = ROLE_COLORS[role] ?? ROLE_COLORS.STAFF;
    return {
      id: String(s.id),
      name: s.name ?? '',
      email: s.email ?? '',
      role,
      roleColor: color.color,
      roleBg: color.bg,
      permissions: Array.isArray(s.permissions) ? s.permissions : [],
      lastLogin: s.lastLogin ? new Date(s.lastLogin).toLocaleString('vi-VN') : '—',
      status: s.status === 'locked' ? 'locked' : 'active',
    };
  };

    const loadStaff = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.staff({ pageSize: 200 });
      setStaffList(res.staff.map(toStaffMember));
    } catch (err) {
      console.error('Load staff failed:', err);
      toast({
        title: 'Tải danh sách nhân viên thất bại',
        message: err instanceof Error ? err.message : 'Vui lòng thử lại.',
        variant: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadStaff();
  }, [loadStaff]);

  const openAdd = () => {
    setEditTarget(null);
    setFormName(''); setFormEmail(''); setFormRole('STAFF');
    setFormPerms(ROLE_PERMS.STAFF);
    setFormPassword('');
    setFormErrors({});
    setShowModal(true);
  };

  const openEdit = (member: StaffMember) => {
    setEditTarget(member);
    setFormName(member.name); setFormEmail(member.email); setFormRole(member.role);
    setFormPerms(member.permissions);
    setFormPassword('');
    setFormErrors({});
    setShowModal(true);
  };

  const handleRoleChange = (newRole: string) => {
    setFormRole(newRole);
    setFormPerms(ROLE_PERMS[newRole] || []);
  };

  const togglePerm = (perm: string) => {
    setFormPerms(prev => prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!formName.trim()) e.name = 'Vui lòng nhập họ tên';
    if (!formEmail.trim()) e.email = 'Vui lòng nhập email';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formEmail)) e.email = 'Email không hợp lệ';

    if (!editTarget && formPassword.length < 6) e.password = 'Mật khẩu tối thiểu 6 ký tự';
    return e;
  };

    const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setFormErrors(e); return; }

    setIsSubmitting(true);
    try {
      if (editTarget) {
        const updated = await adminApi.updateStaff(editTarget.id, {
          name: formName.trim(),
          email: formEmail.trim(),
          role: formRole,
          permissions: formPerms,
        });
        setStaffList(prev =>
          prev.map(s => (s.id === editTarget.id ? toStaffMember(updated) : s)),
        );
        toast({ title: 'Đã cập nhật thành viên', variant: 'success' });
      } else {
        const created = await adminApi.createStaff({
          name: formName.trim(),
          email: formEmail.trim(),
          password: formPassword,
          role: formRole,
          permissions: formPerms,
        });
        setStaffList(prev => [toStaffMember(created), ...prev]);
        toast({ title: 'Đã thêm thành viên', variant: 'success' });
      }
      setShowModal(false);
    } catch (err) {
      console.error('Save staff failed:', err);
      toast({
        title: 'Lưu thất bại',
        message: err instanceof Error ? err.message : 'Vui lòng thử lại.',
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

    const handleToggleStatus = async (id: string) => {
    const member = staffList.find(s => s.id === id);
    if (!member) return;
    const nextStatus = member.status === 'active' ? 'locked' : 'active';
    try {
      const updated = await adminApi.updateStaff(id, { status: nextStatus });
      setStaffList(prev =>
        prev.map(s => (s.id === id ? { ...s, ...toStaffMember(updated) } : s)),
      );
      toast({
        title: nextStatus === 'locked' ? 'Đã khoá tài khoản' : 'Đã mở khoá tài khoản',
        variant: 'success',
      });
    } catch (err) {
      console.error('Toggle staff status failed:', err);
      toast({
        title: 'Cập nhật thất bại',
        message: err instanceof Error ? err.message : 'Vui lòng thử lại.',
        variant: 'error',
      });
    }
  };

    const handleDelete = async (id: string) => {
    setIsSubmitting(true);
    try {
      await adminApi.deleteStaff(id);
      setStaffList(prev => prev.filter(s => s.id !== id));
      toast({ title: 'Đã xóa thành viên', variant: 'success' });
    } catch (err) {
      console.error('Delete staff failed:', err);
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

    const handleInlineRoleChange = async (id: string, newRole: string) => {
    setChangingId(null);
    const member = staffList.find(s => s.id === id);
    if (!member || member.role === newRole) return;

    const permissions = ROLE_PERMS[newRole] || [];
    try {
      const updated = await adminApi.updateStaff(id, {
        role: newRole,
        permissions,
      });
      setStaffList(prev =>
        prev.map(s => (s.id === id ? toStaffMember(updated) : s)),
      );
      toast({ title: 'Đã đổi vai trò', variant: 'success' });
    } catch (err) {
      console.error('Change staff role failed:', err);
      toast({
        title: 'Đổi vai trò thất bại',
        message: err instanceof Error ? err.message : 'Vui lòng thử lại.',
        variant: 'error',
      });
    }
  };

  const filtered = staffList.filter(s => {
    if (selectedRoleFilter !== 'all' && s.role !== selectedRoleFilter) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const roleCounts = ROLE_OPTIONS.reduce<Record<string, number>>((acc, r) => {
    acc[r.name] = staffList.filter(s => s.role === r.name).length;
    return acc;
  }, {});

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <div>
          <h1 className="admin-page__title">Quản Lý Phân Quyền</h1>
          <p className="admin-page__subtitle">Cấp quyền, quản lý vai trò và nhân viên hệ thống</p>
        </div>
        <div className="admin-page-header__actions">
          <button className="btn btn-primary" onClick={openAdd}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Thêm nhân viên
          </button>
        </div>
      </div>

      {}
      <div className="admin-section">
        <div className="admin-section__header">
          <h3 className="admin-section__title">Vai trò hệ thống</h3>
        </div>
        <div className="role-cards">
          {ROLE_OPTIONS.map(r => (
            <div
              key={r.name}
              className={`role-card ${selectedRole === r.name ? 'role-card--selected' : ''}`}
              onClick={() => setSelectedRole(r.name)}
            >
              <div className="role-card__dot" style={{ background: r.color }} />
              <div className="role-card__info">
                <p className="role-card__name">{r.label}</p>
                <p className="role-card__desc">{r.desc}</p>
              </div>
              <span className="role-card__count" style={{ background: r.bg, color: r.color }}>{roleCounts[r.name] || 0}</span>
            </div>
          ))}
        </div>
      </div>

      {}
      <div className="admin-section">
        <div className="admin-section__header">
          <h3 className="admin-section__title">Ma trận quyền hạn — {ROLE_OPTIONS.find(r => r.name === selectedRole)?.label}</h3>
        </div>
        <div className="perm-matrix">
          <div className="perm-matrix__header">
            <div className="perm-matrix__role-header">Quyền hạn</div>
            {ROLE_OPTIONS.map(r => (
              <div key={r.name} className={`perm-matrix__role-header ${selectedRole === r.name ? 'active' : ''}`} style={{ color: r.color }}>
                {r.label}
              </div>
            ))}
          </div>
          {ALL_PERMISSIONS.map(perm => (
            <div key={perm} className="perm-matrix__row">
              <div className="perm-matrix__perm-name">{perm}</div>
              {ROLE_OPTIONS.map(r => (
                <div key={r.name} className="perm-matrix__cell">
                  {ROLE_PERMS[r.name]?.includes(perm)
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2F7D52" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-border)" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  }
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {}
      <div className="admin-section">
        <div className="admin-section__header">
          <h3 className="admin-section__title">Danh sách nhân viên &amp; cửa hàng</h3>
          <span className="admin-page__meta">{staffList.length} thành viên</span>
        </div>

        {}
        <div className="access-toolbar">
          <div className="access-search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Tìm theo tên hoặc email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="access-role-filter">
            <button
              className={`access-role-btn ${selectedRoleFilter === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedRoleFilter('all')}
            >Tất cả</button>
            {ROLE_OPTIONS.map(r => (
              <button
                key={r.name}
                className={`access-role-btn ${selectedRoleFilter === r.name ? 'active' : ''}`}
                style={selectedRoleFilter === r.name ? { background: r.bg, color: r.color, borderColor: r.color } : {}}
                onClick={() => setSelectedRoleFilter(r.name)}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="access-table">
          <div className="access-table__head">
            <span>Thành viên</span>
            <span>Vai trò</span>
            <span>Quyền hạn</span>
            <span>Đăng nhập gần nhất</span>
            <span>Trạng thái</span>
            <span>Thao tác</span>
          </div>
          {filtered.length === 0 ? (
            <div className="access-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <p>{isLoading ? 'Đang tải danh sách thành viên...' : 'Không tìm thấy thành viên nào'}</p>
            </div>
          ) : filtered.map(s => (
            <div key={s.id} className="access-table__row">
              <div className="access-table__user">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=staff${s.id}`} alt="" className="admin-avatar" />
                <div>
                  <p className="access-table__name">{s.name}</p>
                  <p className="access-table__email">{s.email}</p>
                </div>
              </div>
              <div>
                {changingId === s.id ? (
                  <select
                    className="input role-inline-select"
                    defaultValue={s.role}
                    autoFocus
                    onChange={e => handleInlineRoleChange(s.id, e.target.value)}
                    onBlur={() => setChangingId(null)}
                  >
                    {ROLE_OPTIONS.map(r => (
                      <option key={r.name} value={r.name}>{r.label}</option>
                    ))}
                  </select>
                ) : (
                  <button
                    className="access-table__role-badge"
                    style={{ background: s.roleBg, color: s.roleColor, cursor: 'pointer' }}
                    onClick={() => setChangingId(s.id)}
                    title="Nhấn để đổi vai trò"
                  >
                    {s.role} ↕
                  </button>
                )}
              </div>
              <div className="access-table__permissions">
                {s.permissions.slice(0, 3).map(p => <span key={p} className="permission-tag">{p}</span>)}
                {s.permissions.length > 3 && (
                  <span className="permission-tag permission-tag--more">+{s.permissions.length - 3}</span>
                )}
              </div>
              <div className="access-table__login">{s.lastLogin}</div>
              <div>
                <span className={`admin-status ${s.status === 'active' ? 'admin-status--active' : 'admin-status--locked'}`}>
                  {STATUS_LABELS[s.status]}
                </span>
              </div>
              <div className="access-table__actions">
                <button className="btn btn-sm btn-secondary" onClick={() => openEdit(s)}>Sửa</button>
                <button
                  className={`btn btn-sm btn-outline`}
                  onClick={() => void handleToggleStatus(s.id)}
                >
                  {s.status === 'active' ? 'Khóa' : 'Mở khóa'}
                </button>
                <button
                  className="btn btn-sm btn-outline"
                  style={{ color: 'var(--color-danger)' }}
                  onClick={() => setPendingDelete(s.id)}
                >
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box modal-box--wide" onClick={e => e.stopPropagation()}>
            <div className="modal-box__header">
              <h2 className="modal-box__title">{editTarget ? 'Sửa thành viên' : 'Thêm thành viên mới'}</h2>
              <button className="modal-box__close" onClick={() => setShowModal(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="modal-box__body">
              <div className="form-row-2">
                <div className="input-group">
                  <label className="input-label">Họ tên <span>*</span></label>
                  <input type="text" className={`input ${formErrors.name ? 'input--error' : ''}`} placeholder="Nhập họ tên" value={formName} onChange={e => setFormName(e.target.value)} />
                  {formErrors.name && <span className="input-error">{formErrors.name}</span>}
                </div>
                <div className="input-group">
                  <label className="input-label">Email <span>*</span></label>
                  <input type="email" className={`input ${formErrors.email ? 'input--error' : ''}`} placeholder="email@henzo.com" value={formEmail} onChange={e => setFormEmail(e.target.value)} />
                  {formErrors.email && <span className="input-error">{formErrors.email}</span>}
                </div>
              </div>

              {!editTarget && (
                <div className="input-group">
                  <label className="input-label">Mật khẩu <span>*</span></label>
                  <input
                    type="password"
                    className={`input ${formErrors.password ? 'input--error' : ''}`}
                    placeholder="Tối thiểu 6 ký tự"
                    value={formPassword}
                    onChange={e => setFormPassword(e.target.value)}
                  />
                  {formErrors.password && <span className="input-error">{formErrors.password}</span>}
                </div>
              )}

              <div className="input-group">
                <label className="input-label">Vai trò</label>
                <div className="role-select-grid">
                  {ROLE_OPTIONS.map(r => (
                    <button
                      key={r.name}
                      type="button"
                      className={`role-option-card ${formRole === r.name ? 'active' : ''}`}
                      style={formRole === r.name ? { borderColor: r.color, background: r.bg } : {}}
                      onClick={() => handleRoleChange(r.name)}
                    >
                      <div className="role-option-card__dot" style={{ background: r.color }} />
                      <div>
                        <p className="role-option-card__name">{r.label}</p>
                        <p className="role-option-card__desc">{r.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Quyền hạn (tuỳ chỉnh)</label>
                <div className="perm-check-grid">
                  {ALL_PERMISSIONS.map(perm => (
                    <label key={perm} className={`perm-check-item ${formPerms.includes(perm) ? 'checked' : ''}`}>
                      <input
                        type="checkbox"
                        checked={formPerms.includes(perm)}
                        onChange={() => togglePerm(perm)}
                      />
                      <span>{perm}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-box__footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Hủy</button>
              <button className="btn btn-primary" onClick={() => void handleSave()} disabled={isSubmitting}>
                {isSubmitting ? 'Đang lưu...' : editTarget ? 'Lưu thay đổi' : 'Thêm thành viên'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!pendingDelete}
        title="Xóa thành viên"
        message="Bạn có chắc muốn xóa thành viên này? Tài khoản sẽ mất quyền truy cập quản trị ngay lập tức."
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
