import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import './ToastContext.css';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  title: string;
  message?: string;
  variant: ToastVariant;
  duration?: number;
}

export interface ToastOptions extends Omit<Toast, 'id'> {}

type ToastAdder = (opts: ToastOptions) => void;

// Stable ref — never reassigned, only .current is updated
const _toastRef: { current: ToastAdder } = { current: () => {} };

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    _toastRef.current = (opts: ToastOptions) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const duration = opts.duration ?? 3500;
      setToasts(prev => [...prev, { ...opts, id }]);
      const timer = setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
        timers.current.delete(id);
      }, duration);
      timers.current.set(id, timer);
    };
    return () => {
      _toastRef.current = () => {};
      timers.current.forEach(t => clearTimeout(t));
    };
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) { clearTimeout(timer); timers.current.delete(id); }
  }, []);

  return (
    <>
      {children}
      {toasts.length > 0 && (
        <div className="toast-container" aria-live="polite">
          {toasts.map(t => (
            <div key={t.id} className={`toast toast--${t.variant}`} role="alert">
              <div className="toast__icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                  stroke={ICON_COLORS[t.variant]} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d={ICON_PATHS[t.variant]}/>
                </svg>
              </div>
              <div className="toast__body">
                <p className="toast__title">{t.title}</p>
                {t.message && <p className="toast__message">{t.message}</p>}
              </div>
              <button className="toast__close" onClick={() => dismiss(t.id)} aria-label="Đóng">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

const ICON_COLORS: Record<ToastVariant, string> = {
  success: '#2F7D52',
  error:   '#B4322F',
  warning: '#A9741A',
  info:    '#2E6E70',
};

const ICON_PATHS: Record<ToastVariant, string> = {
  success: 'M20 6L9 17l-5-5',
  error:   'M18 6L6 18M6 6l12 12',
  warning: 'M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z',
  info:    'M12 16v-4m0-4h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0z',
};

// Expose a function (not the ref) so pages can call: const toast = useToast(); toast(...)
export const useToast = (): ToastAdder => {
  return useCallback((opts: ToastOptions) => {
    _toastRef.current(opts);
  }, []);
};
