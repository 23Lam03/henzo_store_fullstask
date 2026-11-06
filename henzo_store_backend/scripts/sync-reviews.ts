import { connectDB, disconnectDB } from '../src/server/db';
import { ProductModel } from '../src/server/models/Product';
import { ReviewModel } from '../src/server/models/Review';
import { OrderModel } from '../src/server/models/Order';
import { UserModel } from '../src/server/models/User';
import { UserRole } from '../src/server/constants';

const MAX_REVIEWS_PER_PRODUCT = 8;
const MIN_REVIEWS_PER_PRODUCT = 1;

const COMMENTS: Record<string, string[]> = {
  'Điện thoại': [
    'Máy chạy mượt, pin dùng cả ngày thoải mái. Camera chụp đẹp trong điều kiện ánh sáng bình thường.',
    'Màn hình hiển thị trong, màu chuẩn. Dùng chuyển ứng dụng không bị giật.',
    'Giao hàng nhanh, máy nguyên seal, phụ kiện đầy đủ. Rất hài lòng với sản phẩm.',
    'Pin onscreen tốt hơn mình kỳ vọng. Sử dụng 2 ngày vẫn còn 30% trước khi sạc.',
    'Thiết kế sang, cầm tay thoải mái. Mình chọn dung lượng cao nên dùng thoải mái hơn.',
    'Camera chính chất lượng cao, chụp đêm có nhiễu nhẹ nhưng vẫn dùng được.',
    'Cảm ứng mượt, đọc hiển thị tốt. Loa nghe to và rõ.',
    'Đã dùng được 2 tháng, không gặp vấn đề gì. Sẽ giới thiệu cho bạn bè.',
  ],
  Tablet: [
    'Màn hình lớn, xem phim rất nhan. Dùng để ghi chú trong học tập rất tiện.',
    'Hiệu năng mạnh, mở nhiều app cùng lúc vẫn mượt. Bút vẽ cảm ứng rất nhạy.',
    'Pin tốt dùng cả ngày học. Trọng lượng nhẹ nên cầm lâu không mỏi.',
    'Vừa đủ cho công việc văn phòng và giải trí. Màn hình sắc nét.',
    'Sản phẩm đẹp, cảm giác cầm tay cao cấp. Bảo hành chính hãng nhan chóng.',
  ],
  Laptop: [
    'Máy chạy mượt, xử lý công việc nặng không bị nghẽn. Màn hình sắc nét, màu chuẩn.',
    'Pin dùng được cả buổi làm việc. Bàn phím gõ êm, trackpad nhạy.',
    'Cấu hình mạnh, build project nhanh. Nhiệt độ và quạt tản ổn.',
    'Thiết kế gọn nhẹ, mang đi học làm việc rất tiện. Pin ổn trong điều kiện văn phòng.',
    'Mở máy rất nhanh, mở 20 tab Chrome không lag. Màn hình hình ảnh đẹp.',
    'Bàn phím, trackpad đều rất tốt. Đóng gói cẩn thận, giao hàng nhanh.',
    'Hiệu năng vượt kỳ vọng so với giá. Nhiệt tản tốt, không quá nóng.',
    'Dùng cho công việc thiết kế, màu hiển thị chuẩn. Cảm giác cầm tay tốt.',
  ],
  'Màn hình': [
    'Màn hình hiển thị sắc nét, màu chuẩn. Đóng gói kỹ, không vỡ khi giao.',
    'Dùng thiết kế và code rất mượt, phản hồi chuột không bị trễ.',
    'Tần số quét cao, chơi game không bị rách hình. Điều chỉnh độ sáng dễ dùng.',
    'Kết nối chắc chắn, không bị rớt. Viền mỏng, dễ ghép nhiều màn hình.',
    'Màu sắc đẹp, độ sáng vừa đủ dùng ban đêm. Đáng tiền.',
  ],
  'PC Gaming': [
    'Chơi game ở setting cao vẫn ổn định fps. Tản nhiệt tốt, không quá nóng.',
    'Cấu hình mạnh, đồ hoạ mượt. Dây nguồn và case chắc chắn, build chắc tay.',
    'Lắp ráp nhanh, chạy Windows 11 mượt mà. Bộ nhớ đủ dùng lâu dài.',
    'Hiệu năng vượt kỳ vọng trong tầm giá. Quạt tản êm, không ồn.',
  ],
  Chuột: [
    'Chuột nhẹ, cảm giác cầm rất tốt. Nút click gọn và chính xác.',
    'Độ trễ thấp, dùng chơi game rất ổn. Sensor nhạy, không bị trôi khi nhanh tay.',
    'Pin dùng lâu, sạc nhanh. Kết nối không bị rớt giữa lúc làm việc.',
    'Shape thoải mái, phù hợp cầm tay lớn. Kéo dây hoặc wireless đều ổn.',
  ],
  'Bàn phím': [
    'Gõ phím êm, gõ lâu không mỏi. Switch nghe gọn, đèn backlight đủ sáng.',
    'Layout gọn gàng, kết nối ổn định. Phím bấm chắc chắn, phản hồi nhanh.',
    'Đẹp, build chắc chắn. Phím switch dễ thay, hỗ trợ kết nối 3 thiết bị.',
    'Phím êm tay, keycap cảm giác tốt. Dùng để làm việc văn phòng rất ổn.',
  ],
  'Tai nghe': [
    'Chống ồn tốt, nghe nhạc rất hay. Pin dùng được nhiều ngày.',
    'Âm thanh cân bằng, micro thu giọng rõ trong họp hành.',
    'Đeo êm tai cả ngày dài, không bị đau. Kết nối Bluetooth ổn định.',
    'Chất âm trầm, nghe nhạc sống động. Đường micro tách tiếng tạp âm tốt.',
    'Gọi điện thoại rõ ràng, đối phương không nghe tiếng ồn. Pin tốt.',
  ],
  'Phụ kiện': [
    'Đúng như mô tả, giao hàng nhanh. Chất liệu tốt, hoàn thiện chắc chắn.',
    'Hoạt động ổn định, kết nối nhanh. Giá hợp lý cho chất lượng này.',
    'Sản phẩm chính hãng, đóng gói cẩn thận. Sẽ mua lại nếu cần.',
    'Dùng tốt, thiết kế gọn gàng. Giá hợp lý, giao nhanh.',
  ],
};

