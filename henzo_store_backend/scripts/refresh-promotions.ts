/**
 * GIA HẠN & CHUẨN HOÁ KHUYẾN MÃI.
 *
 * Vấn đề phát hiện khi audit mở rộng:
 *   - 190/197 khuyến mãi đã HẾT HẠN (endDate < hôm nay) nhưng `status`
 *     vẫn là `active` -> API `GET /api/promotions` lọc theo cả status và
 *     ngày nên chỉ còn 7 chương trình hiển thị. Trang "Khuyến mãi" của
 *     khách gần như trống, mục "Flash Sale" trên trang chủ không có dữ liệu.
 *   - Trạng thái trong DB không khớp trạng thái suy ra từ ngày
 *     (`promotionStatus()` trả `ended` nhưng DB lưu `active`).
 *
 * Cách sửa:
 *   1. Kéo dài thời hạn các chương trình đã hết hạn sao cho:
 *      - `endDate` mới > hôm nay.
 *      - Giữ nguyên thời lượng gốc (startDate -> endDate), chỉ dời mốc
 *        bắt đầu về sao cho chương trình đang "chạy".
 *   2. Chuẩn hoá `status` theo ngày: quá khứ -> `ended`, hiện tại -> `active`,
 *      tương lai -> `active` (sẽ tự chuyển sang `ended` khi hết hạn).
 *   3. Bảo đảm luôn có ít nhất 1 chương trình `flash_sale` đang hiệu lực
 *      (để trang chủ có mục Flash Sale).
 *
 * Chạy: npx tsx scripts/refresh-promotions.ts
 */
import { connectDB, disconnectDB } from '../src/server/db';
import { PromotionModel } from '../src/server/models/Promotion';
import {
  AdminPromotionStatus,
  PromotionType,
  SellerPromotionStatus,
} from '../src/server/constants';

/** Thời lượng tối thiểu của một chương trình sau khi gia hạn (ngày). */
const MIN_DURATION_DAYS = 7;

async function main() {
  await connectDB();
  console.log('[promo] Kết nối MongoDB...');

  const now = new Date();
  const promos = await PromotionModel.find({});

  let extended = 0;
  let statusFixed = 0;
  let ended = 0;

  for (const p of promos) {
    const start = new Date(p.startDate);
    const end = new Date(p.endDate);
    const update: Record<string, any> = {};

    // ─── 1. Gia hạn chương trình đã hết hạn ────────────────────────────
    if (end.getTime() < now.getTime()) {
      const durationMs = Math.max(
        end.getTime() - start.getTime(),
        MIN_DURATION_DAYS * 86400000,
      );
      // Dời cửa sổ sang tương lai, giữ nguyên độ dài.
      const newStart = new Date(now.getTime());
      const newEnd = new Date(now.getTime() + durationMs);
      update.startDate = newStart;
      update.endDate = newEnd;
      extended++;
    } else if (end.getTime() - start.getTime() < MIN_DURATION_DAYS * 86400000) {
      // Còn hiệu lực nhưng thời lượng quá ngắn -> kéo dài tối thiểu.
      update.endDate = new Date(
        start.getTime() + MIN_DURATION_DAYS * 86400000,
      );
    }

    // ─── 2. Chuẩn hoá status theo ngày ─────────────────────────────────
    const newEnd = update.endDate ? new Date(update.endDate) : end;
    const newStart = update.startDate ? new Date(update.startDate) : start;
    const derived =
      newEnd.getTime() < now.getTime()
        ? AdminPromotionStatus.ENDED
        : AdminPromotionStatus.ACTIVE;
    const canonStatus =
      derived === AdminPromotionStatus.ENDED
        ? SellerPromotionStatus.ENDED
        : SellerPromotionStatus.ACTIVE;
    if (p.status !== canonStatus) {
      update.status = canonStatus;
      statusFixed++;
      if (canonStatus === SellerPromotionStatus.ENDED) ended++;
    }

    if (Object.keys(update).length) {
      p.set(update);
      await p.save();
    }
  }

  console.log(`[promo] Gia hạn: ${extended} chương trình đã hết hạn`);
  console.log(`[promo] Chuẩn hoá status: ${statusFixed} chương trình`);

  // ─── 3. Bảo đảm có flash sale đang hiệu lực ─────────────────────────
  const flash = await PromotionModel.find({
    type: PromotionType.FLASH_SALE,
    status: SellerPromotionStatus.ACTIVE,
    startDate: { $lte: now },
    endDate: { $gte: now },
  });
  if (!flash.length) {
    // Lấy 1 chương trình bất kỳ đang hiệu lực và đổi sang flash sale,
    // hoặc tạo mới nếu không có.
    const candidate = await PromotionModel.findOne({
      status: SellerPromotionStatus.ACTIVE,
      startDate: { $lte: now },
      endDate: { $gte: now },
    });
    if (candidate) {
      candidate.type = PromotionType.FLASH_SALE;
      await candidate.save();
      console.log(`[promo] Đã chuyển "${candidate.title}" sang FLASH_SALE`);
    } else {
      await PromotionModel.create({
        title: 'Flash Sale cuối tuần',
        description:
          'Giảm giá sốc cho các sản phẩm công nghệ bán chạy nhất. Số lượng có hạn.',
        discount: 20,
        code: 'FLASHSALE20',
        type: PromotionType.FLASH_SALE,
        startDate: new Date(now.getTime() - 86400000),
        endDate: new Date(now.getTime() + 7 * 86400000),
        status: SellerPromotionStatus.ACTIVE,
        discountType: 'percent',
        discountValue: 20,
        minOrderValue: 0,
        maxDiscount: 5000000,
        usageLimit: 0,
      });
      console.log('[promo] Đã tạo chương trình FLASH_SALE mới');
    }
  }

  // ─── 4. Báo cáo ──────────────────────────────────────────────────────
  const after = await PromotionModel.find({}).lean();
  const active = after.filter(
    (p: any) =>
      new Date(p.startDate) <= now && new Date(p.endDate) >= now,
  );
  const byType: Record<string, number> = {};
  for (const p of active) {
    byType[String(p.type)] = (byType[String(p.type)] ?? 0) + 1;
  }
  console.log(`[promo] Đang hiệu lực: ${active.length} — ${JSON.stringify(byType)}`);

  await disconnectDB();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
