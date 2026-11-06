import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Breadcrumb } from '../../../components/breadcrumb';
import { BackToTop } from '../../../components/common/BackToTop';
import { ProductGrid } from '../../../components/product/ProductGrid';
import { ProductSort } from '../../../components/product/ProductSort';
import { Pagination } from '../../../components/product/Pagination';
import { catalogApi } from '../../../services/api/catalog';
import type { Brand, Product } from '../../../types';
import './BrandPage.css';

const PAGE_SIZE = 20;

export const BrandPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('sold');
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [brandRes, productRes] = await Promise.all([
          catalogApi.brand(slug).catch(() => null),
          catalogApi.products({
            brand: slug,
            sort,
            page,
            pageSize: PAGE_SIZE,
          }),
        ]);
        if (cancelled) return;
        setBrand(brandRes);
        setProducts(productRes.products);
        setTotal(productRes.total);
      } catch (err) {
        console.error('Load brand page failed:', err);
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
  }, [slug, sort, page]);

  const brandName = brand?.name ?? slug ?? 'Thương hiệu';
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="container">
      <Breadcrumb items={[{ label: 'Trang chủ', href: '/' }, { label: 'Thương hiệu', href: '/products' }, { label: brandName }]} />

      <div className="brand-page__header">
        {brand?.logo && (
          <img src={brand.logo} alt={brand.name} className="brand-page__logo" />
        )}
        <div className="brand-page__info">
          <h1>{brandName}</h1>
          {brand?.description && <p>{brand.description}</p>}
          <span className="brand-page__count">{total} sản phẩm</span>
        </div>
      </div>

      <div className="brand-page">
        <ProductSort sort={sort} total={total} viewMode="grid" onSortChange={setSort} onViewModeChange={() => {}} />
        <ProductGrid products={products} viewMode="grid" loading={loading} />
        {totalPages > 1 && (
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        )}
      </div>

      <BackToTop />
    </div>
  );
};
