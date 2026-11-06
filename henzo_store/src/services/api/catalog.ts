import {
  API_BASE_URL,
  apiFetch,
  apiFetchWithMeta,
  qs,
  type QueryValue,
} from './client';
import type {
  Blog,
  Brand,
  Product,
  ProductCategory,
  Promotion,
  SearchHistory,
  Store,
} from '../../types';

export interface ProductQuery {
  categoryId?: string;
  category?: string;
  brand?: string;
  brands?: string[];
  storeId?: string;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  inStock?: boolean;
  hasDiscount?: boolean;
  featured?: boolean;
  isNew?: boolean;
  isHot?: boolean;
  page?: number;
  pageSize?: number;
}

export interface ProductListResult {
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ProductCollections {
  featured: Product[];
  hot: Product[];
  newArrivals: Product[];
  bestSellers: Product[];
  flashSale: Product[];
  newest: Product[];
}

export interface Voucher {
  id: string;
  code: string;
  name: string;
  desc: string;
  description: string;
  value: number;
  discountValue: number;
  discountType: string;
  maxDiscount: number;
  minOrder: number;
  minOrderValue: number;
  startDate: string;
  endDate: string;
  exp: string;
  status: string;
  usageLimit: number;
  usedCount: number;
  isSaved: boolean;
  storeId: string;
}

export interface CategoryDetail extends ProductCategory {
  productCount: number;
  children: ProductCategory[];
}

export interface StoreDetail extends Store {
  products: Product[];
  reviews: unknown[];
}

export const catalogApi = {
    async products(query: ProductQuery = {}): Promise<ProductListResult> {
    const params: Record<string, QueryValue> = {
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 20,
    };
    if (query.categoryId) params.categoryId = query.categoryId;
    if (query.category) params.category = query.category;
    if (query.brand) params.brand = query.brand;
    if (query.brands?.length) params.brands = query.brands.join(',');
    if (query.storeId) params.storeId = query.storeId;
    if (query.search) params.q = query.search;
    if (query.sort) params.sort = query.sort;
    if (query.order) params.order = query.order;
    if (query.minPrice !== undefined) params.minPrice = query.minPrice;
    if (query.maxPrice !== undefined) params.maxPrice = query.maxPrice;
    if (query.rating !== undefined) params.rating = query.rating;
    if (query.inStock) params.inStock = '1';
    if (query.hasDiscount) params.hasDiscount = '1';
    if (query.featured) params.featured = '1';
    if (query.isNew) params.isNew = '1';
    if (query.isHot) params.isHot = '1';

    const { data, meta } = await apiFetchWithMeta<Product[]>(
      `${API_BASE_URL}/products${qs(params)}`,
    );
    return {
      products: data ?? [],
      total: meta?.total ?? data?.length ?? 0,
      page: meta?.page ?? 1,
      pageSize: meta?.pageSize ?? 20,
      totalPages: meta?.totalPages ?? 1,
    };
  },

    collections: (): Promise<ProductCollections> =>
    apiFetch<ProductCollections>(`${API_BASE_URL}/products/collections`),

    product: (idOrSlug: string): Promise<{ product: Product; related: Product[] }> =>
    apiFetch<{ product: Product; related: Product[] }>(
      `${API_BASE_URL}/products/${encodeURIComponent(idOrSlug)}`,
    ),

    categories: (): Promise<ProductCategory[]> =>
    apiFetch<ProductCategory[]>(`${API_BASE_URL}/categories`),

  category: (slug: string): Promise<CategoryDetail> =>
    apiFetch<CategoryDetail>(
      `${API_BASE_URL}/categories/${encodeURIComponent(slug)}`,
    ),

  brands: (): Promise<Brand[]> => apiFetch<Brand[]>(`${API_BASE_URL}/brands`),

  brand: (slug: string): Promise<Brand> =>
    apiFetch<Brand>(`${API_BASE_URL}/brands/${encodeURIComponent(slug)}`),

  stores: (
    params: { page?: number; pageSize?: number; q?: string } = {},
  ): Promise<Store[]> =>
    apiFetch<Store[]>(`${API_BASE_URL}/stores${qs(params)}`),

  store: (idOrSlug: string): Promise<StoreDetail> =>
    apiFetch<StoreDetail>(
      `${API_BASE_URL}/stores/${encodeURIComponent(idOrSlug)}`,
    ),

  blogs: (
    params: { category?: string; q?: string; page?: number; pageSize?: number } = {},
  ): Promise<Blog[]> => apiFetch<Blog[]>(`${API_BASE_URL}/blog${qs(params)}`),

  blog: (slug: string): Promise<{ post: Blog; related: Blog[] }> =>
    apiFetch<{ post: Blog; related: Blog[] }>(
      `${API_BASE_URL}/blog/${encodeURIComponent(slug)}`,
    ),

    promotions: (
    params: { storeId?: string; page?: number; pageSize?: number } = {},
  ): Promise<{
    promotions: Promotion[];
    vouchers: Voucher[];
    total: number;
    promoTotal: number;
    voucherTotal: number;
    totalPages: number;
  }> =>
    apiFetchWithMeta<{
      promotions: Promotion[];
      vouchers: Voucher[];
      promoTotal?: number;
      voucherTotal?: number;
    }>(`${API_BASE_URL}/promotions${qs(params)}`).then((res) => ({
      promotions: res.data?.promotions ?? [],
      vouchers: res.data?.vouchers ?? [],
      total: res.meta?.total ?? 0,
      promoTotal: res.data?.promoTotal ?? res.data?.promotions?.length ?? 0,
      voucherTotal: res.data?.voucherTotal ?? res.data?.vouchers?.length ?? 0,
      totalPages: res.meta?.totalPages ?? 1,
    })),

    async search(query: string): Promise<{
    products: Product[];
    categories: string[];
    brands: string[];
  }> {
    const { products } = await catalogApi.products({
      search: query,
      pageSize: 8,
    });
    return {
      products,
      categories: [...new Set(products.map((p) => p.categoryName).filter(Boolean))],
      brands: [...new Set(products.map((p) => p.brand).filter(Boolean))],
    };
  },

  searchHistory: (): Promise<SearchHistory[]> =>
    apiFetch<SearchHistory[]>(`${API_BASE_URL}/search-history`),

    recordSearch: (query: string): Promise<{ query: string }> =>
    apiFetch<{ query: string }>(`${API_BASE_URL}/search-history`, {
      method: 'POST',
      body: { query },
    }),

  clearSearchHistory: (): Promise<{ deletedCount: number }> =>
    apiFetch<{ deletedCount: number }>(`${API_BASE_URL}/search-history`, {
      method: 'DELETE',
    }),
};
