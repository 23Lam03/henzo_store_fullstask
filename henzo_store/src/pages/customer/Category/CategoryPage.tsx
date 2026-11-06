import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Breadcrumb } from '../../../components/breadcrumb';
import { BackToTop } from '../../../components/common/BackToTop';
import { ProductGrid } from '../../../components/product/ProductGrid';
import { ProductSort } from '../../../components/product/ProductSort';
import { Pagination } from '../../../components/product/Pagination';
import { catalogApi } from '../../../services/api/catalog';
import type { Brand, Product, ProductCategory } from '../../../types';
import './CategoryPage.css';

const PAGE_SIZE = 20;

export const CategoryPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState<ProductCategory | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [activeBrands, setActiveBrands] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('sold');
  const [page, setPage] = useState(1);

  // Danh mục + thương hiệu lấy từ backend.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [cats, brs] = await Promise.all([
          catalogApi.categories(),
          catalogApi.brands(),
        ]);
        if (cancelled) return;
        setBrands(brs);
        const flat = [...cats, ...(cats.flatMap(c => c.children ?? []))];
        setCategory(flat.find(c => c.slug === slug) ?? null);
      } catch (err) {
        console.error('Load category metadata failed:', err);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const result = await catalogApi.products({
          category: slug,
          brands: activeBrands.length ? activeBrands : undefined,
          sort,
          page,
          pageSize: PAGE_SIZE,
        });
        if (cancelled) return;
        setProducts(result.products);
        setTotal(result.total);
      } catch (err) {
        console.error('Load category products failed:', err);
        if (!cancelled) {
          setProducts([]);
          setTotal(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [slug, activeBrands.join(','), sort, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const categoryName = category?.name ?? slug ?? 'Danh mục';

  const toggleBrand = (brandName: string) => {
    setActiveBrands(prev =>
      prev.includes(brandName)
        ? prev.filter(b => b !== brandName)
        : [...prev, brandName],
    );
    setPage(1);
  };

  return (
    <div className="container">
      <Breadcrumb items={[{ label: 'Trang chủ', href: '/' }, { label: categoryName }]} />

      {category?.banner && (
        <div className="category-page__banner" style={{ backgroundImage: `url(${category.banner})` }}>
          <div className="category-page__banner-overlay">
            <h1>{categoryName}</h1>
            {category.description && <p>{category.description}</p>}
          </div>
        </div>
      )}

      <div className="category-page">
        <div className="category-page__sidebar">
          <div className="category-page__filter-group">
            <h3>Bộ lọc</h3>
            <div className="category-page__filter-section">
              <h4>Thương hiệu</h4>
              {brands.map(b => (
                <label key={b.id} className="category-page__filter-item">
                  <input
                    type="checkbox"
                    checked={activeBrands.includes(b.name)}
                    onChange={() => toggleBrand(b.name)}
                  />{' '}
                  {b.name}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="category-page__main">
          <ProductSort sort={sort} total={total} viewMode="grid" onSortChange={setSort} onViewModeChange={() => {}} />
          <ProductGrid products={products} viewMode="grid" loading={loading} />
          {totalPages > 1 && (
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          )}
        </div>
      </div>

      <BackToTop />
    </div>
  );
};
