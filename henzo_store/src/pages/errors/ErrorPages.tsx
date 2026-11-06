import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import './ErrorPages.css';

interface ErrorPageProps {
  code: number;
  title: string;
  description: string;
}

const ErrorPage = ({ code, title, description }: ErrorPageProps) => (
  <div className="error-page">
    <div className="error-page__inner">
      <div className="error-page__graphic">
        <span className="error-page__code">{code}</span>
        <div className="error-page__illustration">
          {code === 404 && (
            <svg width="200" height="160" viewBox="0 0 200 160" fill="none">
              <circle cx="100" cy="80" r="60" fill="rgba(31,85,87,0.07)" />
              <text x="100" y="95" textAnchor="middle" fontSize="60" fontWeight="600" fill="var(--color-primary)" opacity="0.15">{code}</text>
              <circle cx="100" cy="80" r="30" stroke="var(--color-primary)" strokeWidth="2" fill="none" opacity="0.3" />
              <path d="M70 110 L85 125 L130 80" stroke="var(--color-primary)" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
              <circle cx="65" cy="130" r="8" fill="var(--color-border)" />
              <circle cx="135" cy="130" r="8" fill="var(--color-border)" />
            </svg>
          )}
          {code === 403 && (
            <svg width="200" height="160" viewBox="0 0 200 160" fill="none">
              <circle cx="100" cy="70" r="50" fill="rgba(180,50,47,0.07)" />
              <text x="100" y="85" textAnchor="middle" fontSize="50" fontWeight="600" fill="var(--color-danger)" opacity="0.15">{code}</text>
              <path d="M70 110 L100 70 L130 110" stroke="var(--color-danger)" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
              <rect x="90" y="70" width="20" height="20" rx="10" fill="var(--color-danger)" opacity="0.3" />
              <circle cx="100" cy="140" r="8" fill="var(--color-border)" />
            </svg>
          )}
          {code === 500 && (
            <svg width="200" height="160" viewBox="0 0 200 160" fill="none">
              <circle cx="100" cy="80" r="60" fill="rgba(169,116,26,0.07)" />
              <text x="100" y="95" textAnchor="middle" fontSize="60" fontWeight="600" fill="var(--color-warning)" opacity="0.15">{code}</text>
              <path d="M75 90 L95 70 L105 80 L125 60" stroke="var(--color-warning)" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.4" />
              <circle cx="80" cy="120" r="5" fill="var(--color-warning)" opacity="0.4" />
              <circle cx="120" cy="120" r="5" fill="var(--color-warning)" opacity="0.4" />
              <path d="M90 140 L100 130 L110 140" stroke="var(--color-warning)" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.4" />
            </svg>
          )}
        </div>
      </div>
      <div className="error-page__content">
        <h1 className="error-page__title">{title}</h1>
        <p className="error-page__desc">{description}</p>
        <div className="error-page__actions">
          <Link to={ROUTES.HOME} className="btn btn-primary btn-lg">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            Về trang chủ
          </Link>
          <button onClick={() => window.history.back()} className="btn btn-outline btn-lg">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Quay lại
          </button>
        </div>
      </div>
    </div>
  </div>
);

export const NotFoundPage = () => (
  <ErrorPage
    code={404}
    title="Không Tìm Thấy Trang"
    description="Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển. Vui lòng kiểm tra lại đường dẫn."
  />
);

export const ForbiddenPage = () => (
  <ErrorPage
    code={403}
    title="Không Có Quyền Truy Cập"
    description="Bạn không có quyền truy cập trang này. Vui lòng đăng nhập với tài khoản có quyền phù hợp hoặc liên hệ quản trị viên."
  />
);

export const ServerErrorPage = () => (
  <ErrorPage
    code={500}
    title="Lỗi Hệ Thống"
    description="Đã xảy ra lỗi từ phía máy chủ. Vui lòng thử lại sau hoặc liên hệ bộ phận kỹ thuật."
  />
);
