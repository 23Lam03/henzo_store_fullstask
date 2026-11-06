import { useState } from 'react';
import './ContactPage.css';

const OFFICE_BRANCHES = [
  {
    city: 'TP. Hồ Chí Minh',
    address: '123 Nguyễn Trãi, Quận 1, TP. Hồ Chí Minh',
    phone: '0901 234 567',
    email: 'hcm@henzo.vn',
    hours: '8:00 - 21:00 (Thứ 2 - CN)',
  },
  {
    city: 'Hà Nội',
    address: '456 Trần Duy Hưng, Quận Cầu Giấy, Hà Nội',
    phone: '0902 345 678',
    email: 'hanoi@henzo.vn',
    hours: '8:00 - 21:00 (Thứ 2 - CN)',
  },
  {
    city: 'Đà Nẵng',
    address: '789 Nguyễn Văn Linh, Quận Hải Châu, Đà Nẵng',
    phone: '0903 456 789',
    email: 'danang@henzo.vn',
    hours: '8:00 - 20:00 (Thứ 2 - CN)',
  },
];

const SOCIAL_LINKS = [
  {
    name: 'Facebook',
    handle: '@HenzoStoreVN',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
    color: '#1877F2',
    href: '#',
  },
  {
    name: 'Zalo',
    handle: 'HenzoStore',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
      </svg>
    ),
    color: '#0068FF',
    href: '#',
  },
  {
    name: 'Instagram',
    handle: '@henzostore_vn',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
      </svg>
    ),
    color: '#E4405F',
    href: '#',
  },
  {
    name: 'YouTube',
    handle: 'HenzoStore Channel',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ),
    color: '#FF0000',
    href: '#',
  },
];

