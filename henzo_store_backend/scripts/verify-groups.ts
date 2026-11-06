/**
 * Kiểm chứng logic phân bổ tiền (nhóm 1 + nhóm 3).
 *
 * Chạy: npx tsx scripts/verify-groups.ts
 */
import {
  distributeEvenly,
  distributeByWeight,
} from '../src/server/services/order.service';
import { canRestoreSubOrder } from '../src/server/services/inventory.service';

let failures = 0;

function check(name: string, cond: boolean, detail?: unknown) {
  if (cond) {
    console.log(`  ✓ ${name}`);
  } else {
    failures++;
    console.log(`  ✗ ${name}`, detail !== undefined ? detail : '');
  }
}

console.log('\n── distributeEvenly ──');
{
  const r = distributeEvenly(30000, 7);
  const sum = r.reduce((a, b) => a + b, 0);
  check('tổng luôn bằng số tiền gốc', sum === 30000, { sum, r });
  check('chia đều chênh lệch <= 1', Math.max(...r) - Math.min(...r) <= 1, r);
  check('trả về đúng số phần', r.length === 7, r.length);

  check('parts = 0 -> mảng rỗng', distributeEvenly(100, 0).length === 0);
  check('1 phần -> nhận toàn bộ', distributeEvenly(999, 1)[0] === 999);
  check('chia hết được', distributeEvenly(1000, 3).reduce((a, b) => a + b, 0) === 1000);
}

console.log('\n── distributeByWeight ──');
{
  const r = distributeByWeight(100000, [500000, 300000, 200000]);
  const sum = r.reduce((a, b) => a + b, 0);
  check('tổng luôn bằng số tiền gốc', sum === 100000, { sum, r });
  check('tỷ lệ đúng (50/30/20)', r[0] === 50000 && r[1] === 30000 && r[2] === 20000, r);

  const r2 = distributeByWeight(100, [1, 1, 1]);
  check('chia đều khi trọng số bằng nhau', r2.reduce((a, b) => a + b, 0) === 100, r2);
  check(
    'trọng số 0 không nhận tiền',
    distributeByWeight(100, [100, 0])[1] === 0,
    distributeByWeight(100, [100, 0]),
  );
  check('tổng trọng số 0 -> chia đều', distributeByWeight(90, [0, 0, 0]).reduce((a, b) => a + b, 0) === 90);
}

console.log('\n── canRestoreSubOrder (quy tắc hoàn tồn kho) ──');
{
  check('pending -> hoàn được', canRestoreSubOrder('pending'));
  check('confirmed -> hoàn được', canRestoreSubOrder('confirmed'));
  check('preparing -> hoàn được', canRestoreSubOrder('preparing'));
  check('shipped -> KHÔNG hoàn', !canRestoreSubOrder('shipped'));
  check('delivering -> KHÔNG hoàn', !canRestoreSubOrder('delivering'));
  check('delivered -> KHÔNG hoàn', !canRestoreSubOrder('delivered'));
  // Idempotent: đã hủy rồi thì hủy lần 2 không được hoàn thêm.
  check('cancelled -> KHÔNG hoàn (idempotent)', !canRestoreSubOrder('cancelled'));
  check('returned -> KHÔNG hoàn', !canRestoreSubOrder('returned'));
}

console.log(
  failures === 0
    ? '\n✅ Tất cả kiểm tra đều PASS\n'
    : `\n❌ Còn ${failures} kiểm tra FAIL\n`,
);
process.exit(failures === 0 ? 0 : 1);
