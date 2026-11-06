import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Icon, type IconName } from '../Icon';
import './EmptyState.css';

interface EmptyStateProps {
  icon?: IconName;
  title: string;
  description?: string;
  /** Nút chính. */
  action?: { label: string; to: string };
  /** Nút phụ. */
  secondaryAction?: { label: string; to: string };
  /** Nội dung tuỳ chọn hiển thị dưới các nút. */
  children?: ReactNode;
}

/**
 * Trạng thái rỗng dùng chung cho toàn bộ trang.
 * Thay thế các block "trống" tự viết rời rạc để giao diện đồng nhất.
 */
export const EmptyState = ({
  icon = 'package',
  title,
  description,
  action,
  secondaryAction,
  children,
}: EmptyStateProps) => (
  <div className="empty-state">
    <span className="empty-state__icon">
      <Icon name={icon} size={32} />
    </span>
    <h3 className="empty-state__title">{title}</h3>
    {description && <p className="empty-state__desc">{description}</p>}
    {(action || secondaryAction) && (
      <div className="empty-state__actions">
        {action && (
          <Link to={action.to} className="btn btn-primary">
            {action.label}
          </Link>
        )}
        {secondaryAction && (
          <Link to={secondaryAction.to} className="btn btn-secondary">
            {secondaryAction.label}
          </Link>
        )}
      </div>
    )}
    {children}
  </div>
);
