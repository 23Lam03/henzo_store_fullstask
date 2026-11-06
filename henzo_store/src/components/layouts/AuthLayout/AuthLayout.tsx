import { Outlet, Link } from 'react-router-dom';
import { BrandMark } from '../../common/BrandMark/BrandMark';
import './AuthLayout.css';

export const AuthLayout = () => {
  return (
    <div className="auth-layout">
      <div className="auth-layout__glow" aria-hidden="true" />
      <div className="auth-layout__inner">
        <header className="auth-layout__brand">
          <Link to="/" className="auth-layout__logo">
            <BrandMark size={38} tone="light" />
            <span className="auth-layout__logo-text">
              Henzo<em>Store</em>
            </span>
          </Link>
        </header>

        <main className="auth-layout__main">
          <div className="auth-layout__form-wrapper">
            <Outlet />
          </div>
        </main>

        <footer className="auth-layout__footer">
          <span>&copy; {new Date().getFullYear()} Henzo Store</span>
          <span className="auth-layout__footer-sep" aria-hidden="true" />
          <span>Giải pháp bán lẻ thiết bị công nghệ</span>
        </footer>
      </div>
    </div>
  );
};
