/**
 * Nghiệp vụ dashboard cho seller.
 *
 * Toàn bộ số liệu được tính từ dữ liệu thật trong DB, scope theo storeId.
 */
import { OrderModel } from '../models/Order';
import { ProductModel } from '../models/Product';
import { PaymentModel } from '../models/Payment';
import { ReviewModel } from '../models/Review';
import { UserModel } from '../models/User';
import { aggMatch } from '../http/store-scope';
import { SellerOrderStatus, TransactionStatus } from '../constants';

/** Khoảng thời gian của kỳ báo cáo. */
export type Period = 'today' | 'week' | 'month' | 'year';

export function periodStart(period: Period): Date {
  const now = new Date();
  const start = new Date(now);

  switch (period) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      break;
    case 'week': {
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - 6);
      break;
    }
    case 'month':
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      break;
    case 'year':
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      break;
  }
  return start;
}

/** Khoảng thời gian liền trước, cùng độ dài — dùng tính % thay đổi. */
export function previousPeriodStart(period: Period): Date {
  const current = periodStart(period);

  switch (period) {
    case 'today': {
      const prev = new Date(current);
      prev.setDate(prev.getDate() - 1);
      return prev;
    }
    case 'week': {
      const prev = new Date(current);
      prev.setDate(prev.getDate() - 7);
      return prev;
    }
    case 'month': {
      const prev = new Date(current);
      prev.setMonth(prev.getMonth() - 1);
      return prev;
    }
    case 'year': {
      const prev = new Date(current);
      prev.setFullYear(prev.getFullYear() - 1);
      return prev;
    }
  }
  return new Date();
}

/** Tính % thay đổi so với kỳ trước. */
function percentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return +(((current - previous) / previous) * 100).toFixed(1);
}

/**
 * Các sub-order thuộc store.
 *
 * Khi `storeId` là `undefined` (admin đang xem toàn bộ cửa hàng) -> lấy tất cả
 * sub-order của đơn.
 */
function subsOfStore(order: any, storeId?: string) {
  const subOrders = order?.subOrders ?? [];
  if (!storeId) return subOrders;
  return subOrders.filter((s: any) => String(s.storeId) === String(storeId));
}

/**
 * Số liệu dashboard cho seller.
 * Khớp shape `SellerDashboardStats` của frontend.
 *
 * `storeId` = `undefined` -> admin xem toàn bộ cửa hàng.
 */
