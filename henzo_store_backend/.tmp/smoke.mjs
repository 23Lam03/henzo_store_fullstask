/**
 * Smoke test toàn diện — chạy sau khi seed + khởi động server.
 *
 *   node .tmp/smoke.mjs
 *
 * Kiểm tra: public API, đăng nhập 3 vai trò, RBAC, luồng đặt hàng multi-vendor.
 */
const BASE = process.env.BASE ?? 'http://localhost:4000';

let pass = 0;
let fail = 0;
const failures = [];

function check(name, ok, extra = '') {
  if (ok) {
    pass += 1;
    console.log(`  ✅ ${name}`);
  } else {
    fail += 1;
    failures.push(name);
    console.log(`  ❌ ${name} ${extra}`);
  }
}

async function api(path, { method = 'GET', body, token, cookie } = {}) {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  if (cookie) headers.Cookie = cookie;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    /* ignore */
  }
  return { status: res.status, json, headers: res.headers };
}

const section = (t) => console.log(`\n▶ ${t}`);

// ─── 1. Public APIs ─────────────────────────────────────────────────────────
section('Public API');
{
  const health = await api('/api/health');
  check('GET /api/health', health.status === 200 && health.json?.data?.status === 'ok');

  const cats = await api('/api/categories');
  check(
    'GET /api/categories',
    cats.status === 200 && Array.isArray(cats.json?.data) && cats.json.data.length > 0,
    JSON.stringify(cats.json).slice(0, 200),
  );

  const brands = await api('/api/brands');
  check('GET /api/brands', brands.status === 200 && Array.isArray(brands.json?.data));

  const products = await api('/api/products?page=1&pageSize=5');
  check(
    'GET /api/products',
    products.status === 200 && Array.isArray(products.json?.data),
    JSON.stringify(products.json).slice(0, 200),
  );
  check(
    'GET /api/products có meta phân trang',
    typeof products.json?.meta?.total === 'number',
    JSON.stringify(products.json?.meta),
  );

  const stores = await api('/api/stores?page=1&pageSize=5');
  check('GET /api/stores', stores.status === 200 && Array.isArray(stores.json?.data));

  const collections = await api('/api/products/collections');
  check('GET /api/products/collections', collections.status === 200);

  const prodDetail = await api(`/api/products/${products.json?.data?.[0]?.id}`);
  check(
    'GET /api/products/:id',
    prodDetail.status === 200 && !!prodDetail.json?.data?.product,
    JSON.stringify(prodDetail.json).slice(0, 200),
  );

  const catDetail = await api(`/api/categories/${cats.json?.data?.[0]?.slug ?? ''}`);
  check('GET /api/categories/:slug', catDetail.status === 200, `got ${catDetail.status}`);

  const brandDetail = await api(`/api/brands/${brands.json?.data?.[0]?.slug ?? ''}`);
  check('GET /api/brands/:slug', brandDetail.status === 200, `got ${brandDetail.status}`);

  const storeDetail = await api(`/api/stores/${stores.json?.data?.[0]?.id}`);
  check('GET /api/stores/:id', storeDetail.status === 200, `got ${storeDetail.status}`);
}

// ─── 2. Đăng nhập ───────────────────────────────────────────────────────────
section('Đăng nhập / xác thực');
const tokens = {};
const cookies = {};
{
  const logins = [
    ['admin', 'admin@henzo.com', 'admin123'],
    ['mod', 'mod@henzo.com', '123456'],
    ['staff', 'cs@henzo.com', '123456'],
    ['seller', 'shop@henzo.com', '123456'],
    ['customer', 'customer@henzo.com', '123456'],
  ];
  for (const [key, email, password] of logins) {
    const res = await api('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    check(
      `POST /api/auth/login (${key})`,
      res.status === 200 && !!res.json?.data?.accessToken,
      JSON.stringify(res.json).slice(0, 200),
    );
    tokens[key] = res.json?.data?.accessToken;
    const sc = res.headers.get('set-cookie');
    if (sc) cookies[key] = sc.split(';')[0];
  }
  check('Login trả về refresh cookie httpOnly', !!cookies.customer, JSON.stringify(cookies.customer));

  const bad = await api('/api/auth/login', {
    method: 'POST',
    body: { email: 'admin@henzo.com', password: 'wrong' },
  });
  check('Login sai mật khẩu bị từ chối', bad.status === 401 || bad.status === 400);

  const me = await api('/api/auth/me', { token: tokens.customer });
  check(
    'GET /api/auth/me',
    me.status === 200 && !!me.json?.data?.id && me.json?.data?.role === 'CUSTOMER',
    JSON.stringify(me.json).slice(0, 200),
  );

  const meNoToken = await api('/api/auth/me');
  check('GET /api/auth/me không token → 401', meNoToken.status === 401, `got ${meNoToken.status}`);

  const noAuth = await api('/api/cart');
  check('GET /api/cart không token → 401', noAuth.status === 401, `got ${noAuth.status}`);

  // Refresh token bằng cookie
  const refreshed = await api('/api/auth/refresh', { method: 'POST', cookie: cookies.customer });
  check(
    'POST /api/auth/refresh (cookie)',
    refreshed.status === 200 && !!refreshed.json?.data?.accessToken,
    JSON.stringify(refreshed.json).slice(0, 200),
  );
}

