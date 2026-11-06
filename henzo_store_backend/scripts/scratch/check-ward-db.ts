import { connectDB } from '../../src/server/db';
import { OrderModel } from '../../src/server/models/Order';

async function main() {
  await connectDB();
  const o = await OrderModel.findOne({}).sort({ createdAt: -1 }).lean();
  console.log('order:', o?.orderNumber);
  console.log('shippingWard (raw db):', JSON.stringify(o?.shippingWard));
  console.log('shippingDistrict (raw db):', JSON.stringify(o?.shippingDistrict));
  process.exit(0);
}
main();
