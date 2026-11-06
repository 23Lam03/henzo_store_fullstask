import { ProductModel, toProductDto } from '../models/Product';import { CategoryModel } from '../models/Category';
import { BrandModel } from '../models/Brand';
import { ProductStatus } from '../constants';
import { buildMeta, normalizeSearch, splitCsv } from '../http/request';

type FilterQuery = Record<string, any>;

export type ProductSort =
  | 'bestseller'
  | 'newest'
  | 'price-asc'
  | 'price-desc'
  | 'rating'
  | 'sold'
  | 'price'
  | 'relevance';

const SORT_MAP: Record<
  string,
  Record<string, 1 | -1> & { $meta?: string }
> = {
  bestseller: { sold: -1 },
  sold: { sold: -1 },
  newest: { createdAt: -1 },
  'price-asc': { price: 1 },
  'price-desc': { price: -1 },
  price: { price: 1 },
  rating: { rating: -1, reviewCount: -1 },
};

function resolveSort(sort?: string, order?: string): Record<string, 1 | -1> {
  const key = (sort ?? 'bestseller').toLowerCase();

  if (key === 'price') {
    return { price: order === 'desc' ? -1 : 1 };
  }

  const mapped = SORT_MAP[key] ?? SORT_MAP.bestseller;

  if (order === 'asc' || order === 'desc') {
    if (key === 'price-asc' || key === 'price-desc' || key === 'price') {
      return { price: order === 'desc' ? -1 : 1 };
    }
  }
  return { ...mapped };
}

export interface ProductQueryParams {
  page: number;
  pageSize: number;
  search?: string;
  categoryId?: string;
  categorySlug?: string;
  brand?: string;
  brands?: string[];
  storeId?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  inStock?: boolean;
  hasDiscount?: boolean;
  featured?: boolean;
  isNew?: boolean;
  isHot?: boolean;
  sort?: string;
  order?: string;
  status?: string;
}

export async function resolveCategoryIds(slugs: string[]): Promise<string[]> {
  if (!slugs.length) return [];

  const categories = await CategoryModel.find({
    $or: [{ slug: { $in: slugs } }, { name: { $in: slugs } }],
  }).lean();

  if (!categories.length) return [];

  const ids = categories.map((c) => String(c._id));
  const children = await CategoryModel.find({
    parentId: { $in: categories.map((c) => c._id) },
  }).lean();

  return [...ids, ...children.map((c) => String(c._id))];
}

export async function buildProductFilter(
  params: ProductQueryParams,
): Promise<FilterQuery> {
  const filter: FilterQuery = {};

  filter.status = params.status ?? ProductStatus.ACTIVE;

  const and: FilterQuery[] = [];

  const search = normalizeSearch(params.search) ?? null;
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    and.push({
      $or: [
        { name: rx },
        { brand: rx },
        { categoryName: rx },
        { tags: rx },
        { description: rx },
        { sku: rx },
      ],
    });
  }

  const categoryKeys: string[] = [];
  if (params.categorySlug) categoryKeys.push(...splitCsv(params.categorySlug));
  if (params.categoryId) categoryKeys.push(...splitCsv(params.categoryId));

  if (categoryKeys.length) {
    const ids = await resolveCategoryIds(categoryKeys);
    and.push({
      $or: [
        ...(ids.length ? [{ categoryId: { $in: ids } }] : []),
        { categoryName: { $in: categoryKeys } },
      ],
    });
  }

  const brands = [
    ...(params.brand ? [params.brand] : []),
    ...(params.brands?.length ? params.brands : []),
  ].map((b) => b.trim()).filter(Boolean);

  if (brands.length) {
    const rx = new RegExp(`^(${brands.map(escapeRegex).join('|')})$`, 'i');
    filter.brand = rx;
  }

  if (params.storeId) {
    filter.storeId = params.storeId;
  }

  if (params.minPrice !== undefined || params.maxPrice !== undefined) {
    filter.price = {};
    if (params.minPrice !== undefined) filter.price.$gte = params.minPrice;
    if (params.maxPrice !== undefined) filter.price.$lte = params.maxPrice;
  }

  if (params.rating !== undefined && params.rating > 0) {
    filter.rating = { $gte: params.rating };
  }

  if (params.inStock) {
    filter.stock = { $gt: 0 };
  }

  if (params.hasDiscount) {
    filter.discount = { $gt: 0 };
  }

  if (params.featured) filter.isFeatured = true;
  if (params.isNew) filter.isNew = true;
  if (params.isHot) filter.isHot = true;

  if (and.length) {
    filter.$and = [...(filter.$and ?? []), ...and];
  }

  return filter;
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export interface ProductPage {
  products: any[];
  meta: ReturnType<typeof buildMeta>;
}

export async function queryProducts(
  params: ProductQueryParams,
): Promise<ProductPage> {
  const filter = await buildProductFilter(params);
  const sort = resolveSort(params.sort, params.order);

  const [docs, total] = await Promise.all([
    ProductModel.find(filter)
      .sort(sort)
      .skip((params.page - 1) * params.pageSize)
      .limit(params.pageSize)
      .lean(),
    ProductModel.countDocuments(filter),
  ]);

  return {
    products: docs.map(toProductDto),
    meta: buildMeta(params.page, params.pageSize, total),
  };
}

export async function getRelatedProducts(
  product: any,
  limit = 8,
): Promise<any[]> {
  const or: any[] = [];
  if (product.categoryId) or.push({ categoryId: product.categoryId });
  if (product.brand) or.push({ brand: product.brand });

  if (!or.length) return [];

  const docs = await ProductModel.find({
    _id: { $ne: product._id },
    status: ProductStatus.ACTIVE,
    $or: or,
  })
    .sort({ sold: -1 })
    .limit(limit)
    .lean();

  return docs.map(toProductDto);
}

export async function getProductFacets() {
  const [brands, priceRange] = await Promise.all([
    BrandModel.find().sort({ name: 1 }).lean(),
    ProductModel.aggregate([
      { $match: { status: ProductStatus.ACTIVE } },
      {
        $group: {
          _id: null,
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
        },
      },
    ]),
  ]);

  return {
    brands: brands.map((b) => b.name),
    minPrice: priceRange[0]?.minPrice ?? 0,
    maxPrice: priceRange[0]?.maxPrice ?? 200_000_000,
  };
}