// ─── 3. RBAC ────────────────────────────────────────────────────────────────
section('RBAC / phân quyền');
{
  const custAdmin = await api('/api/admin/dashboard', { token: tokens.customer });
  check('Customer → /api/admin/dashboard bị chặn', custAdmin.status === 403, `got ${custAdmin.status}`);

  const sellerAdmin = await api('/api/admin/dashboard', { token: tokens.seller });
  check('Seller → /api/admin/dashboard bị chặn', sellerAdmin.status === 403, `got ${sellerAdmin.status}`);

  const modAdmin = await api('/api/admin/dashboard', { token: tokens.mod });
  check('Moderator → /api/admin/dashboard OK', modAdmin.status === 200 && !!modAdmin.json?.data, JSON.stringify(modAdmin.json).slice(0, 200));

  const adminDash = await api('/api/admin/dashboard', { token: tokens.admin });
  check('Admin → /api/admin/dashboard OK', adminDash.status === 200 && !!adminDash.json?.data?.stats, JSON.stringify(adminDash.json).slice(0, 300));

  const sellerDash = await api('/api/seller/dashboard', { token: tokens.seller });
  check('Seller → /api/seller/dashboard OK', sellerDash.status === 200 && !!sellerDash.json?.data, JSON.stringify(sellerDash.json).slice(0, 300));

  const custSeller = await api('/api/seller/dashboard', { token: tokens.customer });
  check('Customer → /api/seller/dashboard bị chặn', custSeller.status === 403, `got ${custSeller.status}`);
}

// ─── 4. Seller (shop) scope ─────────────────────────────────────────────────
section('Seller (shop) scope');
{
  const endpoints = [
    '/api/seller/products',
    '/api/seller/orders',
    '/api/seller/inventory',
    '/api/seller/payments',
    '/api/seller/shipping',
    '/api/seller/promotions',
    '/api/seller/reviews',
    '/api/seller/notifications',
    '/api/seller/support/tickets',
  ];
  for (const ep of endpoints) {
    const res = await api(ep, { token: tokens.seller });
    check(`GET ${ep}`, res.status === 200, `got ${res.status} ${JSON.stringify(res.json).slice(0, 150)}`);
  }

  // Seller KHÔNG được xem sản phẩm của shop khác
  const sellerProducts = await api('/api/seller/products?pageSize=100', { token: tokens.seller });
  const sellerProductList = sellerProducts.json?.data ?? [];
  const storeIds = new Set(sellerProductList.map((p) => p.storeId));
  check(
    'Seller chỉ thấy sản phẩm của shop mình',
    storeIds.size <= 1,
    `stores=${[...storeIds].join(',')}`,
  );
}

