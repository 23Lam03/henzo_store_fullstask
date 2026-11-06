import { useState } from 'react';
import './PaymentsPage.css';

const PAYMENT_METHODS = [
  {
    id: 'cod',
    name: 'Thanh toán khi nhận hàng (COD)',
    description: 'Trả tiền mặt khi nhận được hàng tại nhà hoặc tại cửa hàng.',
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
        <line x1="1" y1="10" x2="23" y2="10"/>
      </svg>
    ),
    fee: 'Miễn phí',
    recommended: true,
  },
  {
    id: 'vnpay',
    name: 'VNPay',
    description: 'Thanh toán qua ví điện tử VNPay, internet banking, QR code.',
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="5" width="20" height="14" rx="2"/>
        <path d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0"/>
      </svg>
    ),
    fee: 'Miễn phí',
    recommended: false,
  },
  {
    id: 'momo',
    name: 'Ví MoMo',
    description: 'Thanh toán nhanh chóng qua ứng dụng MoMo với mã QR hoặc số điện thoại.',
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 8v8M8 12h8"/>
      </svg>
    ),
    fee: 'Miễn phí',
    recommended: false,
  },
  {
    id: 'zalo',
    name: 'ZaloPay',
    description: 'Thanh toán tiện lợi qua ứng dụng ZaloPay liên kết tài khoản ngân hàng.',
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M21 15a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    fee: 'Miễn phí',
    recommended: false,
  },
  {
    id: 'bank',
    name: 'Chuyển khoản ngân hàng',
    description: 'Chuyển khoản trực tiếp qua tài khoản ngân hàng của HenzoStore.',
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <line x1="3" y1="22" x2="21" y2="22"/>
        <line x1="6" y1="18" x2="6" y2="11"/>
        <line x1="10" y1="18" x2="10" y2="11"/>
        <line x1="14" y1="18" x2="14" y2="11"/>
        <line x1="18" y1="18" x2="18" y2="11"/>
        <polygon points="12 2 20 7 4 7"/>
      </svg>
    ),
    fee: 'Miễn phí',
    recommended: false,
  },
  {
    id: 'installment',
    name: 'Trả góp 0%',
    description: 'Trả góp lãi suất 0% qua thẻ tín dụng của các ngân hàng: Vietcombank, Techcombank, VPBank, BIDV.',
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
        <line x1="1" y1="10" x2="23" y2="10"/>
        <path d="M8 15h.01M12 15h.01M16 15h.01"/>
      </svg>
    ),
    fee: 'Lãi suất 0%, phí xử lý 0đ',
    recommended: false,
  },
];

const BANK_ACCOUNTS = [
  {
    bank: 'Vietcombank',
    accountName: 'CÔNG TY TNHH HENZO STORE',
    accountNumber: '1234567890',
    branch: 'Chi nhánh TP. Hồ Chí Minh',
  },
  {
    bank: 'Techcombank',
    accountName: 'CÔNG TY TNHH HENZO STORE',
    accountNumber: '1903456789012',
    branch: 'Chi nhánh Hà Nội',
  },
  {
    bank: 'MB Bank',
    accountName: 'NGUYEN VAN MINH',
    accountNumber: '0901234567',
    branch: 'Chi nhánh TP. Hồ Chí Minh',
  },
];

export const PaymentsPage = () => {
  const [selected, setSelected] = useState('cod');
  const [activeTab, setActiveTab] = useState<'methods' | 'bank'>('methods');

  return (
    <div className="payments-page container">
      <div className="page-header">
        <h1 className="page-header__title">Phương thức thanh toán</h1>
        <p className="page-header__subtitle">Chọn phương thức thanh toán phù hợp với bạn</p>
      </div>

      <div className="payments-tabs">
        <button className={`payments-tab ${activeTab === 'methods' ? 'payments-tab--active' : ''}`} onClick={() => setActiveTab('methods')}>
          Phương thức thanh toán
        </button>
        <button className={`payments-tab ${activeTab === 'bank' ? 'payments-tab--active' : ''}`} onClick={() => setActiveTab('bank')}>
          Tài khoản ngân hàng
        </button>
      </div>

      {activeTab === 'methods' && (
        <div className="payments-grid">
          {PAYMENT_METHODS.map(method => (
            <div
              key={method.id}
              className={`payment-card card ${selected === method.id ? 'payment-card--selected' : ''}`}
              onClick={() => setSelected(method.id)}
            >
              {method.recommended && <span className="payment-card__badge">Đề xuất</span>}
              <div className="payment-card__icon">{method.icon}</div>
              <div className="payment-card__body">
                <h3 className="payment-card__name">{method.name}</h3>
                <p className="payment-card__desc">{method.description}</p>
                <span className="payment-card__fee">{method.fee}</span>
              </div>
              <div className="payment-card__check">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'bank' && (
        <div className="bank-accounts">
          <p className="bank-accounts__info">
            Quý khách vui lòng chuyển khoản đúng số tài khoản bên dưới và ghi rõ <strong>mã đơn hàng</strong> trong nội dung chuyển khoản.
          </p>
          <div className="bank-list">
            {BANK_ACCOUNTS.map((acc, i) => (
              <div key={i} className="bank-card card">
                <h3 className="bank-card__name">{acc.bank}</h3>
                <div className="bank-card__details">
                  <div className="bank-card__row">
                    <span className="bank-card__label">Tên tài khoản</span>
                    <span className="bank-card__value">{acc.accountName}</span>
                  </div>
                  <div className="bank-card__row">
                    <span className="bank-card__label">Số tài khoản</span>
                    <span className="bank-card__value bank-card__value--mono">{acc.accountNumber}</span>
                  </div>
                  <div className="bank-card__row">
                    <span className="bank-card__label">Chi nhánh</span>
                    <span className="bank-card__value">{acc.branch}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
