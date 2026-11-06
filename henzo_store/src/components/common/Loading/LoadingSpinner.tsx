export const LoadingSpinner = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '60vh',
    flexDirection: 'column',
    gap: '16px',
  }}>
    <div className="spinner spinner-lg" />
    <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
      Đang tải...
    </p>
  </div>
);