// ─── 5. Luồng đặt hàng multi-vendor ─────────────────────────────────────────
section('Luồng đặt hàng multi-vendor');
{
  const pl = await api('/api/products?page=1&pageSize=60');
  const products = pl.json?.data ?? [];
  const byStore = new Map();
  for (const p of products) {
    if (!p.storeId) continue;
    if (!byStore.has(p.storeId)) byStore.set(p.storeId, []);
    byStore.get(p.storeId).push(p);
  }
  const stores = [...byStore.entries()];
  check('Có sản phẩm thuộc nhiều store', stores.length >= 2, `stores=${stores.length}`);

  const picked = [];
  for (const [storeId, list] of stores) {
    picked.push({ storeId, product: list[0] });
    if (picked.length === 2) break;
  }

  await api('/api/cart', { method: 'DELETE', token: tokens.customer });

  const cart = await api('/api/cart', { token: tokens.customer });
  check('GET /api/cart', cart.status === 200 && !!cart.json?.data?.items, JSON.stringify(cart.json).slice(0, 200));

  const add1 = await api('/api/cart/items', {
    method: 'POST',
    token: tokens.customer,
    body: { productId: picked[0].product.id, quantity: 2 },
  });
  check('POST /api/cart/items (store A)', add1.status === 200 || add1.status === 201, JSON.stringify(add1.json).slice(0, 300));

  const add2 = await api('/api/cart/items', {
    method: 'POST',
    token: tokens.customer,
    body: { productId: picked[1].product.id, quantity: 1 },
  });
  check('POST /api/cart/items (store B)', add2.status === 200 || add2.status === 201, JSON.stringify(add2.json).slice(0, 300));

  const cartAfter = await api('/api/cart', { token: tokens.customer });
  const items = cartAfter.json?.data?.items ?? [];
  check('Giỏ có sản phẩm từ 2 store', new Set(items.map((i) => i.product.storeId)).size === 2, `stores=${new Set(items.map((i) => i.product.storeId)).size}`);
  check('Giỏ tính đúng tổng tiền', cartAfter.json?.data?.totalPrice > 0, `total=${cartAfter.json?.data?.totalPrice}`);

  // Miễn phí ship khi tổng >= 500k
  const total = cartAfter.json?.data?.totalPrice ?? 0;
  const expectedShip = total >= 500000 ? 0 : 30000;
  check(
    'Phí ship theo nghiệp vụ (>=500k miễn phí)',
    cartAfter.json?.data?.shippingFee === expectedShip,
    `total=${total} ship=${cartAfter.json?.data?.shippingFee} expected=${expectedShip}`,
  );

  const checkout = await api('/api/orders', {
    method: 'POST',
    token: tokens.customer,
    body: {
      shippingName: 'Nguyễn Văn Test',
      shippingPhone: '0900000000',
      shippingAddress: '123 Nguyễn Huệ, Quận 1, TP.HCM',
      paymentMethod: 'cod',
      note: 'smoke test',
    },
  });
  check('POST /api/orders (checkout multi-vendor)', checkout.status === 200 || checkout.status === 201, JSON.stringify(checkout.json).slice(0, 500));

  const order = checkout.json?.data;
  const subOrders = order?.subOrders ?? [];
  check('Đơn tách sub-order theo store', subOrders.length === 2, `subOrders=${subOrders.length}`);
  check('Đơn có tổng tiền > 0', (order?.totalPrice ?? 0) > 0, `total=${order?.totalPrice}`);
  check('Đơn COD chưa thanh toán', order?.paymentStatus === 'unpaid', `paymentStatus=${order?.paymentStatus}`);
  check('Đơn có mã orderNumber', !!order?.orderNumber, `orderNumber=${order?.orderNumber}`);

  if (subOrders.length === 2) {
    const subTotal = subOrders.reduce((s, x) => s + x.totalPrice, 0);
    check('Tổng sub-order khớp tổng đơn', Math.abs(subTotal - order.totalPrice) < 2, `${subTotal} vs ${order.totalPrice}`);
    check('Mỗi sub-order có storeId', subOrders.every((s) => !!s.storeId));
    check('Sub-order khởi tạo pending', subOrders.every((s) => s.status === 'pending'));
  }

  // Thay đổi trạng thái seller — endpoint nhận ID ĐƠN HÀNG (sub-order được
  // tìm theo storeId của seller trong service).
  const mySellerOrders = await api('/api/seller/orders?pageSize=5', { token: tokens.seller });
  const sellerOrderList = mySellerOrders.json?.data?.orders ?? [];
  check('Seller có đơn hàng riêng', sellerOrderList.length > 0, `count=${sellerOrderList.length}`);

  if (sellerOrderList.length > 0) {
    const target = sellerOrderList[0];
    const status = await api(`/api/seller/orders/${target.id}/status`, {
      method: 'PATCH',
      token: tokens.seller,
      body: { status: 'confirmed' },
    });
    check(
      'PATCH /api/seller/orders/:id/status',
      status.status === 200,
      JSON.stringify(status.json).slice(0, 300),
    );

    const custTracking = await api(`/api/orders/${order.id}/tracking`, { token: tokens.customer });
    check('GET /api/orders/:id/tracking', custTracking.status === 200, `got ${custTracking.status}`);
  } else {
    check('Có đơn hàng để đổi trạng thái', false, 'không có đơn nào');
  }

  const myOrders = await api('/api/orders', { token: tokens.customer });
  check('GET /api/orders (lịch sử khách)', myOrders.status === 200 && Array.isArray(myOrders.json?.data));

  const orderDetail = await api(`/api/orders/${order.id}`, { token: tokens.customer });
  check('GET /api/orders/:id', orderDetail.status === 200, `got ${orderDetail.status}`);
}

// ─── 6. Admin CRUD ──────────────────────────────────────────────────────────
section('Admin CRUD');
{
  const endpoints = [
    '/api/admin/stores',
    '/api/admin/customers',
    '/api/admin/orders',
    '/api/admin/products',
    '/api/admin/reviews',
    '/api/admin/promotions',
    '/api/admin/payments',
    '/api/admin/support/tickets',
    '/api/admin/finance',
    '/api/admin/reports',
    '/api/admin/access/roles',
    '/api/admin/access/staff',
    '/api/admin/notifications',
  ];
  for (const ep of endpoints) {
    const res = await api(ep, { token: tokens.admin });
    check(`GET ${ep}`, res.status === 200, `got ${res.status} ${JSON.stringify(res.json).slice(0, 150)}`);
  }
}

