import './RouteLoader.css';

/**
 * Chỉ báo tải trang — dạng "đường kẻ biên tập" thay vì ba chấm nhảy
 * (dấu hiệu rõ của template AI).
 */
export const RouteLoader = () => (
  <div className="route-loader" role="status" aria-live="polite">
    <div className="route-loader__rules">
      <span />
      <span />
      <span />
    </div>
    <p className="route-loader__text">Đang tải trang</p>
  </div>
);
