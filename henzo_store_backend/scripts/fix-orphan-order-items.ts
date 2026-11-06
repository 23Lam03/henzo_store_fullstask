import { connectDB, disconnectDB } from '../src/server/db';
import { ProductModel } from '../src/server/models/Product';
import { OrderModel } from '../src/server/models/Order';
import { specModelKey } from '../../henzo_store/src/data/modelSpecs';

const STOP = new Set(['gb', 'tb', 'mb', 'ssd', 'inch', 'in', 'p', 'e']);

function tokens(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/["']/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .filter((t) => !STOP.has(t));
}

interface ProdInfo {
  _id: any;
  name: string;
  slug: string;
  price: number;
  brand: string;
  categoryName: string;
  tokens: Set<string>;
}

async function main() {
  await connectDB();
  console.log('[fix-orders] Kết nối MongoDB...');

  const products = (await ProductModel.find({})
    .select('name slug price brand categoryName')
    .lean()) as any[];

  const alive = new Set(products.map((p) => String(p._id)));
  const byName = new Map(products.map((p) => [String(p.name), p]));
  const byModel = new Map<string, ProdInfo[]>();
  const infos: ProdInfo[] = products.map((p) => ({
    _id: p._id,
    name: String(p.name),
    slug: String(p.slug),
    price: Number(p.price ?? 0),
    brand: String(p.brand ?? ''),
    categoryName: String(p.categoryName ?? ''),
    tokens: new Set(tokens(String(p.name))),
  }));
  for (const info of infos) {
    const k = specModelKey(info.name);
    byModel.set(k, [...(byModel.get(k) ?? []), info]);
  }

  const orders = await OrderModel.find({});
  console.log(`[fix-orders] ${orders.length} đơn hàng, ${products.length} sản phẩm`);

  let fixedItems = 0;
  let fixedOrders = 0;
  let skipped = 0;
  const unresolved = new Map<string, number>();

  const METHOD_MAP: Record<string, string> = {
    COD: 'cod',
    BANKING: 'banking',
    VNPAY: 'vnpay',
    MOMO: 'momo',
    ZALOPAY: 'zalopay',
    INSTALLMENT: 'installment',
  };
  let methodFixed = 0;
  for (const order of orders) {
    const raw = String((order as any).paymentMethod ?? '');
    const canon = METHOD_MAP[raw.toUpperCase()];
    if (canon && canon !== raw) {
      (order as any).paymentMethod = canon;
      await OrderModel.updateOne({ _id: order._id }, { $set: { paymentMethod: canon } });
      methodFixed++;
    }
  }
  console.log(`[fix-orders] Chuẩn hoá paymentMethod: ${methodFixed} đơn hàng`);

  for (const order of orders) {
    let changed = false;

    for (const it of (order.items ?? []) as any[]) {
      const pid = String(it.productId ?? '');
      if (pid && alive.has(pid)) continue;

      const target = resolve(it, byName, byModel, infos);
      if (!target) {
        skipped++;
        const key = String(it.productName ?? '?');
        unresolved.set(key, (unresolved.get(key) ?? 0) + 1);
        continue;
      }
      it.productId = target._id;
      fixedItems++;
      changed = true;
    }

    for (const sub of (order.subOrders ?? []) as any[]) {
      for (const it of (sub.items ?? []) as any[]) {
        const pid = String(it.productId ?? '');
        if (pid && alive.has(pid)) continue;

        const target = resolve(it, byName, byModel, infos);
        if (!target) {
          skipped++;
          const key = String(it.productName ?? '?');
          unresolved.set(key, (unresolved.get(key) ?? 0) + 1);
          continue;
        }
        it.productId = target._id;
        fixedItems++;
        changed = true;
      }
    }

    if (changed) {
      await order.save();
      fixedOrders++;
    }
  }

  console.log(`[fix-orders] Đã remap ${fixedItems} item trong ${fixedOrders} đơn hàng`);
  if (skipped) {
    console.log(`[fix-orders] Không khớp được: ${skipped} item (${unresolved.size} tên)`);
    for (const [k, v] of [...unresolved.entries()].slice(0, 20)) {
      console.log(`             - ${k} (${v})`);
    }
  }

  const after = await OrderModel.find({}).lean();
  let remaining = 0;
  for (const o of after) {
    for (const it of (o.items ?? []) as any[]) {
      if (!alive.has(String(it.productId ?? ''))) remaining++;
    }
    for (const sub of (o.subOrders ?? []) as any[]) {
      for (const it of (sub.items ?? []) as any[]) {
        if (!alive.has(String(it.productId ?? ''))) remaining++;
      }
    }
  }
  console.log(`[fix-orders] Còn lại item trỏ sản phẩm không tồn tại: ${remaining}`);

  await disconnectDB();
}

function resolve(
  item: any,
  byName: Map<string, any>,
  byModel: Map<string, ProdInfo[]>,
  infos: ProdInfo[],
): ProdInfo | null {
  const name = String(item.productName ?? '').trim();
  if (!name) return null;

  const exact = byName.get(name);
  if (exact) {
    return {
      _id: exact._id,
      name: String(exact.name),
      slug: String(exact.slug),
      price: Number(exact.price ?? 0),
      brand: String(exact.brand ?? ''),
      categoryName: String(exact.categoryName ?? ''),
      tokens: new Set(tokens(String(exact.name))),
    };
  }

  const modelKey = specModelKey(name);
  const modelCands = byModel.get(modelKey);
  if (modelCands?.length) {
    return pickByPrice(modelCands, Number(item.unitPrice ?? 0));
  }

  const cleaned = name.replace(/\s+\d{1,3}$/, '').trim();
  const ct = new Set(tokens(cleaned));
  if (ct.size) {
    let best: ProdInfo | null = null;
    let bestCoverage = 0;
    let bestJaccard = 0;
    for (const info of infos) {
      let inter = 0;
      for (const t of ct) if (info.tokens.has(t)) inter++;
      if (!inter) continue;
      const coverage = inter / ct.size;
      const jaccard = inter / (ct.size + info.tokens.size - inter);
      if (
        coverage > bestCoverage ||
        (coverage === bestCoverage && jaccard > bestJaccard)
      ) {
        bestCoverage = coverage;
        bestJaccard = jaccard;
        best = info;
      }
    }
    if (best && bestCoverage >= 0.6) return best;
  }

  const brand = String(item.productName ?? '')
    .split(' ')[0];
  const sameBrand = infos.filter((i) => i.brand === brand);
  if (sameBrand.length) {
    return pickByPrice(sameBrand, Number(item.unitPrice ?? 0));
  }

  return null;
}

function pickByPrice(cands: ProdInfo[], target: number): ProdInfo {
  let best = cands[0];
  let bestDiff = Infinity;
  for (const c of cands) {
    const diff = Math.abs(c.price - target);
    if (diff === 0) return c;
    if (diff < bestDiff) {
      bestDiff = diff;
      best = c;
    }
  }
  return best;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
