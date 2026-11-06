import { connectDB, disconnectDB } from '../../src/server/db';
import { ProductModel } from '../../src/server/models/Product';
import { CategoryModel } from '../../src/server/models/Category';
import { BrandModel } from '../../src/server/models/Brand';
import { StoreModel } from '../../src/server/models/Store';
import { UserModel } from '../../src/server/models/User';
import { InventoryModel } from '../../src/server/models/Inventory';
import { PromotionModel } from '../../src/server/models/Promotion';
import { PaymentModel } from '../../src/server/models/Payment';
import { CartModel } from '../../src/server/models/Cart';
import { ReviewModel } from '../../src/server/models/Review';
import { WishlistModel } from '../../src/server/models/Wishlist';
import { NotificationModel } from '../../src/server/models/Notification';
import { OrderModel } from '../../src/server/models/Order';
import { BlogModel } from '../../src/server/models/Blog';

(async () => {
  await connectDB();
  const counts: Record<string, number | string> = {};
  const pairs: [string, any, any][] = [
    ['products', ProductModel, {}],
    ['categories', CategoryModel, {}],
    ['brands', BrandModel, {}],
    ['stores', StoreModel, {}],
    ['users', UserModel, {}],
    ['inventory', InventoryModel, {}],
    ['promotions', PromotionModel, {}],
    ['payments', PaymentModel, {}],
    ['carts', CartModel, {}],
    ['reviews', ReviewModel, {}],
    ['wishlist', WishlistModel, {}],
    ['notifications', NotificationModel, {}],
    ['orders', OrderModel, {}],
    ['blogs', BlogModel, {}],
  ];
  for (const [name, model, filter] of pairs) {
    try {
      counts[name] = await (model as any).countDocuments(filter);
    } catch (e: any) {
      counts[name] = `ERR ${e.message.slice(0, 60)}`;
    }
  }
  console.log('=== SỐ LƯỢNG BẢN GHI ===');
  for (const [k, v] of Object.entries(counts)) console.log(`  ${k.padEnd(16)} ${v}`);

  // Inventory vs products
  const [products, inv] = await Promise.all([
    ProductModel.find({}).lean(),
    InventoryModel.find({}).lean(),
  ]);
  const invByProduct = new Map<string, number>();
  for (const i of inv) {
    const k = String(i.productId);
    invByProduct.set(k, (invByProduct.get(k) ?? 0) + 1);
  }
  const noInv = products.filter((p) => !invByProduct.has(String(p._id)));
  console.log(`\n=== INVENTORY ===`);
  console.log(`  bản ghi inventory: ${inv.length}`);
  console.log(`  sản phẩm KHÔNG có inventory: ${noInv.length}`);
  console.log(`  sản phẩm có >1 inventory row: ${products.filter((p) => (invByProduct.get(String(p._id)) ?? 0) > 1).length}`);

  // promotions validity
  const promos = await PromotionModel.find({}).lean();
  const now = new Date();
  const expired = promos.filter((p: any) => p.endDate && new Date(p.endDate) < now);
  const notStarted = promos.filter((p: any) => p.startDate && new Date(p.startDate) > now);
  console.log(`\n=== PROMOTIONS ===`);
  console.log(`  tổng ${promos.length} | đã hết hạn ${expired.length} | chưa bắt đầu ${notStarted.length}`);

  // payments vs orders
  const orders = await OrderModel.find({}).lean();
  const payByOrder = new Map<string, number>();
  for (const p of await PaymentModel.find({}).lean()) {
    const k = String(p.orderId);
    payByOrder.set(k, (payByOrder.get(k) ?? 0) + 1);
  }
  console.log(`\n=== PAYMENTS ===`);
  console.log(`  orders ${orders.length} | orders có payment ${payByOrder.size} | orders CHƯA có payment ${orders.length - payByOrder.size}`);

  await disconnectDB();
})();
