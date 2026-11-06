/**
 * ⚠️  Dữ liệu mẫu (legacy) — KHÔNG dùng trực tiếp trong runtime của frontend.
 *
 * Toàn bộ ứng dụng đã chuyển sang backend TanStack (`henzo_store_backend`).
 * File này chỉ còn là **nguồn dữ liệu cho script seed** của backend:
 *   cd ../henzo_store_backend && npx tsx scripts/extract-frontend-data.ts
 */

// ─── Admin Mock Data ───────────────────────────────────────────────────────────
// 50 cửa hàng | 300 sản phẩm | 200 khách hàng | 500 đơn hàng
// 300 giao dịch | 100 đánh giá | 50 khuyến mãi | 50 ticket hỗ trợ

import type { Store, User, Order, Payment, Review, Promotion, SupportTicket } from '../types';

// ─── Helper ───────────────────────────────────────────────────────────────────
const randomDate = (daysAgo: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysAgo));
  return d.toISOString();
};

// ─── Mock Stores (50) ────────────────────────────────────────────────────────
export const MOCK_ADMIN_STORES: Store[] = [
  { id: 'store-1', name: 'Henzo Tech Store', email: 'contact@henzo.vn', phone: '0901234567', address: '123 Nguyễn Trãi, Quận 1, TP.HCM', avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=store1', rating: 4.8, productCount: 1234, isVerified: true, createdAt: randomDate(365) },
  { id: 'store-2', name: 'TechPro Shop', email: 'contact@techpro.vn', phone: '0902345678', address: '456 Lê Lợi, Quận 3, TP.HCM', avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=store2', rating: 4.7, productCount: 876, isVerified: true, createdAt: randomDate(300) },
  { id: 'store-3', name: 'GameZone Store', email: 'info@gamezone.vn', phone: '0903456789', address: '789 Trần Hưng Đạo, Quận 5, TP.HCM', avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=store3', rating: 4.6, productCount: 654, isVerified: true, createdAt: randomDate(250) },
  { id: 'store-4', name: 'Apple House', email: 'hello@applehouse.vn', phone: '0904567890', address: '321 Điện Biên Phủ, Quận Bình Thạnh, TP.HCM', avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=store4', rating: 4.9, productCount: 2341, isVerified: true, createdAt: randomDate(200) },
  { id: 'store-5', name: 'Samsung World', email: 'contact@samsungworld.vn', phone: '0905678901', address: '555 Phạm Ngũ Lão, Quận Gò Vấp, TP.HCM', avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=store5', rating: 4.5, productCount: 987, isVerified: false, createdAt: randomDate(180) },
  { id: 'store-6', name: 'Laptop Pro Center', email: 'info@laptoppro.vn', phone: '0906789012', address: '111 Võ Văn Ngân, Thủ Đức, TP.HCM', avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=store6', rating: 4.4, productCount: 543, isVerified: true, createdAt: randomDate(150) },
  { id: 'store-7', name: 'Gaming Gear VN', email: 'contact@gaminggear.vn', phone: '0907890123', address: '222 Nguyễn Oanh, Gò Vấp, TP.HCM', avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=store7', rating: 4.3, productCount: 432, isVerified: true, createdAt: randomDate(120) },
  { id: 'store-8', name: 'Phụ Kiện Plus', email: 'sale@phukienplus.vn', phone: '0908901234', address: '333 CMT8, Quận 10, TP.HCM', avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=store8', rating: 4.2, productCount: 321, isVerified: false, createdAt: randomDate(100) },
  { id: 'store-9', name: 'SmartDevice Store', email: 'info@smartdevice.vn', phone: '0909012345', address: '444 Lý Thường Kiệt, Quận Tân Bình, TP.HCM', avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=store9', rating: 4.6, productCount: 765, isVerified: true, createdAt: randomDate(90) },
  { id: 'store-10', name: 'Digital World', email: 'contact@digitalworld.vn', phone: '0910123456', address: '666 Hoàng Van Thu, Phú Nhuận, TP.HCM', avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=store10', rating: 4.5, productCount: 654, isVerified: true, createdAt: randomDate(80) },
  { id: 'store-11', name: 'Xiaomi Official', email: 'hello@xiaomivn.vn', phone: '0911234567', address: '777 Nguyễn Thị Minh Khai, Quận 3, TP.HCM', avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=store11', rating: 4.4, productCount: 543, isVerified: true, createdAt: randomDate(75) },
  { id: 'store-12', name: 'OPPO Premium', email: 'contact@oppopremium.vn', phone: '0912345678', address: '888 Đền Lỗ, Quận 12, TP.HCM', avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=store12', rating: 4.3, productCount: 432, isVerified: false, createdAt: randomDate(70) },
  { id: 'store-13', name: 'Vivo Center', email: 'info@vivocenter.vn', phone: '0913456789', address: '999 Tô Ký, Quận 12, TP.HCM', avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=store13', rating: 4.2, productCount: 321, isVerified: true, createdAt: randomDate(65) },
  { id: 'store-14', name: 'Realme Store', email: 'contact@realme.vn', phone: '0914567890', address: '1111 Lê Văn Việt, Quận 9, TP.HCM', avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=store14', rating: 4.1, productCount: 210, isVerified: false, createdAt: randomDate(60) },
  { id: 'store-15', name: 'Tablet Zone', email: 'info@tabletzone.vn', phone: '0915678901', address: '2222 Nguyễn Duy Trinh, Quận 2, TP.HCM', avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=store15', rating: 4.5, productCount: 456, isVerified: true, createdAt: randomDate(55) },
  { id: 'store-16', name: 'PC Gaming Master', email: 'master@pcgaming.vn', phone: '0916789012', address: '3333 Phan Văn Trị, Gò Vấp, TP.HCM', avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=store16', rating: 4.7, productCount: 876, isVerified: true, createdAt: randomDate(50) },
  { id: 'store-17', name: 'Linh Kiện 24h', email: 'hotro@linhkien24h.vn', phone: '0917890123', address: '4444 Trần Não, Quận 2, TP.HCM', avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=store17', rating: 4.6, productCount: 765, isVerified: true, createdAt: randomDate(45) },
  { id: 'store-18', name: 'Monitor Pro', email: 'contact@monitorpro.vn', phone: '0918901234', address: '5555 Nguyễn Thị Định, Thủ Đức, TP.HCM', avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=store18', rating: 4.4, productCount: 345, isVerified: false, createdAt: randomDate(40) },
  { id: 'store-19', name: 'KeyCap Collector', email: 'info@keycap.vn', phone: '0919012345', address: '6666 Phạm Viết Chánh, Bình Thạnh, TP.HCM', avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=store19', rating: 4.8, productCount: 123, isVerified: true, createdAt: randomDate(35) },
  { id: 'store-20', name: 'Headphone Haven', email: 'hello@headphonehaven.vn', phone: '0920123456', address: '7777 Bạch Đằng, Bình Thạnh, TP.HCM', avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=store20', rating: 4.5, productCount: 234, isVerified: true, createdAt: randomDate(30) },
  { id: 'store-21', name: 'Camera Tech', email: 'contact@cameratech.vn', phone: '0921234567', address: '8888 Nguyễn Gia Trí, Bình Thạnh, TP.HCM', avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=store21', rating: 4.6, productCount: 345, isVerified: false, createdAt: randomDate(28) },
  { id: 'store-22', name: 'SmartWatch Hub', email: 'info@smartwatchhub.vn', phone: '0922345678', address: '9999 Nguyễn Hữu Cảnh, Bình Thạnh, TP.HCM', avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=store22', rating: 4.3, productCount: 234, isVerified: true, createdAt: randomDate(25) },
  { id: 'store-23', name: 'Router Store', email: 'contact@routerstore.vn', phone: '0923456789', address: '1010 Xa Lộ Hà Nội, Thủ Đức, TP.HCM', avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=store23', rating: 4.2, productCount: 123, isVerified: false, createdAt: randomDate(22) },
  { id: 'store-24', name: 'Cable Zone', email: 'sale@cablezone.vn', phone: '0924567890', address: '1111 Lê Văn Lương, Quận 7, TP.HCM', avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=store24', rating: 4.1, productCount: 98, isVerified: true, createdAt: randomDate(20) },
  { id: 'store-25', name: 'PowerBank Pro', email: 'info@powerbankpro.vn', phone: '0925678901', address: '1212 Nguyễn Thị Thập, Quận 7, TP.HCM', avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=store25', rating: 4.4, productCount: 156, isVerified: false, createdAt: randomDate(18) },
  { id: 'store-26', name: 'Charger Station', email: 'contact@chargerstation.vn', phone: '0926789012', address: '1313 Lê Đại Hành, Quận 11, TP.HCM', avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=store26', rating: 4.3, productCount: 134, isVerified: true, createdAt: randomDate(15) },
  { id: 'store-27', name: 'Speaker Paradise', email: 'hello@speakerparadise.vn', phone: '0927890123', address: '1414 Nguyễn Tri Phương, Quận 10, TP.HCM', avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=store27', rating: 4.6, productCount: 234, isVerified: true, createdAt: randomDate(14) },
  { id: 'store-28', name: 'Webcam Center', email: 'info@webcamcenter.vn', phone: '0928901234', address: '1515 Cao Thắng, Quận 3, TP.HCM', avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=store28', rating: 4.2, productCount: 98, isVerified: false, createdAt: randomDate(12) },
  { id: 'store-29', name: 'Microphone Pro', email: 'contact@micpro.vn', phone: '0929012345', address: '1616 Lý Thái Tổ, Quận 10, TP.HCM', avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=store29', rating: 4.5, productCount: 112, isVerified: true, createdAt: randomDate(10) },
  { id: 'store-30', name: 'Case Phone Store', email: 'sale@casephone.vn', phone: '0930123456', address: '1717 Nguyễn Trãi, Quận 1, TP.HCM', avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=store30', rating: 4.1, productCount: 456, isVerified: false, createdAt: randomDate(9) },
  { id: 'store-31', name: 'Film Dán Màn', email: 'info@filmdan.vn', phone: '0931234567', address: '1818 Phạm Hùng, Quận 8, TP.HCM', avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=store31', rating: 4.0, productCount: 234, isVerified: true, createdAt: randomDate(8) },
  { id: 'store-32', name: 'Grip Stand Maker', email: 'contact@gripstand.vn', phone: '0932345678', address: '1919 Đường số 9, Quận 9, TP.HCM', avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=store32', rating: 4.3, productCount: 89, isVerified: false, createdAt: randomDate(7) },
  { id: 'store-33', name: 'Stylus Pen Shop', email: 'info@styluspen.vn', phone: '0933456789', address: '2020 Đại Lộ 2, Quận Thủ Đức, TP.HCM', avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=store33', rating: 4.4, productCount: 67, isVerified: true, createdAt: randomDate(6) },
  { id: 'store-34', name: 'USB Hub VN', email: 'sale@usbhub.vn', phone: '0934567890', address: '2121 Nguyễn Văn Linh, Quận 7, TP.HCM', avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=store34', rating: 4.2, productCount: 78, isVerified: false, createdAt: randomDate(5) },
  { id: 'store-35', name: 'External SSD Store', email: 'contact@ssdstore.vn', phone: '0935678901', address: '2222 Nguyễn Duy Cung, Quận 7, TP.HCM', avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=store35', rating: 4.6, productCount: 145, isVerified: true, createdAt: randomDate(4) },
  { id: 'store-36', name: 'RAM Upgrade Shop', email: 'info@ramupgrade.vn', phone: '0936789012', address: '2323 Tân Sơn Nhì, Quận Tân Phú, TP.HCM', avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=store36', rating: 4.5, productCount: 112, isVerified: true, createdAt: randomDate(3) },
  { id: 'store-37', name: 'CPU Center', email: 'contact@cpucenter.vn', phone: '0937890123', address: '2424 Hòa Bình, Quận Tân Phú, TP.HCM', avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=store37', rating: 4.7, productCount: 189, isVerified: false, createdAt: randomDate(3) },
  { id: 'store-38', name: 'GPU Store VN', email: 'sale@gpustore.vn', phone: '0938901234', address: '2525 Hùng Vương, Quận 6, TP.HCM', avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=store38', rating: 4.8, productCount: 234, isVerified: true, createdAt: randomDate(2) },
  { id: 'store-39', name: 'PSU Power House', email: 'info@psupower.vn', phone: '0939012345', address: '2626 Trần Van Công, Bình Chánh, TP.HCM', avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=store39', rating: 4.3, productCount: 98, isVerified: false, createdAt: randomDate(2) },
  { id: 'store-40', name: 'Case PC Master', email: 'contact@casepc.vn', phone: '0940123456', address: '2727 Phú Lợi, Thủ Dầu Một, Bình Dương', avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=store40', rating: 4.5, productCount: 156, isVerified: true, createdAt: randomDate(2) },
  { id: 'store-41', name: 'Cooling Zone', email: 'info@coolingzone.vn', phone: '0941234567', address: '2828 Phạm Văn Đồng, Gò Vấp, TP.HCM', avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=store41', rating: 4.4, productCount: 134, isVerified: true, createdAt: randomDate(1) },
  { id: 'store-42', name: 'Fan Store VN', email: 'contact@fanstore.vn', phone: '0942345678', address: '2929 Hồ Xuân Hương, Quận 3, TP.HCM', avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=store42', rating: 4.2, productCount: 89, isVerified: false, createdAt: randomDate(1) },
  { id: 'store-43', name: 'RGB Light Pro', email: 'hello@rgblight.vn', phone: '0943456789', address: '3030 Nguyễn Cửu Vân, Quận 5, TP.HCM', avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=store43', rating: 4.1, productCount: 67, isVerified: true, createdAt: randomDate(1) },
  { id: 'store-44', name: 'Desk Mat Zone', email: 'info@deskmat.vn', phone: '0944567890', address: '3131 Trần Phú, Quận 1, TP.HCM', avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=store44', rating: 4.3, productCount: 112, isVerified: false, createdAt: randomDate(1) },
  { id: 'store-45', name: 'Monitor Arm Store', email: 'sale@monitorarm.vn', phone: '0945678901', address: '3232 Lê Lai, Quận 3, TP.HCM', avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=store45', rating: 4.4, productCount: 78, isVerified: true, createdAt: randomDate(1) },
  { id: 'store-46', name: 'Webcam Pro HD', email: 'contact@webcamhd.vn', phone: '0946789012', address: '3333 Lê Quý Đôn, Quận 3, TP.HCM', avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=store46', rating: 4.5, productCount: 56, isVerified: false, createdAt: randomDate(0) },
  { id: 'store-47', name: 'Streaming Gear', email: 'info@streaminggear.vn', phone: '0947890123', address: '3434 Trần Hưng Đạo, Quận 1, TP.HCM', avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=store47', rating: 4.6, productCount: 123, isVerified: true, createdAt: randomDate(0) },
  { id: 'store-48', name: 'Capture Card Store', email: 'contact@capturecard.vn', phone: '0948901234', address: '3535 Nguyễn Cư Trinh, Quận 1, TP.HCM', avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=store48', rating: 4.4, productCount: 45, isVerified: true, createdAt: randomDate(0) },
  { id: 'store-49', name: 'Ring Light VN', email: 'sale@ringlight.vn', phone: '0949012345', address: '3636 Pasteur, Quận 3, TP.HCM', avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=store49', rating: 4.2, productCount: 89, isVerified: false, createdAt: randomDate(0) },
  { id: 'store-50', name: 'Tripod Center', email: 'info@tripod.vn', phone: '0950123456', address: '3737 Võ Thị Sáu, Quận 3, TP.HCM', avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=store50', rating: 4.3, productCount: 67, isVerified: true, createdAt: randomDate(0) },
];

// ─── Mock Customers (200) ────────────────────────────────────────────────────
const firstNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Trương', 'Bùi', 'Đặng', 'Ngô', 'Đỗ', 'Hồ', 'Đinh', 'Trịnh', 'Cao', 'Lương', 'Đào', 'Tạ', 'Vũ'];
const lastNames = ['Văn A', 'Thị B', 'Văn C', 'Thị D', 'Văn E', 'Thị F', 'Văn G', 'Thị H', 'Văn I', 'Thị K', 'Văn L', 'Thị M', 'Văn N', 'Thị P', 'Văn Q', 'Thị R', 'Văn S', 'Thị T', 'Văn U', 'Thị V'];
const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'email.com', 'icloud.com'];

export const MOCK_ADMIN_CUSTOMERS: User[] = Array.from({ length: 200 }, (_, i) => {
  const fn = firstNames[i % firstNames.length];
  const ln = lastNames[i % lastNames.length];
  const name = `${fn} ${ln}`;
  const seed = `customer${i + 1}`;
  return {
    id: `customer-${i + 1}`,
    email: `${fn.toLowerCase().replace(/ /g, '.')}.${ln.toLowerCase().replace(/ /g, '')}@${domains[i % domains.length]}`,
    name,
    phone: `09${String(10000000 + i).slice(1)}`,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`,
    role: 'CUSTOMER' as const,
    address: `Số ${i + 1}, Đường ${i + 1}0, Quận ${(i % 12) + 1}, TP.HCM`,
    createdAt: randomDate(365),
  };
});

// ─── Mock Orders (500) ───────────────────────────────────────────────────────
const ORDER_STATUSES: Order['status'][] = ['pending', 'confirmed', 'processing', 'shipping', 'delivered', 'cancelled'];
const PAYMENT_METHODS = ['COD', 'Chuyển khoản', 'VNPay', 'ZaloPay', 'MoMo'];

export const MOCK_ADMIN_ORDERS: Order[] = Array.from({ length: 500 }, (_, i) => {
  const status = ORDER_STATUSES[i % ORDER_STATUSES.length];
  const customer = MOCK_ADMIN_CUSTOMERS[i % MOCK_ADMIN_CUSTOMERS.length];
  const total = Math.floor(Math.random() * 500000000) + 500000;
  const shippingFee = Math.floor(Math.random() * 50000) + 20000;
  const discount = Math.random() > 0.7 ? Math.floor(total * 0.1) : 0;
  const day = Math.floor(i / 20);
  const created = new Date();
  created.setDate(created.getDate() - day);
  return {
    id: `order-${i + 1}`,
    orderNumber: `HDN-${new Date(created).getFullYear()}${String(new Date(created).getMonth() + 1).padStart(2, '0')}${String(new Date(created).getDate()).padStart(2, '0')}-${String(i + 1).padStart(3, '0')}`,
    customerName: customer.name,
    customerPhone: customer.phone,
    items: [],
    subtotal: total - shippingFee + discount,
    shippingFee,
    discount,
    totalPrice: total,
    status,
    shippingAddress: customer.address || `Số ${i + 1}, Đường ${i + 1}, Quận 1, TP.HCM`,
    paymentMethod: PAYMENT_METHODS[i % PAYMENT_METHODS.length],
    createdAt: created.toISOString(),
    updatedAt: created.toISOString(),
  };
});

// ─── Mock Payments (300) ──────────────────────────────────────────────────────
const PAYMENT_STATUSES: Payment['status'][] = ['pending', 'completed', 'failed', 'refunded'];
export const MOCK_ADMIN_PAYMENTS: Payment[] = Array.from({ length: 300 }, (_, i) => {
  const order = MOCK_ADMIN_ORDERS[i % MOCK_ADMIN_ORDERS.length];
  const status = PAYMENT_STATUSES[i % PAYMENT_STATUSES.length];
  const method = PAYMENT_METHODS[i % PAYMENT_METHODS.length];
  const day = Math.floor(i / 10);
  const created = new Date();
  created.setDate(created.getDate() - day);
  return {
    id: `payment-${i + 1}`,
    orderId: order.id,
    amount: order.totalPrice,
    method,
    status,
    transactionId: `TXN${String(Date.now() + i).slice(-12)}`,
    createdAt: created.toISOString(),
  };
});

// ─── Mock Reviews (100) ───────────────────────────────────────────────────────
const REVIEW_COMMENTS = [
  'Sản phẩm tuyệt vời! Giao hàng nhanh, đóng gói cẩn thận.',
  'Chất lượng tốt như mô tả. Shop rất chuyên nghiệp.',
  'Đã mua nhiều lần, lần nào cũng hài lòng. Recommend!',
  'Máy đẹp, hoạt động mượt. Camera chụp ảnh rất đẹp!',
  'Giao hàng đúng hẹn, nhân viên tư vấn nhiệt tình.',
  'Sản phẩm đúng như hình. Giá cả hợp lý hơn nhiều nơi khác.',
  'Pin trâu, màn hình đẹp. Rất hài lòng với sản phẩm.',
  'Shop giao đúng sản phẩm, đầy đủ phụ kiện. Thanks!',
  'Màn hình đẹp, âm thanh hay. Mua lần thứ 3 rồi.',
  'Cấu hình mạnh, chơi game mượt. Worth every penny.',
  'Shop tư vấn rất kỹ trước khi mua. Professional.',
  'Đóng gói chắc chắn, không bị trầy xước gì. Good!',
];

export const MOCK_ADMIN_REVIEWS: Review[] = Array.from({ length: 100 }, (_, i) => {
  const customer = MOCK_ADMIN_CUSTOMERS[i % MOCK_ADMIN_CUSTOMERS.length];
  const rating = (i % 5) + 1;
  const day = Math.floor(i / 3);
  const created = new Date();
  created.setDate(created.getDate() - day);
  return {
    id: `review-${i + 1}`,
    productId: `product-${(i % 50) + 1}`,
    userId: customer.id,
    userName: customer.name,
    userAvatar: customer.avatar,
    rating,
    comment: REVIEW_COMMENTS[i % REVIEW_COMMENTS.length],
    createdAt: created.toISOString(),
    isVerified: i % 3 !== 2,
  };
});

// ─── Mock Promotions (50) ────────────────────────────────────────────────────
const PROMO_NAMES = [
  'Flash Sale Cuối Tuần', 'Voucher 200K', 'Sale iPhone 16', 'Giảm 30% Laptop Gaming',
  'Khuyến mãi mùa hè', 'Back to School', 'Giảm giá Apple Week', 'Samsung Festival',
  'Mega Sale 11.11', '12.12 Shopping', 'New Year Sale', 'Tết Nguyên Đán',
  'Mid Year Sale', 'Black Friday', 'Cyber Monday', "Women's Day Sale",
  'Flash Deal Daily', 'Member Day', 'First Purchase', 'Lucky Box',
];
export const MOCK_ADMIN_PROMOTIONS: Promotion[] = Array.from({ length: 50 }, (_, i) => {
  const status = i < 15 ? 'active' : i < 40 ? 'upcoming' : 'ended';
  const start = new Date();
  start.setDate(start.getDate() - i * 3);
  const end = new Date(start);
  end.setDate(end.getDate() + 15 + (i % 30));
  return {
    id: `promo-${i + 1}`,
    title: PROMO_NAMES[i % PROMO_NAMES.length] + (i >= PROMO_NAMES.length ? ` #${Math.floor(i / PROMO_NAMES.length) + 1}` : ''),
    description: `Chương trình khuyến mãi hấp dẫn dành cho khách hàng Henzo Store. Giảm ngay ${(i % 5 + 1) * 5}% cho tất cả sản phẩm.`,
    image: `https://picsum.photos/seed/promo${i}/800/400`,
    discount: (i % 5 + 1) * 5,
    code: i % 3 === 0 ? `PROMO${100 + i}` : undefined,
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    isActive: status === 'active',
  };
});

// ─── Mock Support Tickets (50) ───────────────────────────────────────────────
const TICKET_SUBJECTS = [
  'Lỗi hiển thị sản phẩm trên app', 'Đơn hàng chưa được giao sau 7 ngày',
  'Hướng dẫn cập nhật thông tin cửa hàng', 'Sản phẩm bị lỗi từ đầu',
  'Yêu cầu hoàn tiền cho đơn hàng hủy', 'Không đăng nhập được tài khoản',
  'Lỗi thanh toán VNPay', 'Cần hỗ trợ về API', 'Báo lỗi tính năng tìm kiếm',
  'Yêu cầu xác minh cửa hàng', 'Không nhận được mã OTP', 'Lỗi upload hình ảnh sản phẩm',
  'Cần hỗ trợ cập nhật kho hàng', 'Báo cáo shop vi phạm', 'Lỗi hiển thị thông báo',
];
const TICKET_STATUSES: SupportTicket['status'][] = ['open', 'pending', 'resolved', 'closed'];
const TICKET_PRIORITIES: SupportTicket['priority'][] = ['low', 'medium', 'high'];
const TICKET_MESSAGES = [
  'Tôi gặp vấn đề này từ hôm qua và vẫn chưa được giải quyết. Mong được hỗ trợ sớm.',
  'Đơn hàng của tôi đã quá hạn giao nhưng vẫn chưa có thông tin cập nhật. Làm ơn kiểm tra giúp.',
  'Sản phẩm nhận được không đúng như mô tả trên website. Tôi yêu cầu đổi/trả.',
  'Tôi đã thanh toán thành công nhưng đơn hàng vẫn hiển thị "Chờ thanh toán".',
  'Cửa hàng tôi bị khách hàng phản ánh sai thông tin. Cần hỗ trợ cập nhật lại.',
  'Tôi cần hướng dẫn cách tạo mã khuyến mãi cho cửa hàng của mình.',
  'Không thể đăng tải sản phẩm mới. Hệ thống báo lỗi liên tục.',
  'Tôi muốn khiếu nại về việc shop bán hàng giả. Mong admin xử lý.',
];

export const MOCK_ADMIN_TICKETS: SupportTicket[] = Array.from({ length: 50 }, (_, i) => {
  const status = TICKET_STATUSES[i % TICKET_STATUSES.length];
  const priority = TICKET_PRIORITIES[i % TICKET_PRIORITIES.length];
  const day = Math.floor(i / 1);
  const created = new Date();
  created.setDate(created.getDate() - day);
  const updated = new Date(created);
  updated.setDate(updated.getDate() + Math.floor(i / 10));
  return {
    id: `TK${String(i + 1).padStart(3, '0')}`,
    subject: TICKET_SUBJECTS[i % TICKET_SUBJECTS.length],
    message: TICKET_MESSAGES[i % TICKET_MESSAGES.length],
    status,
    priority,
    createdAt: created.toISOString(),
    updatedAt: updated.toISOString(),
  };
});

// ─── Admin Stats Helper ───────────────────────────────────────────────────────
export const ADMIN_STATS = {
  totalRevenue: 9945000000,
  totalOrders: 8234,
  totalProducts: 5678,
  totalCustomers: 50432,
  totalStores: 50,
  totalPayments: 300,
  totalReviews: 100,
  totalPromotions: 50,
  totalTickets: 50,
};

// ─── Chart Data ────────────────────────────────────────────────────────────────
export const MONTHLY_REVENUE = [
  { month: 'T1', revenue: 1245000000, orders: 1234 },
  { month: 'T2', revenue: 1456000000, orders: 1456 },
  { month: 'T3', revenue: 1678000000, orders: 1678 },
  { month: 'T4', revenue: 1345000000, orders: 1345 },
  { month: 'T5', revenue: 1890000000, orders: 1890 },
  { month: 'T6', revenue: 2340000000, orders: 2340 },
];
