/**
 * Kiểm tra RBAC end-to-end: customer / seller / admin trên các API then chốt.
 * Chạy: npx tsx scripts/scratch/rbac-check.ts
 */
const BASE = 'http://localhost:4000';

async function login(email: string, password: string) {
  const r = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const j = await r.json();
  return j?.data?.accessToken ?? '';
}

async function call(
  path: string,
  token: string,
  init: RequestInit = {},
): Promise<{ status: number; body: any }> {
  const r = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });
  let body: any = null;
  try {
    body = await r.json();
  } catch {
    body = null;
  }
  return { status: r.status, body };
}

function expect(label: string, actual: number, allowed: number[]) {
  const ok = allowed.includes(actual);
  console.log(
    `${ok ? '✅' : '❌'} ${label}: HTTP ${actual} (kỳ vọng ${allowed.join('/')})`,
  );
  return ok;
}

async function main() {
  const customer = await login('customer@henzo.com', '123456');
  const admin = await login('admin@henzo.com', 'admin123');
  const seller = await login('shop@henzo.com', '123456');

  console.log('--- token ---');
  console.log(`customer: ${customer ? 'OK' : 'FAIL'}`);
  console.log(`admin:    ${admin ? 'OK' : 'FAIL'}`);
  console.log(`seller:   ${seller ? 'OK' : 'FAIL'}`);

  console.log('\n=== CUSTOMER ===');
  expect('GET /api/admin/products (khách)', (await call('/api/admin/products', customer)).status, [401, 403]);
  expect('GET /api/admin/stores (khách)', (await call('/api/admin/stores', customer)).status, [401, 403]);
  expect('GET /api/admin/orders (khách)', (await call('/api/admin/orders', customer)).status, [401, 403]);
  expect('GET /api/seller/products (khách)', (await call('/api/seller/products', customer)).status, [401, 403]);
  expect('GET /api/products (khách - công khai)', (await call('/api/products', customer)).status, [200]);
  expect('GET /api/orders (khách - của mình)', (await call('/api/orders', customer)).status, [200]);

  console.log('\n=== SELLER ===');
  expect('GET /api/seller/products (seller)', (await call('/api/seller/products', seller)).status, [200]);
  expect('GET /api/seller/orders (seller)', (await call('/api/seller/orders?pageSize=50', seller)).status, [200]);
  expect('GET /api/seller/inventory (seller)', (await call('/api/seller/inventory', seller)).status, [200]);
  expect('GET /api/admin/products (seller)', (await call('/api/admin/products', seller)).status, [401, 403]);
  expect('GET /api/admin/stores (seller)', (await call('/api/admin/stores', seller)).status, [401, 403]);
  expect('GET /api/admin/orders (seller)', (await call('/api/admin/orders', seller)).status, [401, 403]);

  console.log('\n=== ADMIN ===');
  expect('GET /api/admin/products (admin)', (await call('/api/admin/products', admin)).status, [200]);
  expect('GET /api/admin/stores (admin)', (await call('/api/admin/stores', admin)).status, [200]);
  expect('GET /api/admin/orders (admin)', (await call('/api/admin/orders', admin)).status, [200]);
  expect('GET /api/admin/customers (admin)', (await call('/api/admin/customers', admin)).status, [200]);

  console.log('\n=== KHÔNG TOKEN ===');
  expect('GET /api/orders (không token)', (await call('/api/orders')).status, [401]);
  expect('GET /api/admin/products (không token)', (await call('/api/admin/products')).status, [401]);
  expect('GET /api/seller/products (không token)', (await call('/api/seller/products')).status, [401]);
}

main();