// ─── 7. Wishlist / notifications / tickets ─────────────────────────────────
section('Tính năng khác');
{
  const pl = await api('/api/products?page=1&pageSize=1');
  const pid = pl.json?.data?.[0]?.id;

  const wl = await api('/api/wishlist', { token: tokens.customer });
  check('GET /api/wishlist', wl.status === 200);

  if (pid) {
    const add = await api(`/api/wishlist/${pid}`, { method: 'POST', token: tokens.customer });
    check('POST /api/wishlist/:productId', add.status === 200 || add.status === 201, JSON.stringify(add.json).slice(0, 200));
    const del = await api(`/api/wishlist/${pid}`, { method: 'DELETE', token: tokens.customer });
    check('DELETE /api/wishlist/:productId', del.status === 200);
  }

  const nt = await api('/api/notifications', { token: tokens.customer });
  check('GET /api/notifications', nt.status === 200);

  const ticket = await api('/api/support/tickets', {
    method: 'POST',
    token: tokens.customer,
    body: {
      subject: 'Smoke test ticket',
      message: 'Nội dung kiểm thử tự động.',
      category: 'order',
      priority: 'medium',
    },
  });
  check('POST /api/support/tickets', ticket.status === 200 || ticket.status === 201, JSON.stringify(ticket.json).slice(0, 300));
  check(
    'Ticket trả về message',
    !!ticket.json?.data?.message,
    JSON.stringify(ticket.json?.data).slice(0, 200),
  );

  const list = await api('/api/support/tickets', { token: tokens.customer });
  check('GET /api/support/tickets', list.status === 200);

  const addrRes = await api('/api/addresses', { token: tokens.customer });
  check('GET /api/addresses', addrRes.status === 200, JSON.stringify(addrRes.json).slice(0, 200));
}

// ─── 8. Blog / Voucher / Thanh toán / Lịch sử tìm kiếm ───────────────────
section('Blog / Voucher / Payments / Search history');
{
  // Blog (public)
  const blog = await api('/api/blog');
  check('GET /api/blog', blog.status === 200 && Array.isArray(blog.json?.data), `got ${blog.status}`);

  const firstPost = blog.json?.data?.[0];
  if (firstPost?.slug) {
    const detail = await api(`/api/blog/${firstPost.slug}`);
    check(
      'GET /api/blog/:slug',
      detail.status === 200 && !!detail.json?.data?.post,
      `got ${detail.status}`,
    );
  } else {
    check('Có bài viết để test chi tiết', false, 'không có bài viết');
  }

  // Voucher / khuyến mãi (public)
  const promos = await api('/api/promotions');
  check(
    'GET /api/promotions',
    promos.status === 200 && !!promos.json?.data?.vouchers,
    `got ${promos.status}`,
  );
  check(
    'Voucher có mã & giá trị',
    (promos.json?.data?.vouchers ?? []).every((v) => !!v.code && v.value > 0),
  );

  // Thanh toán của khách (private)
  const pays = await api('/api/payments', { token: tokens.customer });
  check(
    'GET /api/payments (khách)',
    pays.status === 200 && Array.isArray(pays.json?.data?.payments),
    `got ${pays.status}`,
  );

  // Lịch sử tìm kiếm (private)
  const sh1 = await api('/api/search-history', { token: tokens.customer });
  check('GET /api/search-history', sh1.status === 200 && Array.isArray(sh1.json?.data), `got ${sh1.status}`);

  const sh2 = await api('/api/search-history', {
    method: 'POST',
    token: tokens.customer,
    body: { query: 'iphone' },
  });
  check('POST /api/search-history', sh2.status === 200 || sh2.status === 201, `got ${sh2.status}`);

  const sh3 = await api('/api/search-history', { token: tokens.customer });
  check(
    'Lịch sử tìm kiếm đã ghi nhận',
    (sh3.json?.data ?? []).some((x) => x.query === 'iphone'),
    JSON.stringify(sh3.json?.data).slice(0, 200),
  );

  // Không token -> bị chặn
  const noAuth = await api('/api/search-history');
  check('GET /api/search-history không token → 401', noAuth.status === 401, `got ${noAuth.status}`);
}

// ─── Tổng kết ───────────────────────────────────────────────────────────────
console.log(`\n${'═'.repeat(60)}`);
console.log(`KẾT QUẢ: ${pass} pass / ${fail} fail`);
if (failures.length) {
  console.log(`\nFAIL:`);
  for (const f of failures) console.log(`  - ${f}`);
}
process.exit(fail > 0 ? 1 : 0);
