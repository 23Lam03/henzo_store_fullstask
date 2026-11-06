import { Link } from 'react-router-dom';
import { Breadcrumb } from '../../../components/breadcrumb';
import { BackToTop } from '../../../components/common/BackToTop';
import { ProductCompare } from '../../../components/product/ProductCompare';
import { useCompare } from '../../../contexts/CompareContext';
import './ComparePage.css';

export const ComparePage = () => {
  const { items, removeItem } = useCompare();

  return (
    <div className="container">
      <Breadcrumb items={[{ label: 'Trang chủ', href: '/' }, { label: 'So sánh sản phẩm' }]} />

      <div className="compare-page">
        <div className="compare-page__header">
          <h1>So sánh sản phẩm</h1>
          <p>So sánh tối đa 4 sản phẩm để chọn được sản phẩm phù hợp nhất</p>
        </div>

        <ProductCompare
          products={items.map(i => i.product)}
          onRemove={removeItem}
          maxProducts={4}
        />

        <div className="compare-page__suggestions">
          <h3>Có thể bạn quan tâm</h3>
          <Link to="/products" className="btn btn-outline">Xem thêm sản phẩm</Link>
        </div>
      </div>

      <BackToTop />
    </div>
  );
};
