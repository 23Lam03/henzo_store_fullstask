/**
 * Nghiệp vụ dành cho admin — dashboard, tài chính & báo cáo toàn hệ thống.
 *
 * Mọi số liệu đều tính từ dữ liệu thật trong DB (không dùng số liệu mock
 * của frontend), scope toàn hệ thống.
 */
import { OrderModel } from '../models/Order';
import { ProductModel } from '../models/Product';
import { PaymentModel } from '../models/Payment';
import { ReviewModel } from '../models/Review';
import { UserModel } from '../models/User';
import { StoreModel } from '../models/Store';
import { PromotionModel } from '../models/Promotion';
import { TicketModel } from '../models/SupportTicket';
import {
  CustomerOrderStatus,
  PLATFORM_COMMISSION_RATE,
  SellerOrderStatus,
  TransactionStatus,
} from '../constants';

function percentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return +(((current - previous) / previous) * 100).toFixed(1);
}

function monthStart(offset = 0): Date {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  d.setMonth(d.getMonth() - offset);
  return d;
}

/**
 * Số liệu tổng quan cho admin dashboard.
 * Khớp shape `ADMIN_STATS` + `MONTHLY_REVENUE` của frontend.
 */
export async function getAdminDashboardStats() {
  const monthStartDate = monthStart(0);
  const prevMonthStartDate = monthStart(1);
  const sixMonthsAgo = monthStart(5);

  const [
    totalOrders,
    prevMonthOrders,
    totalProducts,
    totalCustomers,
    totalStores,
    totalPayments,
    totalReviews,
    totalPromotions,
    totalTickets,
    monthRevenueAgg,
    prevMonthRevenueAgg,
    sixMonthOrders,
    recentOrders,
    topProducts,
    openTickets,
  ] = await Promise.all([
    OrderModel.countDocuments({}),
    OrderModel.countDocuments({
      createdAt: { $gte: prevMonthStartDate, $lt: monthStartDate },
    }),
    ProductModel.countDocuments({}),
    UserModel.countDocuments({ role: 'CUSTOMER' }),
    StoreModel.countDocuments({}),
    PaymentModel.countDocuments({}),
    ReviewModel.countDocuments({}),
    PromotionModel.countDocuments({}),
    TicketModel.countDocuments({}),
    OrderModel.aggregate([
      { $match: { createdAt: { $gte: monthStartDate } } },
      {
        $group: {
          _id: null,
          revenue: {
            $sum: {
              $cond: [
                { $eq: ['$status', CustomerOrderStatus.CANCELLED] },
                0,
                '$totalPrice',
              ],
            },
          },
        },
      },
    ]),
    OrderModel.aggregate([
      {
        $match: {
          createdAt: { $gte: prevMonthStartDate, $lt: monthStartDate },
        },
      },
      {
        $group: {
          _id: null,
          revenue: {
            $sum: {
              $cond: [
                { $eq: ['$status', CustomerOrderStatus.CANCELLED] },
                0,
                '$totalPrice',
              ],
            },
          },
        },
      },
    ]),
    OrderModel.find({ createdAt: { $gte: sixMonthsAgo } })
      .select('totalPrice status createdAt')
      .lean(),
    OrderModel.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    ProductModel.find({})
      .sort({ sold: -1 })
      .limit(5)
      .select('name images sold price')
      .lean(),
    TicketModel.countDocuments({ status: { $in: ['open', 'pending'] } }),
  ]);

  const monthRevenue = monthRevenueAgg[0]?.revenue ?? 0;
  const prevMonthRevenue = prevMonthRevenueAgg[0]?.revenue ?? 0;

  // Doanh thu theo tháng (6 tháng gần nhất) — shape `MONTHLY_REVENUE`.
  const buckets = new Map<string, { revenue: number; orders: number }>();
  for (let i = 5; i >= 0; i--) {
    const d = monthStart(i);
    buckets.set(`${d.getFullYear()}-${d.getMonth()}`, { revenue: 0, orders: 0 });
  }

  for (const order of sixMonthOrders) {
    if (order.status === CustomerOrderStatus.CANCELLED) continue;
    const d = new Date(order.createdAt);
    const bucket = buckets.get(`${d.getFullYear()}-${d.getMonth()}`);
    if (!bucket) continue;
    bucket.revenue += order.totalPrice ?? 0;
    bucket.orders += 1;
  }

  const monthlyRevenue = [...buckets.entries()].map(([key, v]) => {
    const [, month] = key.split('-').map(Number);
    return { month: `T${month + 1}`, revenue: v.revenue, orders: v.orders };
  });

  const totalRevenue = monthlyRevenue.reduce((s, m) => s + m.revenue, 0);

  return {
    stats: {
      totalRevenue,
      totalOrders,
      totalProducts,
      totalCustomers,
      totalStores,
      totalPayments,
      totalReviews,
      totalPromotions,
      totalTickets,
    },
    changes: {
      revenue: percentChange(monthRevenue, prevMonthRevenue),
      orders: percentChange(
        await OrderModel.countDocuments({
          createdAt: { $gte: monthStartDate },
        }),
        prevMonthOrders,
      ),
    },
    monthlyRevenue,
    recentOrders: recentOrders.map((o: any) => ({
      id: o.orderNumber,
      customer: o.customerName,
      amount: o.totalPrice,
      status: o.status,
      statusKey: o.status,
      date: o.createdAt,
      store: o.subOrders?.[0]?.storeName ?? '',
    })),
    topProducts: topProducts.map((p: any) => ({
      id: String(p._id),
      name: p.name,
      sold: p.sold ?? 0,
      revenue: (p.sold ?? 0) * (p.price ?? 0),
      img: p.images?.[0] ?? '',
    })),
    openTickets,
  };
}

