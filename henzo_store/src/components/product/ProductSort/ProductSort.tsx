import { Icon } from '../../common/Icon';
import './ProductSort.css';

interface ProductSortProps {
  sort: string;
  total: number;
  viewMode: 'grid' | 'list';
  onSortChange: (sort: string) => void;
  onViewModeChange: (mode: 'grid' | 'list') => void;
}

const SORT_OPTIONS = [
  { value: 'bestseller', label: 'Bán chạy nhất' },
  { value: 'newest', label: 'Mới nhất' },
  { value: 'price-asc', label: 'Giá: Thấp → Cao' },
  { value: 'price-desc', label: 'Giá: Cao → Thấp' },
  { value: 'rating', label: 'Đánh giá cao nhất' },
];

export const ProductSort = ({ sort, total, viewMode, onSortChange, onViewModeChange }: ProductSortProps) => {
  return (
    <div className="product-sort">
      <div className="product-sort__info">
        <strong>{total}</strong>
        <span>sản phẩm</span>
      </div>

      <div className="product-sort__controls">
        <div className="product-sort__view-toggle" role="group" aria-label="Kiểu hiển thị">
          <button
            type="button"
            className={`product-sort__view-btn ${viewMode === 'grid' ? 'is-active' : ''}`}
            onClick={() => onViewModeChange('grid')}
            title="Hiển thị dạng lưới"
            aria-label="Hiển thị dạng lưới"
          >
            <Icon name="grid" size={15} />
          </button>
          <button
            type="button"
            className={`product-sort__view-btn ${viewMode === 'list' ? 'is-active' : ''}`}
            onClick={() => onViewModeChange('list')}
            title="Hiển thị dạng danh sách"
            aria-label="Hiển thị dạng danh sách"
          >
            <Icon name="list" size={15} />
          </button>
        </div>

        <div className="product-sort__select-wrap">
          <Icon name="sort" size={15} className="product-sort__select-icon" />
          <select
            className="product-sort__select"
            value={sort}
            onChange={(e) => onSortChange(e.target.value)}
            aria-label="Sắp xếp sản phẩm"
          >
            {SORT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
