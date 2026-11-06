import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts';
import { ROUTES } from '../../../constants/routes';
import { Icon } from '../../../components/common/Icon';
import './RegisterPage.css';

export const RegisterPage = () => {
  const { register, isLoading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '',
  });
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [agreed, setAgreed] = useState(false);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Vui lòng nhập họ tên.';
    if (!form.email.trim()) errs.email = 'Vui lòng nhập email.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Email không hợp lệ.';
    if (!form.phone.trim()) errs.phone = 'Vui lòng nhập số điện thoại.';
    else if (!/^0[0-9]{9}$/.test(form.phone.replace(/\s/g, ''))) errs.phone = 'Số điện thoại không hợp lệ.';
    if (!form.password) errs.password = 'Vui lòng nhập mật khẩu.';
    else if (form.password.length < 6) errs.password = 'Mật khẩu phải tối thiểu 6 ký tự.';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Mật khẩu xác nhận không khớp.';
    if (!agreed) errs.agreed = 'Bạn cần đồng ý với điều khoản sử dụng.';
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    const result = await register({
      name: form.name,
      email: form.email,
      phone: form.phone,
      password: form.password,
    });
    if (result.success) {
      navigate(ROUTES.LOGIN);
    } else {
      setErrors({ email: result.message });
    }
  };

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm({ ...form, [key]: e.target.value });
      if (errors[key]) setErrors({ ...errors, [key]: '' });
    },
  });

  return (
    <div className="register-page">
      <div className="register-page__card">
        <div className="register-page__header">
          <h1 className="register-page__title">Tạo tài khoản</h1>
          <p className="register-page__subtitle">
            Điền thông tin bên dưới để bắt đầu mua sắm cùng HenzoStore.
          </p>
        </div>

        <form className="register-page__form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label" htmlFor="reg-name">
              Họ và tên
            </label>
            <div className="register-page__field">
              <span className="register-page__field-icon">
                <Icon name="user" size={17} />
              </span>
              <input
                id="reg-name"
                type="text"
                className={`input register-page__input ${errors.name ? 'input-error' : ''}`}
                placeholder="Nhập họ và tên"
                {...field('name')}
                autoComplete="name"
              />
            </div>
            {errors.name && <span className="input-error-message">{errors.name}</span>}
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="reg-email">
              Email
            </label>
            <div className="register-page__field">
              <span className="register-page__field-icon">
                <Icon name="mail" size={17} />
              </span>
              <input
                id="reg-email"
                type="email"
                className={`input register-page__input ${errors.email ? 'input-error' : ''}`}
                placeholder="Nhập email"
                {...field('email')}
                autoComplete="email"
              />
            </div>
            {errors.email && <span className="input-error-message">{errors.email}</span>}
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="reg-phone">
              Số điện thoại
            </label>
            <div className="register-page__field">
              <span className="register-page__field-icon">
                <Icon name="phone-call" size={17} />
              </span>
              <input
                id="reg-phone"
                type="tel"
                className={`input register-page__input ${errors.phone ? 'input-error' : ''}`}
                placeholder="0xxx xxx xxx"
                {...field('phone')}
                autoComplete="tel"
              />
            </div>
            {errors.phone && <span className="input-error-message">{errors.phone}</span>}
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="reg-password">
              Mật khẩu
            </label>
            <div className="register-page__field">
              <span className="register-page__field-icon">
                <Icon name="lock" size={17} />
              </span>
              <input
                id="reg-password"
                type={showPass ? 'text' : 'password'}
                className={`input register-page__input ${errors.password ? 'input-error' : ''}`}
                placeholder="Tối thiểu 6 ký tự"
                {...field('password')}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="register-page__field-action"
                onClick={() => setShowPass(!showPass)}
                aria-label={showPass ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                <Icon name="eye" size={17} />
              </button>
            </div>
            {errors.password && <span className="input-error-message">{errors.password}</span>}
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="reg-confirm">
              Xác nhận mật khẩu
            </label>
            <div className="register-page__field">
              <span className="register-page__field-icon">
                <Icon name="shield" size={17} />
              </span>
              <input
                id="reg-confirm"
                type={showPass ? 'text' : 'password'}
                className={`input register-page__input ${errors.confirmPassword ? 'input-error' : ''}`}
                placeholder="Nhập lại mật khẩu"
                {...field('confirmPassword')}
                autoComplete="new-password"
              />
            </div>
            {errors.confirmPassword && <span className="input-error-message">{errors.confirmPassword}</span>}
          </div>

          <div className="input-group">
            <label className="checkbox-label register-page__agree">
              <input
                type="checkbox"
                checked={agreed}
                onChange={e => {
                  setAgreed(e.target.checked);
                  if (errors.agreed) setErrors({ ...errors, agreed: '' });
                }}
              />
              <span className="checkbox-custom" />
              <span>
                Tôi đồng ý với <a href="/terms" className="register-page__terms">Điều khoản sử dụng</a> và{' '}
                <a href="/privacy" className="register-page__terms">Chính sách bảo mật</a>
              </span>
            </label>
            {errors.agreed && <span className="input-error-message">{errors.agreed}</span>}
          </div>

          <button type="submit" className="btn btn-primary btn-full register-page__submit" disabled={isLoading}>
            {isLoading ? <span className="spinner" /> : null}
            {isLoading ? 'Đang đăng ký...' : 'Đăng ký'}
          </button>
        </form>

        <p className="register-page__footer">
          Đã có tài khoản?{' '}
          <Link to={ROUTES.LOGIN} className="register-page__link">
            Đăng nhập ngay
          </Link>
        </p>
      </div>
    </div>
  );
};
