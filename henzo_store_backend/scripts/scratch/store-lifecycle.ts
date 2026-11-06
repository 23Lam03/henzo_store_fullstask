import { connectDB } from '../../src/server/db';
import { StoreModel } from '../../src/server/models/Store';

const BASE = 'http://localhost:4000';

async function main() {
  await connectDB();
  const r = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@henzo.com', password: 'admin123' }),
  });
  const token = (await r.json())?.data?.accessToken ?? '';
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const name = `TEST STORE ${Date.now()}`;

  console.log('=== TẠO STORE ===');
  const resCreate = await fetch(`${BASE}/api/admin/stores`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name,
      email: `test${Date.now()}@henzo.vn`,
      phone: '0900000000',
      address: '1 Đường Test, Quận 1, TP.HCM',
      description: 'Cửa hàng test tạm',
    }),
  });
  const created = await resCreate.json().catch(() => null);
  const storeId = created?.data?.id;
  console.log(
    `${resCreate.status === 201 || resCreate.status === 200 ? '✅' : '❌'} POST store: HTTP ${resCreate.status} — ${created?.error?.message ?? ''}`,
  );
  console.log('   store id:', storeId, '| tên:', created?.data?.name);

  if (storeId) {
    console.log('\n=== CẬP NHẬT STORE ===');
    const resUp = await fetch(`${BASE}/api/admin/stores/${storeId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ name: `${name} (đã sửa)`, description: 'Đã cập nhật' }),
    });
    const up = await resUp.json().catch(() => null);
    console.log(
      `${resUp.status === 200 ? '✅' : '❌'} PATCH store: HTTP ${resUp.status} — tên mới: ${up?.data?.name ?? up?.error?.message}`,
    );

    console.log('\n=== XOÁ STORE ===');
    const resDel = await fetch(`${BASE}/api/admin/stores/${storeId}`, {
      method: 'DELETE',
      headers,
    });
    const del = await resDel.json().catch(() => null);
    console.log(
      `${resDel.status === 200 ? '✅' : '❌'} DELETE store: HTTP ${resDel.status} — ${del?.error?.message ?? 'đã xoá'}`,
    );
    const left = await StoreModel.findById(storeId).lean();
    console.log(`${!left ? '✅' : '❌'} store đã bị xoá khỏi DB`);
  }

  await StoreModel.deleteMany({ name: { $regex: /^TEST STORE/ } });
  console.log('\nđã dọn store test còn sót');
  process.exit(0);
}
main();
