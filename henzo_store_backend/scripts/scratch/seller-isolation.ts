import { connectDB } from '../../src/server/db';
import { ProductModel } from '../../src/server/models/Product';
import { StoreModel } from '../../src/server/models/Store';
import { UserModel } from '../../src/server/models/User';

const BASE = 'http://localhost:4000';

async function main() {
  await connectDB();

  const seller = await UserModel.findOne({ email: 'shop@henzo.com' }).lean();
  if (!seller) throw new Error('không tìm thấy seller shop@henzo.com');
  const myStore = await StoreModel.findOne({ ownerId: seller._id }).lean();
  console.log('seller store:', myStore?.name, '| id:', myStore?._id);

  const otherProduct = await ProductModel.findOne({
    storeId: { $nin: [myStore?._id] },
  }).lean();
  console.log('sản phẩm của store khác:', otherProduct?.name, '| storeId:', otherProduct?.storeId);

  const ownProduct = await ProductModel.findOne({ storeId: myStore?._id }).lean();
  console.log('sản phẩm của seller:', ownProduct?.name);

  const r = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'shop@henzo.com', password: '123456' }),
  });
  const token = (await r.json())?.data?.accessToken ?? '';

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  console.log('\n=== SELLER SỬA SẢN PHẨM CỦA STORE KHÁC (phải bị chặn) ===');
  const res1 = await fetch(`${BASE}/api/seller/products/${otherProduct!._id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ name: 'HACKED' }),
  });
  const b1 = await res1.json().catch(() => null);
  console.log(
    `${[400, 401, 403].includes(res1.status) ? '✅' : '❌'} PATCH store khác: HTTP ${res1.status} — ${b1?.error?.message ?? b1?.message ?? ''}`,
  );
  const after = await ProductModel.findById(otherProduct!._id).lean();
  console.log(
    `${after?.name !== 'HACKED' ? '✅' : '❌'} tên sản phẩm không bị đổi: "${after?.name}"`,
  );

  console.log('\n=== SELLER XOÁ SẢN PHẨM CỦA STORE KHÁC (phải bị chặn) ===');
  const res2 = await fetch(`${BASE}/api/seller/products/${otherProduct!._id}`, {
    method: 'DELETE',
    headers,
  });
  const b2 = await res2.json().catch(() => null);
  console.log(
    `${[400, 401, 403].includes(res2.status) ? '✅' : '❌'} DELETE store khác: HTTP ${res2.status} — ${b2?.error?.message ?? b2?.message ?? ''}`,
  );
  const still = await ProductModel.findById(otherProduct!._id).lean();
  console.log(`${still ? '✅' : '❌'} sản phẩm vẫn tồn tại`);

  if (ownProduct) {
    console.log('\n=== SELLER SỬA SẢN PHẨM CỦA CHÍNH MÌNH (phải được phép) ===');
    const res3 = await fetch(`${BASE}/api/seller/products/${ownProduct._id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ stock: ownProduct.stock }),
    });
    console.log(
      `${res3.status === 200 ? '✅' : '❌'} PATCH sản phẩm của mình: HTTP ${res3.status}`,
    );
  }

  process.exit(0);
}
main();
