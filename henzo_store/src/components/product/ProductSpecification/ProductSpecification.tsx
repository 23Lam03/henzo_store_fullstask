import type { Product } from '../../../types';
import './ProductSpecification.css';

interface ProductSpecificationProps {
  product: Product;
}

export const ProductSpecification = ({ product }: ProductSpecificationProps) => {
  const specs = Object.entries(product.specifications);

  return (
    <div className="product-spec">
      <h3 className="product-spec__title">Thông số kỹ thuật</h3>
      <div className="product-spec__table">
        <tbody>
          {specs.map(([key, value]) => (
            <tr key={key} className="product-spec__row">
              <td className="product-spec__key">{key}</td>
              <td className="product-spec__value">{value}</td>
            </tr>
          ))}
        </tbody>
      </div>
    </div>
  );
};
