import { connectDB, disconnectDB } from '../../src/server/db';
import { PromotionModel, VoucherModel } from '../../src/server/models/Promotion';

await connectDB();
const now = new Date();
console.log('tổng Promotion:', await PromotionModel.countDocuments());
console.log('tổng Voucher:', await VoucherModel.countDocuments());
console.log(
  'Promotion active + trong hạn:',
  await PromotionModel.countDocuments({
    status: 'active',
    startDate: { $lte: now },
    endDate: { $gte: now },
  }),
);
console.log(
  'Voucher active + trong hạn:',
  await VoucherModel.countDocuments({
    status: 'active',
    startDate: { $lte: now },
    endDate: { $gte: now },
  }),
);
console.log(
  'Promotion active nhưng ĐÃ HẾT HẠN:',
  await PromotionModel.countDocuments({ status: 'active', endDate: { $lt: now } }),
);
console.log(
  'Promotion active nhưng CHƯA BẮT ĐẦU:',
  await PromotionModel.countDocuments({ status: 'active', startDate: { $gt: now } }),
);
console.log(
  'Promotion status khác active:',
  await PromotionModel.countDocuments({ status: { $ne: 'active' } }),
);
await disconnectDB();
