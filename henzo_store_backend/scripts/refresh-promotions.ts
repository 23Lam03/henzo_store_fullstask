import { connectDB, disconnectDB } from '../src/server/db';
import { PromotionModel } from '../src/server/models/Promotion';
import {
  AdminPromotionStatus,
  PromotionType,
  SellerPromotionStatus,
} from '../src/server/constants';

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

    if (end.getTime() < now.getTime()) {
      const durationMs = Math.max(
        end.getTime() - start.getTime(),
        MIN_DURATION_DAYS * 86400000,
      );

      const newStart = new Date(now.getTime());
      const newEnd = new Date(now.getTime() + durationMs);
      update.startDate = newStart;
      update.endDate = newEnd;
      extended++;
    } else if (end.getTime() - start.getTime() < MIN_DURATION_DAYS * 86400000) {

      update.endDate = new Date(
        start.getTime() + MIN_DURATION_DAYS * 86400000,
      );
    }

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

  const flash = await PromotionModel.find({
    type: PromotionType.FLASH_SALE,
    status: SellerPromotionStatus.ACTIVE,
    startDate: { $lte: now },
    endDate: { $gte: now },
  });
  if (!flash.length) {

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