export const ContactPage = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Vui lòng nhập họ và tên';
    if (!form.email.trim()) e.email = 'Vui lòng nhập email';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email không hợp lệ';
    if (!form.subject.trim()) e.subject = 'Vui lòng chọn chủ đề';
    if (!form.message.trim()) e.message = 'Vui lòng nhập nội dung';
    else if (form.message.trim().length < 20) e.message = 'Nội dung phải ít nhất 20 ký tự';
    return e;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length > 0) { setErrors(e2); return; }
    setErrors({});
    setSubmitted(true);
  };

  const handleChange = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  if (submitted) {
    return (
      <div className="contact-page">
        <div className="contact-page__success">
          <div className="contact-success">
            <div className="contact-success__icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <h2 className="contact-success__title">Gửi liên hệ thành công!</h2>
            <p className="contact-success__msg">
              Cảm ơn bạn đã liên hệ với HenzoStore. Chúng tôi sẽ phản hồi trong vòng <strong>24 giờ</strong> làm việc.
            </p>
            <p className="contact-success__detail">
              Mã liên hệ: <strong>LH-{Date.now().toString().slice(-6)}</strong><br/>
              Email phản hồi: <strong>{form.email}</strong>
            </p>
            <button className="btn btn-primary" onClick={() => { setSubmitted(false); setForm({ name: '', email: '', phone: '', subject: '', message: '' }); }}>
              Gửi liên hệ khác
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="contact-page">
      {/* Page Header */}
      <div className="contact-hero">
        <div className="container">
          <h1 className="contact-hero__title">Liên hệ HenzoStore</h1>
          <p className="contact-hero__subtitle">
            Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn. Đừng ngần ngại liên hệ qua bất kỳ kênh nào bên dưới.
          </p>
        </div>
      </div>

      <div className="container">
        <div className="contact-layout">
          {/* Left: Form */}
          <div className="contact-form-section">
            <div className="card">
              <div className="card-header">
                <h2 className="card-header__title">Gửi tin nhắn</h2>
                <p className="card-header__subtitle">Điền thông tin bên dưới, chúng tôi sẽ phản hồi sớm nhất có thể</p>
              </div>
              <div className="card-body">
                <form className="contact-form" onSubmit={handleSubmit} noValidate>
                  <div className="form-row-2">
                    <div className="input-group">
                      <label className="input-label">Họ và tên <span>*</span></label>
                      <input
                        type="text"
                        className={`input ${errors.name ? 'input--error' : ''}`}
                        placeholder="Nhập họ và tên của bạn"
                        value={form.name}
                        onChange={handleChange('name')}
                      />
                      {errors.name && <span className="input-error">{errors.name}</span>}
                    </div>
                    <div className="input-group">
                      <label className="input-label">Số điện thoại</label>
                      <input
                        type="tel"
                        className="input"
                        placeholder="0901 234 567"
                        value={form.phone}
                        onChange={handleChange('phone')}
                      />
                    </div>
                  </div>

                  <div className="input-group">
                    <label className="input-label">Email <span>*</span></label>
                    <input
                      type="email"
                      className={`input ${errors.email ? 'input--error' : ''}`}
                      placeholder="email@example.com"
                      value={form.email}
                      onChange={handleChange('email')}
                    />
                    {errors.email && <span className="input-error">{errors.email}</span>}
                  </div>

                  <div className="input-group">
                    <label className="input-label">Chủ đề <span>*</span></label>
                    <select
                      className={`input ${errors.subject ? 'input--error' : ''}`}
                      value={form.subject}
                      onChange={handleChange('subject')}
                    >
                      <option value="">-- Chọn chủ đề --</option>
                      <option value="order">Tư vấn đơn hàng</option>
                      <option value="product">Tư vấn sản phẩm</option>
                      <option value="payment">Thanh toán &amp; giao dịch</option>
                      <option value="warranty">Bảo hành &amp; đổi trả</option>
                      <option value="complaint">Khiếu nại</option>
                      <option value="cooperation">Hợp tác kinh doanh</option>
                      <option value="other">Khác</option>
                    </select>
                    {errors.subject && <span className="input-error">{errors.subject}</span>}
                  </div>

                  <div className="input-group">
                    <label className="input-label">Nội dung <span>*</span></label>
                    <textarea
                      className={`input input-textarea ${errors.message ? 'input--error' : ''}`}
                      rows={5}
                      placeholder="Mô tả chi tiết vấn đề hoặc câu hỏi của bạn..."
                      value={form.message}
                      onChange={handleChange('message')}
                    />
                    {errors.message && <span className="input-error">{errors.message}</span>}
                  </div>

                  <button type="submit" className="btn btn-primary btn-full">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="22" y1="2" x2="11" y2="13"/>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                    Gửi liên hệ
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Right: Info */}
          <div className="contact-info-section">
            {/* Quick Contact */}
            <div className="card contact-quick-card">
              <h3 className="contact-quick-card__title">Liên hệ nhanh</h3>
              <div className="contact-quick-list">
                <a href="tel:19001234" className="contact-quick-item">
                  <div className="contact-quick-item__icon" style={{ background: 'rgba(239,68,68,0.1)', color: '#B4322F' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .82h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 15.5v.92z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="contact-quick-item__label">Hotline 24/7</p>
                    <p className="contact-quick-item__value">1900 1234</p>
                  </div>
                </a>
                <a href="mailto:contact@henzo.vn" className="contact-quick-item">
                  <div className="contact-quick-item__icon" style={{ background: 'rgba(31,85,87,0.1)', color: '#1F5557' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                  </div>
                  <div>
                    <p className="contact-quick-item__label">Email</p>
                    <p className="contact-quick-item__value">contact@henzo.vn</p>
                  </div>
                </a>
                <a href="#" className="contact-quick-item">
                  <div className="contact-quick-item__icon" style={{ background: 'rgba(6,182,212,0.1)', color: '#2A6A85' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="contact-quick-item__label">Live Chat</p>
                    <p className="contact-quick-item__value">Trò chuyện trực tuyến</p>
                  </div>
                </a>
              </div>
            </div>

            {/* Social */}
            <div className="card contact-social-card">
              <h3 className="contact-social-card__title">Kết nối mạng xã hội</h3>
              <div className="contact-social-list">
                {SOCIAL_LINKS.map(s => (
                  <a key={s.name} href={s.href} className="contact-social-item" target="_blank" rel="noopener noreferrer">
                    <div className="contact-social-item__icon" style={{ background: `${s.color}18`, color: s.color }}>
                      {s.icon}
                    </div>
                    <div>
                      <p className="contact-social-item__name">{s.name}</p>
                      <p className="contact-social-item__handle">{s.handle}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* FAQ */}
            <div className="card contact-faq-card">
              <h3 className="contact-faq-card__title">Câu hỏi thường gặp</h3>
              <div className="contact-faq-list">
                {[
                  { q: 'Thời gian giao hàng?', a: 'TP.HCM & Hà Nội: 1-2 ngày. Các tỉnh khác: 2-4 ngày.' },
                  { q: 'Chính sách đổi trả?', a: 'Đổi trả trong 7 ngày với sản phẩm lỗi từ nhà sản xuất.' },
                  { q: 'Bảo hành như thế nào?', a: 'Bảo hành chính hãng theo chính sách của nhà sản xuất.' },
                  { q: 'Thanh toán có những gì?', a: 'COD, chuyển khoản, VNPay, ví điện tử, trả góp 0%.' },
                ].map((item, i) => (
                  <div key={i} className="contact-faq-item">
                    <p className="contact-faq-item__q">{item.q}</p>
                    <p className="contact-faq-item__a">{item.a}</p>
                  </div>
                ))}
              </div>
              <a href="/faq" className="btn btn-outline btn-sm contact-faq-link">Xem tất cả FAQ →</a>
            </div>
          </div>
        </div>

        {/* Office Branches */}
        <div className="contact-branches">
          <h2 className="contact-branches__title">Hệ thống cửa hàng</h2>
          <div className="contact-branches__grid">
            {OFFICE_BRANCHES.map((branch, i) => (
              <div key={i} className="contact-branch-card card">
                <div className="contact-branch-card__header">
                  <div className="contact-branch-card__pin">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                  </div>
                  <h3 className="contact-branch-card__city">{branch.city}</h3>
                </div>
                <div className="contact-branch-card__body">
                  <div className="contact-branch-card__row">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    <span>{branch.address}</span>
                  </div>
                  <div className="contact-branch-card__row">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .82h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 15.5v1.42z"/>
                    </svg>
                    <a href={`tel:${branch.phone.replace(/\s/g, '')}`}>{branch.phone}</a>
                  </div>
                  <div className="contact-branch-card__row">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                    <a href={`mailto:${branch.email}`}>{branch.email}</a>
                  </div>
                  <div className="contact-branch-card__row">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    <span>{branch.hours}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