const SELLER_REPLIES = [
  'Cảm ơn quý khách đã đánh giá! Chúng tôi rất vui khi sản phẩm đáp ứng được nhu cầu. Rất mong được đón tiếp quý khách trở lại ạ.',
  'Cảm ơn phản hồi của quý khách. Đội ngũ Henzo Store sẽ cố gắng phục vụ tốt hơn nữa. Chúc quý khách sử dụng sản phẩm hài lòng ạ.',
  'Cảm ơn quý khách đã ủng hộ! Chúng tôi ghi nhận góp ý và sẽ cải thiện chất lượng phục vụ trong thời gian tới.',
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

async function main() {
  await connectDB();
  console.log('[reviews] Kết nối MongoDB...');

  const products = await ProductModel.find({}).lean();
  const customers = await UserModel.find({
    role: UserRole.CUSTOMER,
    status: 'active',
  })
    .select('_id name avatar')
    .lean();
  const orders = await OrderModel.find({}).lean();

  console.log(
    `[reviews] ${products.length} sản phẩm | ${customers.length} khách hàng | ${orders.length} đơn hàng`,
  );
  if (!customers.length) {
    console.error('[reviews] Không có khách hàng nào để gắn đánh giá.');
    await disconnectDB();
    return;
  }

  const ordersByProduct = new Map<string, any[]>();
  for (const o of orders) {
    for (const it of (o.items ?? [])) {
      const pid = String(it.productId);
      if (!ordersByProduct.has(pid)) ordersByProduct.set(pid, []);
      ordersByProduct.get(pid)!.push(o);
    }
  }

  const deleted = await ReviewModel.deleteMany({});
  console.log(`[reviews] Xoá ${deleted.deletedCount} đánh giá cũ`);

  const reviewDocs: any[] = [];

  for (const p of products) {
    const sold = Number(p.sold ?? 0);
    const seed = hash(String(p._id));

    const ratio = 0.04 + ((seed % 7) / 100);
    let count = Math.round(sold * ratio);
    count = Math.max(MIN_REVIEWS_PER_PRODUCT, Math.min(MAX_REVIEWS_PER_PRODUCT, count));

    const cat = String(p.categoryName ?? 'Phụ kiện');
    const pool = COMMENTS[cat] ?? COMMENTS['Phụ kiện'];
    const productOrders = ordersByProduct.get(String(p._id)) ?? [];

    for (let i = 0; i < count; i++) {
      const s = seed + i * 37;
      const customer = customers[s % customers.length];

      const realOrder = productOrders.length
        ? productOrders[(s >> 3) % productOrders.length]
        : null;

      const rating = realOrder
        ? 4 + (s % 2)
        : 3 + (s % 3);

      const comment = pool[s % pool.length];
      const hasReply = s % 3 === 0;
      const createdAt = new Date(
        Date.now() - ((s % 90) + 1) * 86400000,
      );

      reviewDocs.push({
        productId: p._id,
        productName: p.name,
        productImage: (p.images ?? [])[0] ?? '',
        storeId: p.storeId,
        userId: customer._id,
        userName: customer.name,
        userAvatar: customer.avatar ?? '',
        orderId: realOrder?._id,
        rating,
        comment,
        images: [],
        isVerified: Boolean(realOrder),
        isHidden: false,
        hasResponse: hasReply,
        sellerResponse: hasReply ? SELLER_REPLIES[s % SELLER_REPLIES.length] : '',
        sellerRespondedAt: hasReply ? createdAt : undefined,
        replies: [],
        createdAt,
        updatedAt: createdAt,
      });
    }
  }

  if (reviewDocs.length) {
    await ReviewModel.insertMany(reviewDocs, { ordered: false });
  }
  console.log(`[reviews] Đã tạo ${reviewDocs.length} đánh giá`);

  const agg = await ReviewModel.aggregate([
    { $match: { isHidden: false } },
    {
      $group: {
        _id: '$productId',
        count: { $sum: 1 },
        avg: { $avg: '$rating' },
      },
    },
  ]);
  const stats = new Map(
    agg.map((a: any) => [
      String(a._id),
      { count: a.count, avg: Math.round(a.avg * 10) / 10 },
    ]),
  );

  let fixed = 0;
  for (const p of products) {
    const s = stats.get(String(p._id));
    const count = s?.count ?? 0;
    const rating = s?.avg ?? 0;
    if (Number(p.reviewCount ?? 0) !== count || Number(p.rating ?? 0) !== rating) {
      await ProductModel.updateOne(
        { _id: p._id },
        { $set: { reviewCount: count, rating } },
      );
      fixed++;
    }
  }
  console.log(`[reviews] Đồng bộ reviewCount/rating cho ${fixed} sản phẩm`);

  const totalReviews = await ReviewModel.countDocuments({});
  const totalShown = products.reduce((s, p) => s + Number(p.reviewCount ?? 0), 0);
  const verified = await ReviewModel.countDocuments({ isVerified: true });
  console.log(
    `[reviews] Tổng đánh giá trong DB: ${totalReviews} | ` +
      `tổng hiển thị trên UI: ${totalShown} | đánh giá "đã mua hàng": ${verified}`,
  );

  await disconnectDB();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
