/**
 * KHÔI PHỤC KHÁCH HÀNG / CỬA HÀNG BỊ XOÁ NHẦM.
 *
 * Bối cảnh: khi kiểm tra chức năng nút "Xoá" trên UI, route
 * `DELETE /api/admin/customers/:id` và `DELETE /api/admin/stores/:id` xoá
 * CỨNG (hard delete) — nên dùng để test sẽ mất dữ liệu thật.
 *
 * Script này đối chiếu DB với `scripts/data/frontend-mock.json` (nguồn seed
 * gốc) và tạo lại những bản ghi bị thiếu — giữ nguyên `_id` gốc để các
 * quan hệ (đơn hàng, đánh giá, sản phẩm) không bị đứt liên kết.
 *
 * Chạy: npx tsx scripts/restore-deleted-records.ts
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { isValidObjectId, Types } from 'mongoose';

import { connectDB, disconnectDB } from '../src/server/db.ts';
import { UserModel } from '../src/server/models/User.ts';
import { StoreModel } from '../src/server/models/Store.ts';
import { ProductModel } from '../src/server/models/Product.ts';
import { OrderModel } from '../src/server/models/Order.ts';
import { hashPassword } from '../src/server/auth/tokens.ts';

interface MockData {
  stores: any[];
  adminStores: any[];
  adminCustomers: any[];
}

/** Tìm file mock không quan tâm thư mục chạy. */
function resolveMockDataPath(): string {
  const candidates = [
    resolve(process.cwd(), 'scripts/data/frontend-mock.json'),
    resolve(process.cwd(), '../scripts/data/frontend-mock.json'),
  ];
  for (const c of candidates) if (existsSync(c)) return c;
  throw new Error('Không tìm thấy scripts/data/frontend-mock.json');
}

async function main() {
  const mock = JSON.parse(
    readFileSync(resolveMockDataPath(), 'utf-8'),
  ) as MockData;

  await connectDB();
  console.log('[restore] Đã kết nối MongoDB.');

  const password = await hashPassword('123456');

  // ─── 1. Khôi phục khách hàng ──────────────────────────────────────────────
  let restoredUsers = 0;
  for (const c of mock.adminCustomers ?? []) {
    const email = String(c.email ?? '').toLowerCase();
    if (!email) continue;
    const exists = await UserModel.findOne({ email }).lean();
    if (exists) continue;

    await UserModel.create({
      name: c.name,
      email,
      role: 'CUSTOMER',
      status: 'active',
      phone: c.phone,
      address: c.address,
      avatar: c.avatar,
      password,
      points: c.points ?? 0,
      createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
    });
    console.log(`[restore] + Khách hàng ${email} (${c.name})`);
    restoredUsers++;
  }
  console.log(`[restore] Khôi phục ${restoredUsers} khách hàng.`);

  // ─── 1b. Khôi phục khách hàng mồ côi (dựa trên đơn hàng) ────────────────
  // Đơn hàng giữ `customerId` + `customerName` — dùng để dựng lại user bị
  // xoá nhầm mà không có trong file mock (tạo ngoài seed).
  const orders = await OrderModel.find({}).select(
    'customerId customerName',
  ).lean();
  const existingIds = new Set(
    (await UserModel.find({}).select('_id').lean()).map((u) => String(u._id)),
  );
  const orphanMap = new Map<
    string,
    { name: string; email: string; count: number }
  >();
  for (const o of orders) {
    if (!o.customerId) continue;
    const key = String(o.customerId);
    if (existingIds.has(key)) continue;
    const entry = orphanMap.get(key) ?? {
      name: o.customerName ?? 'Khách hàng',
      email: '',
      count: 0,
    };
    entry.count++;
    orphanMap.set(key, entry);
  }

  let restoredOrphans = 0;
  for (const [id, info] of orphanMap) {
    if (!isValidObjectId(id)) continue;
    await UserModel.create({
      _id: new Types.ObjectId(id),
      name: info.name,
      email:
        info.email || `khach-${id.slice(-6)}@henzo.com`,
      role: 'CUSTOMER',
      status: 'active',
      phone: '0900000000',
      address: '',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${info.name}`,
      password,
      points: 0,
      createdAt: new Date(),
    });
    console.log(
      `[restore] + Khách hàng mồ côi ${info.name} (${id}) — ${info.count} đơn hàng.`,
    );
    restoredOrphans++;
  }
  console.log(`[restore] Khôi phục ${restoredOrphans} khách hàng mồ côi.`);

  // ─── 2. Khôi phục cửa hàng ───────────────────────────────────────────────
  const sourceStores = [
    ...(mock.stores ?? []),
    ...(mock.adminStores ?? []).filter(
      (s: any) => !(mock.stores ?? []).some((x: any) => x.name === s.name),
    ),
  ];

  let restoredStores = 0;
  for (const s of sourceStores) {
    const name = String(s.name ?? '');
    if (!name) continue;
    const exists = await StoreModel.findOne({ name }).lean();
    if (exists) continue;

    const doc = await StoreModel.create({
      name,
      slug: name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, ''),
      email: s.email,
      phone: s.phone,
      address: s.address,
      avatar: s.avatar,
      banner: s.banner ?? '',
      description: s.description ?? '',
      rating: s.rating ?? 0,
      productCount: 0,
      orderCount: s.orderCount ?? 0,
      followerCount: s.followerCount ?? 0,
      isVerified: s.isVerified ?? false,
      status: s.status ?? 'active',
      taxId: s.taxId ?? '',
      bankAccount: s.bankAccount ?? '',
      bankName: s.bankName ?? 'Vietcombank',
      createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
    });
    console.log(`[restore] + Cửa hàng ${name}`);
    restoredStores++;

    // Gỡ ẩn các sản phẩm của cửa hàng (xoá store đã set status=hidden).
    const unhidden = await ProductModel.updateMany(
      { storeId: doc._id },
      { $set: { status: 'active' } },
    );
    if (unhidden.modifiedCount) {
      console.log(
        `[restore]   → gỡ ẩn ${unhidden.modifiedCount} sản phẩm của cửa hàng.`,
      );
    }
  }
  console.log(`[restore] Khôi phục ${restoredStores} cửa hàng.`);

  // ─── 3. Đồng bộ lại productCount ─────────────────────────────────────────
  const stores = await StoreModel.find({}).select('_id').lean();
  for (const st of stores) {
    const count = await ProductModel.countDocuments({
      storeId: st._id,
      status: { $ne: 'hidden' },
    });
    await StoreModel.updateOne({ _id: st._id }, { $set: { productCount: count } });
  }
  console.log('[restore] Đã đồng bộ productCount cho cửa hàng.');

  // ─── 4. Tổng kết ─────────────────────────────────────────────────────────
  console.log(
    `[restore] Tổng: ${await UserModel.countDocuments({})} người dùng, ${
      await StoreModel.countDocuments({})
    } cửa hàng, ${await ProductModel.countDocuments({})} sản phẩm.`,
  );

  await disconnectDB();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
