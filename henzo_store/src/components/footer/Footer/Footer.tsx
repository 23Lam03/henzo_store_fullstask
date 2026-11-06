import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { FOOTER_LINKS, COMPANY_INFO } from '../../../constants';
import { BrandMark } from '../../common/BrandMark/BrandMark';
import './Footer.css';

const IconFacebook = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);

const IconYoutube = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/>
    <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white"/>
  </svg>
);

const IconTiktok = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.19 8.19 0 0 0 4.79 1.52V6.81a4.86 4.86 0 0 1-1.02-.12z"/>
  </svg>
);

const IconInstagram = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);

const IconZalo = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12c0 3.31 1.61 6.24 4.09 8.09L4.5 24l4.24-1.59C9.96 22.76 10.96 23 12 23c5.52 0 10-4.48 10-10S17.52 2 12 2zm4.36 14.47c-.36.9-2.12 1.73-2.96 2.03-.84.3-1.63.36-1.9.3-.27-.06-.53-.3-.53-.3s-2.24-1.57-2.39-1.72c-.15-.15-.44-.5-.14-.77.3-.27.8-.4 1.24-.3.44.1.72.18 1.06.18.34 0 .53-.18.8-.45.27-.27.5-.65.77-1.15.27-.5.48-.95.48-.95s.08-.12.14-.15c.06-.03.15-.03.23-.03l.86.03c.06 0 .1.03.14.06.03.03.05.09.03.15-.15.77-1.14 2.12-1.14 2.12s-.08.12-.03.17.09.09.15.12h.15c.08 0 .15-.03.2-.06l.8-.47c.08-.03.15-.03.2-.03.05 0 .09.03.12.03l.17.03c.03 0 .06 0 .08-.03s.03-.03.03-.03.05-.06.03-.1z"/>
  </svg>
);

const IconPhone = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.15h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.9a16 16 0 0 0 6.29 6.29l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);

const IconMail = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
  </svg>
);

const IconLocation = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);

const socialIcons: Record<string, ReactNode> = {
  facebook: <IconFacebook />,
  youtube: <IconYoutube />,
  tiktok: <IconTiktok />,
  instagram: <IconInstagram />,
  zalo: <IconZalo />,
};

export const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid" data-reveal-stagger>
          {/* Brand */}
          <div className="footer__brand">
            <Link to="/" className="footer__logo">
              <BrandMark size={36} tone="dark" />
              <span className="footer__logo-text">Henzo<em>Store</em></span>
            </Link>
            <p className="footer__desc">
              Hệ thống bán lẻ công nghệ hàng đầu Việt Nam. Cam kết 100% sản phẩm chính hãng, bảo hành uy tín và dịch vụ hậu mãi tận tâm.
            </p>
            <div className="footer__socials">
              {FOOTER_LINKS.social.map(link => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer__social-link"
                  title={link.label}
                >
                  {socialIcons[link.icon || '']}
                </a>
              ))}
            </div>
          </div>

          {/* About */}
          <div className="footer__column">
            <h3 className="footer__column-title">Giới thiệu</h3>
            <ul className="footer__links">
              {FOOTER_LINKS.about.map(link => (
                <li key={link.label}>
                  <Link to={link.href} className="footer__link">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Policies */}
          <div className="footer__column">
            <h3 className="footer__column-title">Chính sách</h3>
            <ul className="footer__links">
              {FOOTER_LINKS.policies.map(link => (
                <li key={link.label}>
                  <Link to={link.href} className="footer__link">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div className="footer__column">
            <h3 className="footer__column-title">Hỗ trợ</h3>
            <ul className="footer__links">
              {FOOTER_LINKS.support.map(link => (
                <li key={link.label}>
                  <Link to={link.href} className="footer__link">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="footer__column footer__column--contact">
            <h3 className="footer__column-title">Liên hệ</h3>
            <div className="footer__contact">
              <div className="footer__contact-item">
                <IconPhone />
                <div>
                  <p className="footer__contact-label">Hotline</p>
                  <a href={`tel:${COMPANY_INFO.hotline}`} className="footer__contact-value">{COMPANY_INFO.hotline}</a>
                </div>
              </div>
              <div className="footer__contact-item">
                <IconMail />
                <div>
                  <p className="footer__contact-label">Email</p>
                  <a href={`mailto:${COMPANY_INFO.email}`} className="footer__contact-value">{COMPANY_INFO.email}</a>
                </div>
              </div>
              <div className="footer__contact-item">
                <IconLocation />
                <div>
                  <p className="footer__contact-label">Địa chỉ</p>
                  <p className="footer__contact-value">{COMPANY_INFO.address}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="footer__bottom">
          <p className="footer__copyright">
            &copy; {new Date().getFullYear()} {COMPANY_INFO.name}. Tất cả quyền được bảo lưu. Mã số thuế: {COMPANY_INFO.taxId}
          </p>
          <div className="footer__bottom-links">
            <Link to="/privacy" className="footer__bottom-link">Chính sách bảo mật</Link>
            <Link to="/terms" className="footer__bottom-link">Điều khoản sử dụng</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
