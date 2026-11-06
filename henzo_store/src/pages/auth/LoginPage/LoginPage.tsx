import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts';
import { ROUTES } from '../../../constants/routes';
import { Icon } from '../../../components/common/Icon';
import './LoginPage.css';

export const LoginPage = () => {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', rememberMe: false });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }
    const result = await login(form.email, form.password, form.rememberMe);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }
  };

  const fillDemo = (role: 'admin' | 'shop' | 'customer') => {
    const accounts = {
      admin: { email: 'admin@henzo.com', password: 'admin123' },
      shop: { email: 'shop@henzo.com', password: '123456' },
      customer: { email: 'customer@henzo.com', password: '123456' },
    };
    setForm({ ...form, ...accounts[role] });
  };

  return (
    <div className="login-page">
      <div className="login-page__card">
        <div className="login-page__header">
          <h1 className="login-page__title">Đăng nhập</h1>
          <p className="login-page__subtitle">
            Nhập thông tin tài khoản của bạn để tiếp tục mua sắm.
          </p>
        </div>

        {error && (
          <div className="login-page__error hz-shake" role="alert">
            <Icon name="alert" size={16} />
            <span>{error}</span>
          </div>
        )}
        <form className="login-page__form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label" htmlFor="login-email">
              Email
            </label>
            <div className="login-page__field">
              <span className="login-page__field-icon">
                <Icon name="mail" size={17} />
              </span>
              <input
                id="login-email"
                type="email"
                className={`input login-page__input ${error && !form.email ? 'input-error' : ''}`}
                placeholder="Nhập email của bạn"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                autoComplete="email"
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="login-password">
              Mật khẩu
            </label>
            <div className="login-page__field">
              <span className="login-page__field-icon">
                <Icon name="lock" size={17} />
              </span>
              <input
                id="login-password"
                type={showPass ? 'text' : 'password'}
                className={`input login-page__input ${error && !form.password ? 'input-error' : ''}`}
                placeholder="Nhập mật khẩu"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="login-page__field-action"
                onClick={() => setShowPass(!showPass)}
                aria-label={showPass ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                <Icon name="eye" size={17} />
              </button>
            </div>
          </div>

          <div className="login-page__options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={form.rememberMe}
                onChange={e => setForm({ ...form, rememberMe: e.target.checked })}
              />
              <span className="checkbox-custom" />
              Ghi nhớ đăng nhập
            </label>
            <Link to={ROUTES.FORGOT_PASSWORD} className="login-page__forgot">
              Quên mật khẩu?
            </Link>
          </div>

          <button type="submit" className="btn btn-primary btn-full login-page__submit" disabled={isLoading}>
            {isLoading ? <span className="spinner" /> : null}
            {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <div className="login-page__divider">
          <span>hoặc đăng nhập nhanh với</span>
        </div>

        <div className="login-page__socials">
          <button type="button" className="btn btn-secondary btn-full login-page__social">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google
          </button>
          <button type="button" className="btn btn-secondary btn-full login-page__social">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            Facebook
          </button>
        </div>

        <div className="login-page__demo">
          <p className="login-page__demo-title">Tài khoản demo</p>
          <div className="login-page__demo-btns">
            <button type="button" className="btn btn-sm btn-secondary" onClick={() => fillDemo('admin')}>
              Admin
            </button>
            <button type="button" className="btn btn-sm btn-secondary" onClick={() => fillDemo('shop')}>
              Shop
            </button>
            <button type="button" className="btn btn-sm btn-secondary" onClick={() => fillDemo('customer')}>
              Customer
            </button>
          </div>
        </div>

        <p className="login-page__footer">
          Chưa có tài khoản?{' '}
          <Link to={ROUTES.REGISTER} className="login-page__link">
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  );
};
