import { connectDB, disconnectDB } from '../../src/server/db';
import { PromotionModel, VoucherModel } from '../../src/server/models/Promotion';

(async () => {
  await connectDB();
  const promos = await PromotionModel.find({}).lean();
  const vouchers = await VoucherModel.find({}).lean();
  const now = new Date();

  console.log('=== PROMOTIONS (197) ===');
  const pe = promos.filter((p: any) => new Date(p.endDate) < now);
  const pn = promos.filter((p: any) => new Date(p.startDate) > now);
  const pa = promos.filter((p: any) => new Date(p.startDate) <= now && new Date(p.endDate) >= now);
  console.log(`  active ${pa.length} | ended ${pe.length} | upcoming ${pn.length}`);
  console.log('  ended 5 mẫu:');
  for (const p of pe.slice(0, 5)) {
    console.log(`    "${p.title}" ${p.startDate?.toISOString?.().slice(0,10)} -> ${p.endDate?.toISOString?.().slice(0,10)} status=${p.status} discount=${p.discount}`);
  }
  const durs = pe.map((p: any) => (new Date(p.endDate).getTime() - new Date(p.startDate).getTime()) / 86400000);
  console.log(`  thời lượng promo ended: min ${Math.min(...durs).toFixed(0)} ngày, max ${Math.max(...durs).toFixed(0)} ngày`);

  console.log('\n=== VOUCHERS ===');
  const ve = vouchers.filter((v: any) => new Date(v.endDate) < now);
  const va = vouchers.filter((v: any) => new Date(v.startDate) <= now && new Date(v.endDate) >= now);
  console.log(`  tổng ${vouchers.length} | active ${va.length} | ended ${ve.length}`);
  console.log('  active:', va.map((v: any) => `${v.code}(${v.discountValue}${v.discountType})`).join(', '));
  console.log('  ended:', ve.map((v: any) => v.code).join(', '));

  await disconnectDB();
})();
