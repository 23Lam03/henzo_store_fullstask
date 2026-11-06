import { connectDB } from '../../src/server/db';
import { AddressModel } from '../../src/server/models/Address';

async function main() {
  await connectDB();
  const del = await AddressModel.deleteMany({
    label: 'Nhà',
    ward: 'Phường Bến Thành',
    address: '123 Lê Lợi',
  });
  console.log('đã xoá địa chỉ test:', del.deletedCount);
  const left = await AddressModel.countDocuments({});
  console.log('tổng địa chỉ còn lại:', left);
  process.exit(0);
}
main();
