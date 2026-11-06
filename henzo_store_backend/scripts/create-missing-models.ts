import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { connectDB, disconnectDB } from '../src/server/db';
import { ProductModel } from '../src/server/models/Product';
import { CategoryModel } from '../src/server/models/Category';
import { BrandModel } from '../src/server/models/Brand';
import { StoreModel } from '../src/server/models/Store';
import { InventoryModel } from '../src/server/models/Inventory';
import { brandLogo, brandColor } from '../src/server/data/brand-logos';
import { specsForProduct } from '../../henzo_store/src/data/modelSpecs';
import { productDescription, productTags } from '../../henzo_store/src/data/productCopy';
import { modelName } from './lib/model-name';
import { isWrongType } from './lib/image-type';

const NEW_PRODUCTS: Array<{
  name: string;
  brand: string;
  categoryName: string;
  price: number;
  originalPrice: number;
  stock: number;
  sold: number;
  kind: 'phone' | 'laptop' | 'tablet' | 'audio' | 'accessory';
}> = [
  {
    name: 'Kingston FURY Beast 32GB DDR5',
    brand: 'Kingston',
    categoryName: 'PC Gaming',
    price: 4290000,
    originalPrice: 4990000,
    stock: 120,
    sold: 268,
    kind: 'accessory',
  },
  {
    name: 'Kingston FURY Renegade 1TB',
    brand: 'Kingston',
    categoryName: 'PC Gaming',
    price: 3690000,
    originalPrice: 4290000,
    stock: 86,
    sold: 194,
    kind: 'accessory',
  },
  {
    name: 'Logitech Streamcam',
    brand: 'Logitech',
    categoryName: 'Phụ kiện',
    price: 5490000,
    originalPrice: 6490000,
    stock: 45,
    sold: 132,
    kind: 'accessory',
  },
  {
    name: 'HyperX Cloud Alpha Wireless',
    brand: 'HyperX',
    categoryName: 'Tai nghe',
    price: 3290000,
    originalPrice: 3790000,
    stock: 97,
    sold: 341,
    kind: 'audio',
  },
  {
    name: 'SteelSeries Arctis Nova 7',
    brand: 'SteelSeries',
    categoryName: 'Tai nghe',
    price: 4290000,
    originalPrice: 4990000,
    stock: 64,
    sold: 287,
    kind: 'audio',
  },
];

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function main() {
  await connectDB();
  console.log('[new-models] Kết nối MongoDB...');

  const modelImages = JSON.parse(
    readFileSync(resolve(process.cwd(), 'scripts/data/model-images.json'), 'utf8'),
  ) as Record<string, { images: string[] }>;
  const typePools = JSON.parse(
    readFileSync(resolve(process.cwd(), 'scripts/data/type-image-pools.json'), 'utf8'),
  ) as Record<string, string[]>;

  const categories = await CategoryModel.find({}).lean();
  const brands = await BrandModel.find({}).lean();
  const stores = await StoreModel.find({ status: 'active' }).lean();

  if (!stores.length) {
    console.error('[new-models] Không có cửa hàng active nào.');
    await disconnectDB();
    return;
  }

  let created = 0;
  for (const def of NEW_PRODUCTS) {
    const slug = slugify(def.name);

    const exists = await ProductModel.findOne({ slug }).lean();
    if (exists) {
      console.log(`[new-models] = ${def.name} (đã tồn tại)`);
      continue;
    }

    const category = categories.find((c: any) => c.name === def.categoryName);
    if (!category) {
      console.error(`[new-models] ! Thiếu danh mục "${def.categoryName}"`);
      continue;
    }

    let brand = brands.find((b: any) => b.name === def.brand);
    if (!brand) {
      brand = await BrandModel.create({
        name: def.brand,
        slug: slugify(def.brand),
        logo: brandLogo(def.brand),
        color: brandColor(def.brand),
        tagline: `${def.brand} chính hãng`,
        description: `${def.brand} — sản phẩm chính hãng, bảo hành uy tín.`,
        productCount: 0,
      });
      brands.push(brand as any);
      console.log(`[new-models]   + brand "${def.brand}"`);
    }

    const model = modelName(def.name);
    const type = def.categoryName;
    const own = (modelImages[model]?.images ?? []).filter(
      (u) => !isWrongType(u, type),
    );
    const typePool = (typePools[type] ?? []).filter((u) => !isWrongType(u, type));
    const images = [...own, ...typePool]
      .filter((u, i, arr) => arr.indexOf(u) === i)
      .slice(0, 5);

    if (images.length < 3) {
      console.warn(
        `[new-models] ⚠ ${def.name} chỉ có ${images.length} ảnh đúng loại`,
      );
    }

    const { specs } = specsForProduct(def.name);
    const description = productDescription({
      productName: def.name,
      base: model,
      kind: def.kind,
      category: def.categoryName,
      brand: def.brand,
    });
    const tags = productTags({
      productName: def.name,
      base: model,
      kind: def.kind,
      category: def.categoryName,
      brand: def.brand,
    });

    const store = stores[created % stores.length];

    const doc = await ProductModel.create({
      name: def.name,
      slug,
      description,
      shortDescription: description.slice(0, 160),
      price: def.price,
      originalPrice: def.originalPrice,
      discount: Math.round(
        ((def.originalPrice - def.price) / def.originalPrice) * 100,
      ),
      images,
      categoryId: category._id,
      categoryName: def.categoryName,
      brand: def.brand,
      stock: def.stock,
      sold: def.sold,
      viewCount: 120 + ((created * 137) % 3000),
      minStock: 10,
      rating: 0,
      reviewCount: 0,
      tags,
      specifications: specs,
      isFeatured: false,
      isNew: true,
      isHot: def.sold > 200,
      storeId: store._id,
      status: 'active',
      sku: `SKU-NEW${String(created + 1).padStart(4, '0')}`,
    });

    await InventoryModel.updateOne(
      { storeId: store._id, sku: doc.sku },
      {
        $set: {
          storeId: store._id,
          productId: doc._id,
          productName: doc.name,
          productImage: images[0] ?? '',
          category: def.categoryName,
          sku: doc.sku,
          stock: def.stock,
          minStock: 10,
          reserved: 0,
          available: def.stock,
          sold: def.sold,
          status: 'in_stock',
          lastRestocked: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true },
    );

    console.log(
      `[new-models] + ${def.name} | ${images.length} ảnh | ` +
        `store=${String(store.name).slice(0, 20)} | giá ${def.price.toLocaleString('vi-VN')}đ`,
    );
    created++;
  }

  console.log(`[new-models] Đã tạo ${created}/${NEW_PRODUCTS.length} sản phẩm`);

  await disconnectDB();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
