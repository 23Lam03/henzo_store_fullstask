/**
 * Kiểm chứng tích hợp nhóm 1-3 với MongoDB thật.
 *
 * Chạy: npx tsx scripts/verify-integration.ts
 *
 * Test tự tạo dữ liệu rồi dọn dẹp — không đụng vào dữ liệu đang có.
 */
import { connectDB, disconnectDB } from '../src/server/db';
import { ProductModel } from '../src/server/models/Product';
import { PaymentModel } from '../src/server/models/Payment';
import { OrderModel } from '../src/server/models/Order';
import {
  restoreStockForSubOrders,
  deductStock,
  canRestoreSubOrder,
} from '../src/server/services/inventory.service';
import { PLATFORM_FEE_RATE } from '../src/server/constants';

let failures = 0;
function check(name: string, cond: boolean, detail?: unknown) {
  if (cond) console.log(`  ✓ ${name}`);
  else {
    failures++;
    console.log(`  ✗ ${name}`, detail !== undefined ? JSON.stringify(detail) : '');
  }
}

/** Tạo product test với storeId giả (không cần store thật). */
async function makeProduct(stock: number, sold: number) {
  const { Types } = await import('mongoose');
  const doc = await ProductModel.create({
    name: '[TEST] product',
    slug: `test-prod-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    description: 'test',
    price: 100000,
    stock,
    sold,
    storeId: new Types.ObjectId(),
    categoryName: 'test',
  });
  return doc as any;
}

async function main() {
  await connectDB();
  console.log('\n═══ NHÓM 1: Hoàn tồn kho ═══');

  // --- 1.1 sold không bị âm ---
  {
    const p = await makeProduct(10, 3);
    await ProductModel.updateOne(
      { _id: p._id },
      [
        {
          $set: {
            stock: { $add: ['$stock', 5] },
            sold: { $max: [0, { $subtract: [{ $ifNull: ['$sold', 0] }, 5] }] },
          },
        },
      ],
      { updatePipeline: true },
    );
    const after = await ProductModel.findById(p._id);
    check('sold = 3 - 5 -> ghim về 0 (không âm)', after!.sold === 0, {
      sold: after!.sold,
    });
    check('stock = 10 + 5 = 15', after!.stock === 15, { stock: after!.stock });
    await ProductModel.deleteOne({ _id: p._id });
  }

  // --- 1.2 chỉ hoàn cho sub-order còn ở kho ---
  {
    const p1 = await makeProduct(10, 2);
    const p2 = await makeProduct(10, 4);
    await restoreStockForSubOrders([
      {
        storeId: 'store-a',
        status: 'pending',
        items: [
          { productId: String(p1._id), quantity: 3 },
          { productId: String(p2._id), quantity: 1 },
        ],
      },
    ]);
    const a1 = await ProductModel.findById(p1._id);
    const a2 = await ProductModel.findById(p2._id);
    check('product 1: stock 10->13, sold 2->0', a1!.stock === 13 && a1!.sold === 0, {
      stock: a1!.stock,
      sold: a1!.sold,
    });
    check('product 2: stock 10->11, sold 4->3', a2!.stock === 11 && a2!.sold === 3, {
      stock: a2!.stock,
      sold: a2!.sold,
    });
    await ProductModel.deleteMany({ _id: { $in: [p1._id, p2._id] } });
  }

  // --- 1.3 idempotent: gọi 2 lần chỉ hoàn 1 lần ---
  {
    const p = await makeProduct(10, 2);
    // Lần 1: sub-order còn ở kho (pending) -> được hoàn.
    await restoreStockForSubOrders([
      {
        storeId: 'store-a',
        status: 'pending',
        items: [{ productId: String(p._id), quantity: 3 }],
      },
    ]);
    // Lần 2: sub-order đã chuyển sang cancelled -> KHÔNG hoàn thêm.
    await restoreStockForSubOrders([
      {
        storeId: 'store-a',
        status: 'cancelled',
        items: [{ productId: String(p._id), quantity: 3 }],
      },
    ]);
    const after = await ProductModel.findById(p._id);
    check(
      'hoàn 2 lần -> stock chỉ +3 (13), sold 0',
      after!.stock === 13 && after!.sold === 0,
      { stock: after!.stock, sold: after!.sold },
    );
    await ProductModel.deleteOne({ _id: p._id });
  }

  // --- 1.4 sold lớn hơn qty ---
  {
    const p = await makeProduct(10, 20);
    await restoreStockForSubOrders([
      {
        storeId: 's',
        status: 'pending',
        items: [{ productId: String(p._id), quantity: 3 }],
      },
    ]);
    const after = await ProductModel.findById(p._id);
    check('sold 20 - 3 = 17 (không âm)', after!.sold === 17, { sold: after!.sold });
    await ProductModel.deleteOne({ _id: p._id });
  }

  // --- 1.5 deductStock chặn âm kho ---
  {
    const p = await makeProduct(5, 0);
    const ok1 = await deductStock(p._id, 3);
    const ok2 = await deductStock(p._id, 10);
    const after = await ProductModel.findById(p._id);
    check('trừ 3 trong kho 5 -> OK', ok1 === true);
    check('trừ 10 khi chỉ còn 2 -> bị chặn', ok2 === false);
    check('stock không âm (2)', after!.stock === 2, { stock: after!.stock });
    await ProductModel.deleteOne({ _id: p._id });
  }

  console.log('\n═══ NHÓM 3: Phí sàn ═══');

  // --- 3.1 platformFee tính đúng tỷ lệ ---
  {
    const amount = 1000000;
    const fee = Math.floor(amount * PLATFORM_FEE_RATE);
    check('fee = floor(1.000.000 * 2.3%) = 23.000', fee === 23000, { fee });
    check('tỷ lệ phí sàn = 2.3%', PLATFORM_FEE_RATE === 0.023);
    check('netAmount = amount - fee', amount - fee === 977000);
  }

  // --- 3.2 Payment lưu đúng storeId + platformFee ---
  {
    const { Types } = await import('mongoose');
    const storeId = new Types.ObjectId();
    const orderId = new Types.ObjectId();
    const amount = 500000;
    const fee = Math.floor(amount * PLATFORM_FEE_RATE);
    const doc = await PaymentModel.create({
      orderId,
      orderCode: 'TEST-001',
      storeId,
      amount,
      platformFee: fee,
      netAmount: amount - fee,
      method: 'cod',
      paymentMethod: 'cod',
      status: 'success',
      transactionId: 'TX_TEST_001',
    });
    const found = await PaymentModel.findById(doc._id).lean();
    check('Payment lưu đúng storeId', String(found!.storeId) === String(storeId));
    check('Payment lưu đúng platformFee', found!.platformFee === fee, {
      platformFee: found!.platformFee,
    });
    check('Payment lưu đúng netAmount', found!.netAmount === amount - fee);
    await PaymentModel.deleteOne({ _id: doc._id });
  }

  console.log('\n═══ Quy tắc trạng thái ═══');
  check('shipped không hoàn kho', !canRestoreSubOrder('shipped'));
  check('cancelled không hoàn kho (idempotent)', !canRestoreSubOrder('cancelled'));

  await disconnectDB();
  console.log(
    failures === 0
      ? '\n✅ Tất cả kiểm tra tích hợp PASS\n'
      : `\n❌ Còn ${failures} kiểm tra FAIL\n`,
  );
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error('Lỗi:', e);
  process.exit(1);
});