export async function getSellerDashboardStats(storeId?: string) {
  const monthStart = periodStart('month');
  const prevMonthStart = previousPeriodStart('month');

  const storeOrdersFilter = storeId ? { 'subOrders.storeId': storeId } : {};
  const storeFilter = storeId ? { storeId } : {};

  const [
    monthOrders,
    prevMonthOrders,
    allOrders,
    products,
    outOfStock,
    lowStock,
    reviews,
    customers,
  ] = await Promise.all([
    OrderModel.find({
      ...storeOrdersFilter,
      createdAt: { $gte: monthStart },
    }).lean(),
    OrderModel.find({
      ...storeOrdersFilter,
      createdAt: { $gte: prevMonthStart, $lt: monthStart },
    }).lean(),
    OrderModel.find(storeOrdersFilter).lean(),
    ProductModel.countDocuments(storeFilter),
    ProductModel.countDocuments({ ...storeFilter, stock: 0 }),
    ProductModel.countDocuments({
      ...storeFilter,
      stock: { $gt: 0, $lte: 10 },
    }),
    ReviewModel.find(storeFilter).lean(),
    UserModel.countDocuments({ role: 'CUSTOMER' }),
  ]);

  const sumStore = (orders: any[], field: 'totalPrice' | 'subtotal') =>
    orders.reduce(
      (sum, order) =>
        sum +
        subsOfStore(order, storeId).reduce(
          (s: number, sub: any) => s + (sub[field] ?? 0),
          0,
        ),
      0,
    );

  const totalRevenue = sumStore(monthOrders, 'totalPrice');
  const prevRevenue = sumStore(prevMonthOrders, 'totalPrice');

  const countStoreOrders = (orders: any[]) =>
    orders.reduce((n, order) => n + subsOfStore(order, storeId).length, 0);

  const totalOrders = countStoreOrders(monthOrders);
  const prevOrders = countStoreOrders(prevMonthOrders);

  const completedOrders = allOrders.reduce(
    (n, order) =>
      n +
      subsOfStore(order, storeId).filter(
        (s: any) => s.status === SellerOrderStatus.DELIVERED,
      ).length,
    0,
  );

  const pendingOrders = allOrders.reduce(
    (n, order) =>
      n +
      subsOfStore(order, storeId).filter(
        (s: any) =>
          [
            SellerOrderStatus.PENDING,
            SellerOrderStatus.CONFIRMED,
            SellerOrderStatus.PREPARING,
          ].includes(s.status),
      ).length,
    0,
  );

  // Tỷ lệ chuyển đổi: lượt xem sản phẩm -> số đơn.
  // `$match` trong pipeline không tự ép chuỗi -> ObjectId.
  const viewSum = await ProductModel.aggregate([
    { $match: aggMatch(storeId) },
    { $group: { _id: null, views: { $sum: '$viewCount' } } },
  ]);
  const views = viewSum[0]?.views ?? 0;
  const conversionRate =
    views > 0 ? +((totalOrders / views) * 100).toFixed(1) : 0;

  const avgRating = reviews.length
    ? +(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  return {
    totalRevenue,
    revenueChange: percentChange(totalRevenue, prevRevenue),
    totalOrders,
    ordersChange: percentChange(totalOrders, prevOrders),
    pendingOrders,
    completedOrders,
    totalProducts: products,
    outOfStockProducts: outOfStock,
    lowStockProducts: lowStock,
    newCustomers: customers,
    conversionRate,
    avgRating,
  };
}

/**
 * Tổng hợp tài chính cho seller.
 * Khớp shape `SellerFinanceSummary` của frontend.
 */
export async function getSellerFinanceSummary(
  storeId?: string,
  period: Period = 'month',
) {
  const start = periodStart(period);
  const prevStart = previousPeriodStart(period);

  const payments = await PaymentModel.find({
    ...(storeId ? { storeId } : {}),
    createdAt: { $gte: prevStart },
  }).lean();

  const inPeriod = payments.filter(
    (p) => new Date(p.createdAt).getTime() >= start.getTime(),
  );
  const inPrev = payments.filter(
    (p) =>
      new Date(p.createdAt).getTime() >= prevStart.getTime() &&
      new Date(p.createdAt).getTime() < start.getTime(),
  );

  const successful = (list: any[]) =>
    list.filter((p) => p.status === TransactionStatus.SUCCESS);

  const totalRevenue = successful(inPeriod).reduce((s, p) => s + p.amount, 0);
  const prevRevenue = successful(inPrev).reduce((s, p) => s + p.amount, 0);
  const totalPlatformFee = successful(inPeriod).reduce(
    (s, p) => s + (p.platformFee ?? 0),
    0,
  );
  const totalRefund = inPeriod
    .filter((p) => p.status === TransactionStatus.REFUNDED)
    .reduce((s, p) => s + p.amount, 0);

  const netRevenue = totalRevenue - totalPlatformFee - totalRefund;
  const totalOrders = successful(inPeriod).length;

  return {
    totalRevenue,
    totalOrders,
    totalPlatformFee,
    totalRefund,
    netRevenue,
    avgOrderValue: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
    revenueChange: percentChange(totalRevenue, prevRevenue),
    period,
  };
}

/** Doanh thu theo ngày (30 ngày gần nhất) — shape `DailyRevenue`. */
export async function getDailyRevenue(storeId?: string, days = 30) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));

  const orders = await OrderModel.find({
    ...(storeId ? { 'subOrders.storeId': storeId } : {}),
    createdAt: { $gte: start },
  }).lean();

  const byDate = new Map<string, { revenue: number; orders: number }>();

  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    byDate.set(d.toISOString().slice(0, 10), { revenue: 0, orders: 0 });
  }

  for (const order of orders) {
    const key = new Date(order.createdAt).toISOString().slice(0, 10);
    const entry = byDate.get(key);
    if (!entry) continue;
    for (const sub of subsOfStore(order, storeId)) {
      if (
        [SellerOrderStatus.CANCELLED, SellerOrderStatus.RETURNED].includes(
          sub.status,
        )
      ) {
        continue;
      }
      entry.revenue += sub.totalPrice ?? 0;
      entry.orders += 1;
    }
  }

  return [...byDate.entries()].map(([date, v]) => ({
    date: date.slice(5).split('-').reverse().join('/'),
    revenue: v.revenue,
    orders: v.orders,
  }));
}

/** Doanh thu theo tháng — shape `MonthlyData`. */
export async function getMonthlyData(storeId?: string, months = 12) {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  start.setMonth(start.getMonth() - (months - 1));

  const orders = await OrderModel.find({
    ...(storeId ? { 'subOrders.storeId': storeId } : {}),
    createdAt: { $gte: start },
  }).lean();

  const customers = await UserModel.find({
    role: 'CUSTOMER',
    createdAt: { $gte: start },
  })
    .select('_id')
    .lean();

  const buckets = new Map<string, { revenue: number; orders: number }>();
  for (let i = 0; i < months; i++) {
    const d = new Date(start);
    d.setMonth(start.getMonth() + i);
    buckets.set(`${d.getFullYear()}-${d.getMonth()}`, {
      revenue: 0,
      orders: 0,
    });
  }

  for (const order of orders) {
    const d = new Date(order.createdAt);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const bucket = buckets.get(key);
    if (!bucket) continue;
    for (const sub of subsOfStore(order, storeId)) {
      if (
        [SellerOrderStatus.CANCELLED, SellerOrderStatus.RETURNED].includes(
          sub.status,
        )
      ) {
        continue;
      }
      bucket.revenue += sub.totalPrice ?? 0;
      bucket.orders += 1;
    }
  }

  // Ước lượng số khách hàng mới theo tháng.
  const perMonth = Math.floor(customers.length / months);

  return [...buckets.entries()].map(([key, v]) => {
    const [, month] = key.split('-').map(Number);
    return {
      month: `T${month + 1}`,
      revenue: v.revenue,
      orders: v.orders,
      customers: perMonth,
    };
  });
}
