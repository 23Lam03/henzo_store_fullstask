import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart, useAuth, useOrder, useToast } from '../../../contexts';
import { ROUTES } from '../../../constants/routes';
import { Icon } from '../../../components/common/Icon';
import {
  locationsApi,
  type District,
  type Province,
  type Ward,
} from '../../../services/api/locations';
import './CheckoutPage.css';

const fmt = (p: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(p);

export const CheckoutPage = () => {
  const { items, clearSelectedItems } = useCart();
  const { user } = useAuth();
  const { createOrder } = useOrder();
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [payment, setPayment] = useState('COD');

  const [provinceCode, setProvinceCode] = useState('');
  const [districtCode, setDistrictCode] = useState('');
  const [wardCode, setWardCode] = useState('');
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(true);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [createdOrderId, setCreatedOrderId] = useState('');
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: '',
    note: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const selectedItems = items.filter(i => i.selected);
  const total = selectedItems.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const shipping = total >= 500000 ? 0 : 30000;

  const province = useMemo(
    () => provinces.find((p) => p.code === provinceCode)?.name ?? '',
    [provinces, provinceCode],
  );
  const district = useMemo(
    () => districts.find((d) => d.code === districtCode)?.name ?? '',
    [districts, districtCode],
  );
  const ward = useMemo(
    () => wards.find((w) => w.code === wardCode)?.name ?? '',
    [wards, wardCode],
  );

  useEffect(() => {
    let cancelled = false;
    locationsApi
      .provinces()
      .then((list) => {
        if (!cancelled) setProvinces(list);
      })
      .catch(() => {
        if (!cancelled) setProvinces([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingProvinces(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!provinceCode) {
      setDistricts([]);
      return;
    }
    let cancelled = false;
    setLoadingDistricts(true);
    locationsApi
      .districts(provinceCode)
      .then((list) => {
        if (!cancelled) setDistricts(list);
      })
      .catch(() => {
        if (!cancelled) setDistricts([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingDistricts(false);
      });
    return () => {
      cancelled = true;
    };
  }, [provinceCode]);

  useEffect(() => {
    if (!districtCode) {
      setWards([]);
      return;
    }
    let cancelled = false;
    setLoadingWards(true);
    locationsApi
      .wardsOfDistrict(districtCode)
      .then((list) => {
        if (!cancelled) setWards(list);
      })
      .catch(() => {
        if (!cancelled) setWards([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingWards(false);
      });
    return () => {
      cancelled = true;
    };
  }, [districtCode]);

  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Vui lòng nhập họ tên.';
    if (!form.phone.trim()) errs.phone = 'Vui lòng nhập số điện thoại.';
    else if (!/^0[0-9]{9}$/.test(form.phone)) errs.phone = 'Số điện thoại không hợp lệ.';
    if (!provinceCode) errs.province = 'Vui lòng chọn tỉnh/thành phố.';
    if (!districtCode) errs.district = 'Vui lòng chọn quận/huyện.';
    if (!wardCode) errs.ward = 'Vui lòng chọn phường/xã.';
    if (!form.address.trim()) errs.address = 'Vui lòng nhập địa chỉ cụ thể.';
    return errs;
  };

  const handlePlaceOrder = async () => {
    if (step === 1) {
      const errs = validateStep1();
      if (Object.keys(errs).length > 0) { setErrors(errs); return; }
      setErrors({});
      setStep(2);
    } else {
      if (selectedItems.length === 0) return;
      setIsPlacingOrder(true);
      try {
        const order = await createOrder({
          shippingName: form.name,
          shippingPhone: form.phone,
          shippingAddress: form.address,
          shippingProvince: province,
          shippingDistrict: district,
          shippingWard: ward,
          note: form.note,
          paymentMethod: payment,

          items: selectedItems.map(i => ({
            productId: i.product.id,
            quantity: i.quantity,
          })),
        });

        await clearSelectedItems();
        setCreatedOrderId(order.id);
        setOrderNumber(order.orderNumber);
        setOrderPlaced(true);
      } catch (err) {
        console.error('Place order failed:', err);
        toast({
          title: 'Đặt hàng thất bại',
          message: err instanceof Error ? err.message : 'Vui lòng thử lại.',
          variant: 'error',
        });
      } finally {
        setIsPlacingOrder(false);
      }
    }
  };

  if (orderPlaced) {
    return (
      <div className="checkout-page checkout-page--success">
        <div className="container">
          <div className="checkout-success">
            <div className="checkout-success__icon">
              <Icon name="check" size={38} strokeWidth={2.4} />
            </div>
            <span className="checkout-success__eyebrow">Đơn hàng đã ghi nhận</span>
            <h2>Cảm ơn bạn, đơn hàng đã thành công!</h2>
            <p className="checkout-success__code">
              Mã đơn hàng <strong>{orderNumber}</strong>
            </p>
            <p className="checkout-success__detail">
              Chúng tôi đã gửi thông tin đơn hàng về tài khoản của bạn. Đơn hàng hiện ở trạng thái
              <strong> chờ xác nhận</strong> và sẽ được chuyển sang đơn vị vận chuyển trong 24 giờ.
            </p>
            <div className="checkout-success__actions">
              <Link to={createdOrderId ? ROUTES.ORDER_DETAIL.replace(':id', createdOrderId) : ROUTES.ORDERS} className="btn btn-primary">
                <Icon name="doc" size={17} />
                Xem chi tiết đơn
              </Link>
              <Link to={ROUTES.ORDERS} className="btn btn-secondary">
                <Icon name="clock" size={17} />
                Lịch sử đơn hàng
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (selectedItems.length === 0) {
    return (
      <div className="checkout-page checkout-page--empty">
        <div className="container">
          <div className="checkout-empty">
            <span className="checkout-empty__icon"><Icon name="cart" size={30} /></span>
            <h2>Không có sản phẩm để thanh toán</h2>
            <p>Các sản phẩm bạn đã chọn có thể đã hết hàng hoặc không còn trong giỏ. Hãy quay lại cửa hàng để tiếp tục.</p>
            <Link to={ROUTES.PRODUCTS} className="btn btn-primary">
              <Icon name="arrow-left" size={17} />
              Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const f = (key: string) => ({
    value: (form as Record<string, string>)[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm({ ...form, [key]: e.target.value });
      if (errors[key]) setErrors({ ...errors, [key]: '' });
    },
  });

  return (
    <div className="checkout-page">
      <div className="container">
        <h1 className="checkout-page__title">Thanh toán</h1>

        <div className="checkout-page__layout">
          <div className="checkout-page__main">
            <ol className="checkout-steps">
              {[
                { n: 1, label: 'Địa chỉ giao hàng' },
                { n: 2, label: 'Phương thức thanh toán' },
              ].map((s, i) => (
                <li key={s.n} className={`checkout-step ${step >= s.n ? 'is-active' : ''} ${step > s.n ? 'is-done' : ''}`}>
                  <span className="checkout-step__num">{step > s.n ? <Icon name="check" size={14} strokeWidth={3} /> : s.n}</span>
                  <span className="checkout-step__label">{s.label}</span>
                  {i === 0 && <span className="checkout-step__line" />}
                </li>
              ))}
            </ol>

            {step === 1 && (
              <div className="checkout-section card">
                <h2 className="checkout-section__title">
                  <Icon name="map-pin" size={18} />
                  Thông tin giao hàng
                </h2>

                <div className="checkout-form">
                  <div className="checkout-form__row">
                    <div className="input-group">
                      <label className="input-label">Họ và tên</label>
                      <input type="text" className={`input ${errors.name ? 'input-error' : ''}`} placeholder="Nguyễn Văn A" {...f('name')} />
                      {errors.name && <span className="input-error-message">{errors.name}</span>}
                    </div>
                    <div className="input-group">
                      <label className="input-label">Số điện thoại</label>
                      <input type="tel" className={`input ${errors.phone ? 'input-error' : ''}`} placeholder="0xxx xxx xxx" {...f('phone')} />
                      {errors.phone && <span className="input-error-message">{errors.phone}</span>}
                    </div>
                  </div>

                  <div className="checkout-form__row">
                    <div className="input-group">
                      <label className="input-label">Tỉnh / Thành phố</label>
                      <select
                        className={`input ${errors.province ? 'input-error' : ''}`}
                        value={provinceCode}
                        disabled={loadingProvinces}
                        onChange={e => {
                          setProvinceCode(e.target.value);
                          setDistrictCode('');
                          setWardCode('');
                        }}
                      >
                        <option value="">
                          {loadingProvinces
                            ? 'Đang tải tỉnh/thành phố…'
                            : 'Chọn tỉnh/thành phố'}
                        </option>
                        {provinces.map(p => (
                          <option key={p.code} value={p.code}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                      {errors.province && <span className="input-error-message">{errors.province}</span>}
                    </div>
                    <div className="input-group">
                      <label className="input-label">Quận / Huyện</label>
                      <select
                        className={`input ${errors.district ? 'input-error' : ''}`}
                        value={districtCode}
                        disabled={!provinceCode || loadingDistricts}
                        onChange={e => {
                          setDistrictCode(e.target.value);
                          setWardCode('');
                        }}
                      >
                        <option value="">
                          {!provinceCode
                            ? 'Chọn tỉnh/thành phố trước'
                            : loadingDistricts
                              ? 'Đang tải quận/huyện…'
                              : 'Chọn quận/huyện'}
                        </option>
                        {districts.map(d => (
                          <option key={d.code} value={d.code}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                      {errors.district && <span className="input-error-message">{errors.district}</span>}
                    </div>
                    <div className="input-group">
                      <label className="input-label">Phường / Xã</label>
                      <select
                        className={`input ${errors.ward ? 'input-error' : ''}`}
                        value={wardCode}
                        disabled={!districtCode || loadingWards}
                        onChange={e => setWardCode(e.target.value)}
                      >
                        <option value="">
                          {!districtCode
                            ? 'Chọn quận/huyện trước'
                            : loadingWards
                              ? 'Đang tải phường/xã…'
                              : 'Chọn phường/xã'}
                        </option>
                        {wards.map(w => (
                          <option key={w.code} value={w.code}>
                            {w.name}
                          </option>
                        ))}
                      </select>
                      {errors.ward && <span className="input-error-message">{errors.ward}</span>}
                    </div>
                  </div>

                  <div className="input-group">
                    <label className="input-label">Địa chỉ cụ thể</label>
                    <input type="text" className={`input ${errors.address ? 'input-error' : ''}`} placeholder="Số nhà, đường, tên ngõ/hẻm" {...f('address')} />
                    {errors.address && <span className="input-error-message">{errors.address}</span>}
                  </div>

                  <div className="input-group">
                    <label className="input-label">Ghi chú (tùy chọn)</label>
                    <textarea className="input" rows={3} placeholder="Ghi chú về đơn hàng, ví dụ: thời gian giao hàng mong muốn." {...f('note')} />
                  </div>
                </div>

                <button className="btn btn-primary btn-lg" onClick={handlePlaceOrder}>
                  Tiếp tục thanh toán
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="checkout-section card">
                <h2 className="checkout-section__title">
                  <Icon name="credit-card" size={18} />
                  Phương thức thanh toán
                </h2>

                <div className="payment-methods">
                  {[
                    { id: 'COD', label: 'Thanh toán khi nhận hàng (COD)', desc: 'Trả tiền mặt cho shipper khi nhận đủ hàng', icon: 'wallet' as const },
                    { id: 'VNPay', label: 'Thanh toán qua VNPay', desc: 'Thanh toán trực tuyến qua ATM, Visa, Mastercard', icon: 'credit-card' as const },
                    { id: 'Momo', label: 'Thanh toán qua MoMo', desc: 'Quét mã MoMo để thanh toán tức thì', icon: 'phone' as const },
                    { id: 'ZaloPay', label: 'Thanh toán qua ZaloPay', desc: 'Thanh toán nhanh qua ví ZaloPay', icon: 'message' as const },
                  ].map(m => (
                    <label key={m.id} className={`payment-method ${payment === m.id ? 'is-selected' : ''}`}>
                      <input type="radio" name="payment" value={m.id} checked={payment === m.id} onChange={() => setPayment(m.id)} />
                      <span className="payment-method__icon">
                        <Icon name={m.icon} size={19} />
                      </span>
                      <div className="payment-method__info">
                        <span className="payment-method__label">{m.label}</span>
                        <span className="payment-method__desc">{m.desc}</span>
                      </div>
                      <span className="payment-method__radio">
                        <span className="payment-method__dot" />
                      </span>
                    </label>
                  ))}
                </div>

                <div className="checkout-section__nav">
                  <button className="btn btn-secondary" onClick={() => setStep(1)}>Quay lại</button>
                  <button className="btn btn-primary btn-lg" onClick={handlePlaceOrder} disabled={isPlacingOrder}>
                    {isPlacingOrder ? 'Đang xử lý…' : `Đặt hàng ngay · ${fmt(total + shipping)}`}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="checkout-page__sidebar">
            <div className="checkout-order card">
              <h3 className="checkout-order__title">
                <Icon name="package" size={17} />
                Đơn hàng ({selectedItems.length})
              </h3>
              <div className="checkout-order__items">
                {selectedItems.map(item => (
                  <div key={item.product.id} className="checkout-order__item">
                    <img src={item.product.images[0]} alt={item.product.name} />
                    <div className="checkout-order__info">
                      <p className="checkout-order__name">{item.product.name}</p>
                      <p className="checkout-order__qty">Số lượng: {item.quantity}</p>
                    </div>
                    <span className="checkout-order__price">{fmt(item.product.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="checkout-order__rows">
                <div className="checkout-order__row">
                  <span>Tạm tính</span>
                  <span>{fmt(total)}</span>
                </div>
                <div className="checkout-order__row">
                  <span>Phí vận chuyển</span>
                  <span className={shipping === 0 ? 'is-free' : ''}>{shipping === 0 ? 'Miễn phí' : fmt(shipping)}</span>
                </div>
              </div>

              <div className="checkout-order__total">
                <span>Tổng cộng</span>
                <strong>{fmt(total + shipping)}</strong>
              </div>

              {shipping > 0 && (
                <p className="checkout-order__hint">
                  Mua thêm {fmt(500000 - total)} để được miễn phí vận chuyển
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
