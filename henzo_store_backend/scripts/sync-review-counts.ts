import { connectDB, disconnectDB } from '../src/server/db';
import { ProductModel } from '../src/server/models/Product';
import { ReviewModel } from '../src/server/models/Review';

async function main() {
  await connectDB();

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

  const products = await ProductModel.find({}).select(
    'name reviewCount rating',
  ).lean();

  let fixed = 0;
  for (const p of products) {
    const s = stats.get(String(p._id));
    const count = s?.count ?? 0;
    const rating = s?.avg ?? 0;
    if (
      Number(p.reviewCount ?? 0) !== count ||
      Number(p.rating ?? 0) !== rating
    ) {
      await ProductModel.updateOne(
        { _id: p._id },
        { $set: { reviewCount: count, rating } },
      );
      console.log(
        `[sync-counts] ${p.name}: reviewCount ${p.reviewCount} → ${count}, rating ${p.rating} → ${rating}`,
      );
      fixed++;
    }
  }

  console.log(`[sync-counts] Đã đồng bộ ${fixed}/${products.length} sản phẩm.`);

  await disconnectDB();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
