import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Breadcrumb } from '../../../components/breadcrumb';
import { BackToTop } from '../../../components/common/BackToTop';
import { Icon } from '../../../components/common/Icon';
import { ProductGrid } from '../../../components/product/ProductGrid';
import { ProductFilter } from '../../../components/product/ProductFilter';
import { ProductSort } from '../../../components/product/ProductSort';
import { Pagination } from '../../../components/product/Pagination';
import { catalogApi } from '../../../services/api/catalog';
import type { Brand, Product, ProductCategory } from '../../../types';
import './ProductListPage.css';

const PAGE_SIZE = 20;
const MAX_PRICE = 200000000;

export const ProductListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterOpen, setFilterOpen] = useState(false);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  const page = parseInt(searchParams.get('page') || '1');
  const sort = searchParams.get('sort') || 'bestseller';
  const search = searchParams.get('q') || '';
  const singleCategory = searchParams.get('category') || '';

  const brandsParam = searchParams.get('brands') || '';
  const categoriesParam = searchParams.get('categories') || '';
  const priceMinParam = searchParams.get('priceMin');
  const priceMaxParam = searchParams.get('priceMax');
  const ratingParam = searchParams.get('rating');
  const inStockParam = searchParams.get('inStock');
  const hasDiscountParam = searchParams.get('hasDiscount');

  const activeBrands = useMemo(
    () => (brandsParam ? brandsParam.split(',').filter(Boolean) : []),
    [brandsParam],
  );
  const activeCategories = useMemo(
    () => (categoriesParam ? categoriesParam.split(',').filter(Boolean) : []),
    [categoriesParam],
  );
  const activePriceMin = priceMinParam ? parseInt(priceMinParam) : undefined;
  const activePriceMax = priceMaxParam ? parseInt(priceMaxParam) : undefined;
  const activeRating = ratingParam ? parseInt(ratingParam) : 0;
  const activeInStock = inStockParam === '1';
  const activeHasDiscount = hasDiscountParam === '1';

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [cats, brs] = await Promise.all([
          catalogApi.categories(),
          catalogApi.brands(),
        ]);
        if (cancelled) return;
        setCategories(cats);
        setBrands(brs);
      } catch (err) {
        console.error('Load filter metadata failed:', err);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await catalogApi.products({
          search: search || undefined,

          category: activeCategories.length ? activeCategories.join(',') : singleCategory || undefined,
          brands: activeBrands.length ? activeBrands : undefined,
          minPrice: activePriceMin,
          maxPrice: activePriceMax,
          rating: activeRating || undefined,
          inStock: activeInStock || undefined,
          hasDiscount: activeHasDiscount || undefined,
          sort,
          order: sort === 'price-asc' ? 'asc' : sort === 'price-desc' ? 'desc' : undefined,
          page,
          pageSize: PAGE_SIZE,
        });
        setProducts(res.products);
        setTotal(res.total);
      } catch (err) {
        console.error('Load products failed:', err);
        setProducts([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [
    search,
    singleCategory,
    activeCategories.join(','),
    activeBrands.join(','),
    activePriceMin,
    activePriceMax,
    activeRating,
    activeInStock,
    activeHasDiscount,
    sort,
    page,
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleSortChange = (newSort: string) => {
    setSearchParams(prev => {
      const p = new URLSearchParams(prev);
      p.set('sort', newSort);
      p.set('page', '1');
      return p;
    });
  };

  const handlePageChange = (newPage: number) => {
    setSearchParams(prev => {
      const p = new URLSearchParams(prev);
      p.set('page', String(newPage));
      return p;
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeCategoryName =
    categories.find(c => c.slug === singleCategory)?.name ?? 'Tất cả sản phẩm';

  const updateFilters = (patch: Record<string, string | null>) => {
    setSearchParams(prev => {
      const p = new URLSearchParams(prev);
      for (const [key, value] of Object.entries(patch)) {
        if (value === null || value === '') {
          p.delete(key);
        } else {
          p.set(key, value);
        }
      }
      p.set('page', '1');
      return p;
    });
  };

  const filterCategories = categories.map(c => ({
    name: c.name,
    slug: c.slug,
    count: 0,
  }));

  const filterBrands = brands.map(b => ({
    name: b.name,
    count: b.productCount,
  }));

  return (
    <div className="container">
      <Breadcrumb
        items={[
          { label: 'Trang chủ', href: '/' },
          { label: search ? `Tìm kiếm: "${search}"` : activeCategoryName },
        ]}
      />

      <div className="product-list-page">
        <div className="product-list-page__header">
          <div className="product-list-page__heading">
            <h1 className="product-list-page__title">
              {search ? `Kết quả tìm kiếm: "${search}"` : activeCategoryName}
            </h1>
            {search && (
              <p className="product-list-page__sub">Tìm kiếm trong toàn bộ danh mục sản phẩm của HenzoStore</p>
            )}
          </div>
          <button
            className="product-list-page__filter-toggle"
            onClick={() => setFilterOpen(!filterOpen)}
          >
            <Icon name="filter" size={17} />
            Bộ lọc
          </button>
        </div>

        <div className="product-list-page__layout">
          <div className={`product-list-page__sidebar ${filterOpen ? 'open' : ''}`}>
            <ProductFilter
              brands={filterBrands}
              categories={filterCategories}
              onFilterChange={(filters) => {
                updateFilters({
                  brands: filters.brands.join(',') || null,
                  categories: filters.categories.join(',') || null,
                  priceMin: filters.priceRange[0] > 0 ? String(filters.priceRange[0]) : null,
                  priceMax: filters.priceRange[1] < MAX_PRICE ? String(filters.priceRange[1]) : null,
                  rating: filters.rating > 0 ? String(filters.rating) : null,
                  inStock: filters.inStock ? '1' : null,
                  hasDiscount: filters.hasDiscount ? '1' : null,
                });
              }}
              onReset={() => {
                updateFilters({
                  brands: null,
                  categories: null,
                  priceMin: null,
                  priceMax: null,
                  rating: null,
                  inStock: null,
                  hasDiscount: null,
                });
              }}
            />
          </div>

          <div className="product-list-page__main">
            <ProductSort
              sort={sort}
              total={total}
              viewMode={viewMode}
              onSortChange={handleSortChange}
              onViewModeChange={setViewMode}
            />

            <ProductGrid products={products} viewMode={viewMode} loading={loading} />

            {totalPages > 1 && (
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </div>
        </div>
      </div>

      <BackToTop />
    </div>
  );
};
