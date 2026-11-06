import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props { children: ReactNode; fallback?: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, _info: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div style={{
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          padding: '2rem',
          textAlign: 'center',
          fontFamily: 'inherit',
        }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#B4322F" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <h2 style={{ color: '#111827', margin: 0 }}>Đã xảy ra lỗi</h2>
          <p style={{ color: '#6B7280', maxWidth: 400 }}>
            {this.state.error?.message || 'Một lỗi không mong muốn đã xảy ra. Vui lòng tải lại trang.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 24px',
              background: '#1F5557',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: '0.95rem',
            }}
          >
            Tải lại trang
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