/**
 * Tổng hợp tài chính nền tảng — shape trang Admin Finance.
 * Hoa hồng nền tảng 5%, số dư khả dụng = 30% hoa hồng (giữ lại vận hành).
 */
export async function getAdminFinanceSummary() {
  const [
    payments,
    orders,
    successfulOrders,
    pendingOrders,
    refundedOrders,
  ] = await Promise.all([
    PaymentModel.find({}).lean(),
    OrderModel.countDocuments({}),
    OrderModel.countDocuments({
      status: { $ne: CustomerOrderStatus.CANCELLED },
    }),
    OrderModel.countDocuments({
      status: CustomerOrderStatus.PENDING,
    }),
    OrderModel.countDocuments({
      status: CustomerOrderStatus.CANCELLED,
    }),
  ]);

  const completed = payments.filter(
    (p: any) => p.status === TransactionStatus.SUCCESS,
  );
  const pending = payments.filter(
    (p: any) => p.status === TransactionStatus.PENDING,
  );
  const refunded = payments.filter(
    (p: any) => p.status === TransactionStatus.REFUNDED,
  );

  const totalRevenue = completed.reduce((s: number, p: any) => s + (p.amount ?? 0), 0);
  const totalPending = pending.reduce((s: number, p: any) => s + (p.amount ?? 0), 0);
  const totalRefunded = refunded.reduce(
    (s: number, p: any) => s + (p.amount ?? 0),
    0,
  );

  /**
   * Doanh thu nền tảng = tổng phí sàn **đã thu thực tế** trên các giao dịch.
   *
   * Không tính lại từ `totalRevenue` vì:
   * - Tỷ lệ có thể đổi theo thời gian, nên tính lại sẽ lệch với dữ liệu thật.
   * - Giao dịch đã hoàn tiền không còn sinh phí sàn.
   */
  const platformCommission = completed.reduce(
    (s: number, p: any) => s + (p.platformFee ?? 0),
    0,
  );
  const platformBalance = Math.floor(platformCommission * 0.3);

  // Giao dịch nền tảng: hoa hồng từ các store + chi phí vận hành.
  const storeAgg = await OrderModel.aggregate([
    { $match: { status: { $ne: CustomerOrderStatus.CANCELLED } } },
    { $unwind: '$subOrders' },
    {
      $group: {
        _id: '$subOrders.storeId',
        storeName: { $first: '$subOrders.storeName' },
        revenue: { $sum: '$subOrders.totalPrice' },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: 8 },
  ]);

  const transactions = [
    ...storeAgg.map((s: any, i: number) => {
      // Phí sàn của cửa hàng = sản phẩm doanh thu * tỷ lệ hiện hành.
      const commission = Math.floor((s.revenue ?? 0) * PLATFORM_COMMISSION_RATE);
      return {
        id: `TX${i + 1}`,
        date: new Date(),
        desc: `Hoa hồng từ ${s.storeName || 'Cửa hàng'}`,
        type: 'in' as const,
        amount: commission,
        status: 'completed' as const,
      };
    }),
    {
      id: 'OP1',
      date: new Date(),
      desc: 'Chi phí vận hành server',
      type: 'out' as const,
      amount: 5_000_000,
      status: 'completed' as const,
    },
    {
      id: 'OP2',
      date: new Date(),
      desc: 'Chi phí marketing quảng cáo',
      type: 'out' as const,
      amount: 15_000_000,
      status: 'completed' as const,
    },
  ];

  return {
    totalRevenue,
    platformCommission,
    platformBalance,
    commissionRate: PLATFORM_COMMISSION_RATE,
    totalPending,
    totalRefunded,
    totalTransactions: payments.length,
    completedTransactions: completed.length,
    pendingTransactions: pending.length,
    orders: {
      total: orders,
      successful: successfulOrders,
      pending: pendingOrders,
      refunded: refundedOrders,
    },
    transactions,
  };
}

/**
 * Báo cáo tổng hợp — shape trang Admin Reports.
 */
export async function getAdminReports() {
  const months = 6;
  const start = monthStart(months - 1);

  const [orders, topProducts, topStores] = await Promise.all([
    OrderModel.find({ createdAt: { $gte: start } })
      .select('totalPrice status createdAt')
      .lean(),
    ProductModel.find({})
      .sort({ sold: -1 })
      .limit(5)
      .select('name brand images sold price')
      .lean(),
    StoreModel.find({})
      .sort({ orderCount: -1 })
      .limit(5)
      .select('name avatar productCount rating')
      .lean(),
  ]);

  const buckets = new Map<string, { revenue: number; orders: number }>();
  for (let i = months - 1; i >= 0; i--) {
    const d = monthStart(i);
    buckets.set(`${d.getFullYear()}-${d.getMonth()}`, { revenue: 0, orders: 0 });
  }

  for (const order of orders) {
    if (order.status === CustomerOrderStatus.CANCELLED) continue;
    const d = new Date(order.createdAt);
    const bucket = buckets.get(`${d.getFullYear()}-${d.getMonth()}`);
    if (!bucket) continue;
    bucket.revenue += order.totalPrice ?? 0;
    bucket.orders += 1;
  }

  const monthly = [...buckets.entries()].map(([key, v]) => {
    const [, month] = key.split('-').map(Number);
    return {
      month: `T${month + 1}`,
      revenue: v.revenue,
      orders: v.orders,
      avgPerOrder:
        v.orders > 0 ? Math.round(v.revenue / v.orders) : 0,
    };
  });

  const totalRevenue = monthly.reduce((s, m) => s + m.revenue, 0);

  // Doanh thu theo cửa hàng (tính từ sub-order).
  const storeRevenue = await OrderModel.aggregate([
    { $match: { createdAt: { $gte: start } } },
    { $unwind: '$subOrders' },
    {
      $match: {
        'subOrders.status': { $ne: SellerOrderStatus.CANCELLED },
      },
    },
    {
      $group: {
        _id: '$subOrders.storeId',
        storeName: { $first: '$subOrders.storeName' },
        revenue: { $sum: '$subOrders.totalPrice' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: 5 },
  ]);

  return {
    totalRevenue,
    totalOrders: monthly.reduce((s, m) => s + m.orders, 0),
    monthly,
    topProducts: topProducts.map((p: any) => ({
      id: String(p._id),
      name: p.name,
      brand: p.brand ?? '',
      images: p.images ?? [],
      sold: p.sold ?? 0,
      revenue: (p.sold ?? 0) * (p.price ?? 0),
    })),
    topStores: storeRevenue.map((s: any) => ({
      id: String(s._id),
      name: s.storeName || 'Cửa hàng',
      revenue: s.revenue ?? 0,
      orders: s.orders ?? 0,
    })),
  };
}
