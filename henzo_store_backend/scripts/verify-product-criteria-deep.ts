import { connectDB, disconnectDB } from '../src/server/db';
import { ProductModel } from '../src/server/models/Product';
import { CategoryModel } from '../src/server/models/Category';
import { BrandModel } from '../src/server/models/Brand';
import { StoreModel } from '../src/server/models/Store';
import { ReviewModel } from '../src/server/models/Review';
import { OrderModel } from '../src/server/models/Order';
import { PromotionModel } from '../src/server/models/Promotion';
import {
  specModelKey,
  specsForProduct,
} from '../../henzo_store/src/data/modelSpecs';

const MIN_IMAGES = 3;
const MAX_SHORT_DESC = 160;

import { isWrongType, typeHits } from './lib/image-type';
import { modelType } from './lib/model-type';

function typeScore(imgUrl: string, categoryName: string): number {
  return typeHits(imgUrl, modelType('', categoryName));
}

async function isReachable(url: string): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(url, {
      method: 'HEAD',
      signal: ctrl.signal,
      redirect: 'follow',
    });
    clearTimeout(timer);
    return res.ok;
  } catch {
    return false;
  }
}

async function main() {
  await connectDB();

  const [products, categories, brands, stores, reviews, orders, promotions] =
    await Promise.all([
      ProductModel.find({}).lean(),
      CategoryModel.find({}).lean(),
      BrandModel.find({}).lean(),
      StoreModel.find({}).lean(),
      ReviewModel.find({}).lean(),
      OrderModel.find({}).lean(),
      PromotionModel.find({}).lean(),
    ]);

  console.log(
    `Tổng: ${products.length} sản phẩm | ${categories.length} danh mục | ` +
      `${brands.length} thương hiệu | ${stores.length} cửa hàng | ` +
      `${reviews.length} đánh giá | ${orders.length} đơn hàng | ${promotions.length} khuyến mãi\n`,
  );

  const issues: Record<string, string[]> = {

    'categoryId không tồn tại': [],
    'categoryName lệch categoryId': [],
    'brand không tồn tại': [],
    'storeId không tồn tại': [],
    'status không hợp lệ': [],
    'review trỏ product không tồn tại': [],
    'order item trỏ product không tồn tại': [],

    'category.productCount lệch': [],
    'brand.productCount lệch': [],
    'store.productCount lệch': [],
    'reviewCount/rating lệch collection': [],
    'discount không khớp giá': [],

    'shortDescription thiếu/quá dài': [],
    'sku rỗng/trùng': [],
    'Ảnh < MIN_IMAGES': [],
    'spec lệch bảng chuẩn': [],
    'Ảnh sai loại sản phẩm': [],

    'model chưa có trong bảng chuẩn': [],
    'collection homepage rỗng': [],
  };

  const catById = new Map(categories.map((c) => [String(c._id), c as any]));
  const catByName = new Map(categories.map((c) => [String(c.name), c as any]));
  const brandNames = new Set(brands.map((b) => String(b.name)));
  const storeIds = new Set(stores.map((s) => String(s._id)));
  const productIds = new Set(products.map((p) => String(p._id)));

  const VALID_STATUS = new Set(['active', 'draft', 'hidden']);
  const skuCount = new Map<string, number>();
  const seenModels = new Set<string>();

  const realCatCount = new Map<string, number>();
  const realBrandCount = new Map<string, number>();
  const realStoreCount = new Map<string, number>();

  for (const p of products) {
    const name = String(p.name);
    const catId = p.categoryId ? String(p.categoryId) : '';
    const catName = String(p.categoryName ?? '');
    const brand = String(p.brand ?? '');
    const storeId = p.storeId ? String(p.storeId) : '';

    if (!catId || !catById.has(catId)) {
      issues['categoryId không tồn tại'].push(`${name} (${catId || 'rỗng'})`);
    } else {
      const cat = catById.get(catId)!;
      if (catName && String(cat.name) !== catName) {
        issues['categoryName lệch categoryId'].push(
          `${name}: name="${catName}" vs id="${cat.name}"`,
        );
      }
    }
    if (!catName || !catByName.has(catName)) {
      issues['categoryName lệch categoryId'].push(`${name}: name="${catName}" không có trong categories`);
    }
    if (!brand || !brandNames.has(brand)) {
      issues['brand không tồn tại'].push(`${name} (${brand || 'rỗng'})`);
    }
    if (!storeId || !storeIds.has(storeId)) {
      issues['storeId không tồn tại'].push(`${name} (${storeId || 'rỗng'})`);
    }
    if (!VALID_STATUS.has(String(p.status))) {
      issues['status không hợp lệ'].push(`${name} (${p.status})`);
    }

    if (catId) realCatCount.set(catId, (realCatCount.get(catId) ?? 0) + 1);
    if (brand) realBrandCount.set(brand, (realBrandCount.get(brand) ?? 0) + 1);
    if (storeId) realStoreCount.set(storeId, (realStoreCount.get(storeId) ?? 0) + 1);

    const price = Number(p.price ?? 0);
    const original = Number(p.originalPrice ?? 0);
    const discount = Number(p.discount ?? 0);
    if (original > 0 && price > 0 && original > price) {
      const expect = Math.round(((original - price) / original) * 100);
      if (Math.abs(expect - discount) > 1) {
        issues['discount không khớp giá'].push(
          `${name}: ${original}->${price} = ${expect}% nhưng lưu ${discount}%`,
        );
      }
    }
    if (discount > 0 && original <= price) {
      issues['discount không khớp giá'].push(
        `${name}: discount=${discount}% nhưng original(${original}) <= price(${price})`,
      );
    }

    const short = String(p.shortDescription ?? '');
    if (!short.trim()) issues['shortDescription thiếu/quá dài'].push(`${name} (rỗng)`);
    else if (short.length > MAX_SHORT_DESC)
      issues['shortDescription thiếu/quá dài'].push(`${name} (${short.length} ký tự)`);

    const sku = String(p.sku ?? '').trim();
    if (!sku) issues['sku rỗng/trùng'].push(`${name} (rỗng)`);
    else skuCount.set(sku, (skuCount.get(sku) ?? 0) + 1);

    const imgs = (p.images ?? []).map(String);
    if (imgs.length < MIN_IMAGES) {
      issues['Ảnh < MIN_IMAGES'].push(`${name} (${imgs.length}/${MIN_IMAGES})`);
    }

    const model = specModelKey(name);
    seenModels.add(model);
    const { specs: canonical, missing } = specsForProduct(name);
    if (missing || !Object.keys(canonical).length) {
      issues['model chưa có trong bảng chuẩn'].push(`${name} [${model}]`);
    } else {
      const actual: Record<string, string> =
        p.specifications && typeof (p.specifications as any).entries === 'function'
          ? Object.fromEntries((p.specifications as any).entries())
          : ((p.specifications as any) ?? {});
      const diffs: string[] = [];
      for (const [k, v] of Object.entries(canonical)) {
        if (actual[k] !== v) diffs.push(`${k}: DB="${actual[k]}" ≠ chuẩn="${v}"`);
      }
      if (diffs.length) {
        issues['spec lệch bảng chuẩn'].push(`${name} -> ${diffs.slice(0, 2).join(' | ')}`);
      }
    }
  }

  for (const [sku, n] of skuCount) {
    if (n > 1) issues['sku rỗng/trùng'].push(`${sku} x${n}`);
  }

  for (const r of reviews) {
    const pid = String(r.productId ?? '');
    if (pid && !productIds.has(pid)) {
      issues['review trỏ product không tồn tại'].push(
        `${r.productName || pid} (${pid})`,
      );
    }
  }
  for (const o of orders) {
    const items = (o as any).items ?? [];
    for (const it of items) {
      const pid = String(it.productId ?? '');
      if (pid && !productIds.has(pid)) {
        issues['order item trỏ product không tồn tại'].push(
          `${o._id} -> ${it.productName ?? pid}`,
        );
      }
    }
  }

  for (const c of categories) {
    const real = realCatCount.get(String(c._id)) ?? 0;
    if (Number(c.productCount ?? 0) !== real) {
      issues['category.productCount lệch'].push(
        `${c.name}: lưu ${c.productCount} vs thật ${real}`,
      );
    }
  }
  for (const b of brands) {
    const real = realBrandCount.get(String(b.name)) ?? 0;
    if (Number(b.productCount ?? 0) !== real) {
      issues['brand.productCount lệch'].push(
        `${b.name}: lưu ${b.productCount} vs thật ${real}`,
      );
    }
  }
  for (const s of stores) {
    const real = realStoreCount.get(String(s._id)) ?? 0;
    if (Number(s.productCount ?? 0) !== real) {
      issues['store.productCount lệch'].push(
        `${s.name}: lưu ${s.productCount} vs thật ${real}`,
      );
    }
  }

  const revAgg = new Map<string, { n: number; sum: number }>();
  for (const r of reviews) {
    if (r.isHidden) continue;
    const pid = String(r.productId ?? '');
    const cur = revAgg.get(pid) ?? { n: 0, sum: 0 };
    cur.n += 1;
    cur.sum += Number(r.rating ?? 0);
    revAgg.set(pid, cur);
  }
  for (const p of products) {
    const pid = String(p._id);
    const agg = revAgg.get(pid) ?? { n: 0, sum: 0 };
    if (Number(p.reviewCount ?? 0) !== agg.n) {
      issues['reviewCount/rating lệch collection'].push(
        `${p.name}: reviewCount ${p.reviewCount} vs ${agg.n}`,
      );
    }
    const expectRating = agg.n ? Math.round((agg.sum / agg.n) * 10) / 10 : 0;
    if (Math.abs(Number(p.rating ?? 0) - expectRating) > 0.15) {
      issues['reviewCount/rating lệch collection'].push(
        `${p.name}: rating ${p.rating} vs ${expectRating}`,
      );
    }
  }

  const active = products.filter((p) => p.status === 'active');
  const homeCollections: Record<string, number> = {
    featured: active.filter((p) => p.isFeatured).length,
    hot: active.filter((p) => p.isHot).length,
    new: active.filter((p) => p.isNew).length,
    bestseller: active.filter((p) => Number(p.sold ?? 0) > 0).length,
    flashSale: active.filter((p) => Number(p.discount ?? 0) > 0).length,
  };
  for (const [k, v] of Object.entries(homeCollections)) {
    if (v === 0) issues['collection homepage rỗng'].push(k);
  }

  const MAIN = 0;
  for (const p of products) {
    const imgs = (p.images ?? []).map(String);
    if (!imgs.length) continue;
    const main = imgs[MAIN];
    const type = modelType(String(p.name ?? ''), String(p.categoryName ?? ''));
    if (isWrongType(main, type)) {
      issues['Ảnh sai loại sản phẩm'].push(
        `${p.name} [${type}] -> ${main.slice(-60)}`,
      );
    }
  }

  let total = 0;
  const order = [
    'categoryId không tồn tại',
    'categoryName lệch categoryId',
    'brand không tồn tại',
    'storeId không tồn tại',
    'status không hợp lệ',
    'review trỏ product không tồn tại',
    'order item trỏ product không tồn tại',
    'category.productCount lệch',
    'brand.productCount lệch',
    'store.productCount lệch',
    'reviewCount/rating lệch collection',
    'discount không khớp giá',
    'shortDescription thiếu/quá dài',
    'sku rỗng/trùng',
    'Ảnh < MIN_IMAGES',
    'spec lệch bảng chuẩn',
    'model chưa có trong bảng chuẩn',
    'Ảnh sai loại sản phẩm',
    'collection homepage rỗng',
  ];
  for (const k of order) {
    const v = issues[k] ?? [];
    total += v.length;
    console.log(`${v.length === 0 ? '✅' : '❌'} ${k}: ${v.length}`);
    v.slice(0, 5).forEach((x) => console.log(`     - ${x}`));
    if (v.length > 5) console.log(`     ... +${v.length - 5} nữa`);
  }
  console.log(`\nTỔNG VẤN ĐỀ (mở rộng): ${total}`);

  console.log('\nℹ  Collection homepage:', JSON.stringify(homeCollections));

  const sample = products.slice(0, 60);
  const mains = sample.map((p) => String((p.images ?? [])[0] ?? '')).filter(Boolean);
  const results = await Promise.all(mains.map((u) => isReachable(u)));
  const bad = mains.filter((_, i) => !results[i]);
  console.log(
    `ℹ  Ảnh chính reachable (mẫu ${mains.length}): ${mains.length - bad.length}/${mains.length}`,
  );
  bad.slice(0, 8).forEach((u) => console.log(`     ✗ ${u}`));

  await disconnectDB();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
