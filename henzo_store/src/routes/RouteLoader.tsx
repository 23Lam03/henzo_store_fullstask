import './RouteLoader.css';

export const RouteLoader = () => {
  return (
    <div className="route-loader">
      <div className="route-loader__inner">
        <div className="route-loader__spinner">
          <div className="route-loader__dot" />
          <div className="route-loader__dot" />
          <div className="route-loader__dot" />
        </div>
        <p className="route-loader__text">Đang tải...</p>
      </div>
    </div>
  );
};
