import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';
import { Icon } from '../../../components/common/Icon';
import './ForgotPasswordPage.css';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError('Vui lòng nhập email.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Email không hợp lệ.'); return; }
    setLoading(true);
    setError('');
    await new Promise(r => setTimeout(r, 1500));
    setSent(true);
    setLoading(false);
  };

  return (
    <div className="forgot-page">
      <div className="forgot-page__card">
        {sent ? (
          <div className="forgot-page__success">
            <div className="forgot-page__icon">
              <Icon name="check" size={30} />
            </div>
            <h1 className="forgot-page__title">Đã gửi liên kết đặt lại!</h1>
            <p className="forgot-page__text">
              Chúng tôi đã gửi liên kết đặt lại mật khẩu đến <strong>{email}</strong>. Vui lòng kiểm tra hộp thư và làm theo hướng dẫn.
            </p>
            <Link to={ROUTES.LOGIN} className="btn btn-primary btn-full forgot-page__submit">
              Quay lại đăng nhập
            </Link>
          </div>
        ) : (
          <>
            <div className="forgot-page__header">
              <h1 className="forgot-page__title">Quên mật khẩu?</h1>
              <p className="forgot-page__subtitle">
                Nhập email của bạn và chúng tôi sẽ gửi liên kết đặt lại mật khẩu.
              </p>
            </div>

            {error && (
              <div className="forgot-page__error" role="alert">
                <Icon name="alert" size={16} />
                <span>{error}</span>
              </div>
            )}

            <form className="forgot-page__form" onSubmit={handleSubmit}>
              <div className="input-group">
                <label className="input-label" htmlFor="forgot-email">
                  Email
                </label>
                <div className="forgot-page__field">
                  <span className="forgot-page__field-icon">
                    <Icon name="mail" size={17} />
                  </span>
                  <input
                    id="forgot-email"
                    type="email"
                    className={`input forgot-page__input ${error ? 'input-error' : ''}`}
                    placeholder="Nhập email đã đăng ký"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-primary btn-full forgot-page__submit" disabled={loading}>
                {loading ? <span className="spinner" /> : null}
                {loading ? 'Đang gửi...' : 'Gửi liên kết'}
              </button>
            </form>

            <p className="forgot-page__footer">
              Nhớ mật khẩu rồi?{' '}
              <Link to={ROUTES.LOGIN} className="forgot-page__link">
                Đăng nhập ngay
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
};
