import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { Notification } from '../../types';
import { notificationsApi } from '../../services/api/notifications';
import { useAuth } from '../AuthContext';

interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  remove: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    setIsLoading(true);
    try {
      const data = await notificationsApi.list({ pageSize: 50 });
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
      setError(null);
    } catch (err) {
      console.error('Load notifications failed:', err);
      setError(err instanceof Error ? err.message : 'Không tải được thông báo');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const handleAuthChange = () => {
      void refresh();
    };
    window.addEventListener('henzo-auth-change', handleAuthChange);
    window.addEventListener('focus', handleAuthChange);
    return () => {
      window.removeEventListener('henzo-auth-change', handleAuthChange);
      window.removeEventListener('focus', handleAuthChange);
    };
  }, [refresh]);

  const markAsRead = useCallback(async (id: string): Promise<void> => {
    // Cập nhật optimistically cho UI phản hồi tức thì.
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, isRead: true } : n)),
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
    try {
      await notificationsApi.markRead(id);
    } catch (err) {
      console.error('Mark notification read failed:', err);
      void refresh();
    }
  }, [refresh]);

  const markAllAsRead = useCallback(async (): Promise<void> => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try {
      await notificationsApi.markRead();
    } catch (err) {
      console.error('Mark all notifications read failed:', err);
      void refresh();
    }
  }, [refresh]);

  const remove = useCallback(async (id: string): Promise<void> => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    try {
      await notificationsApi.remove(id);
    } catch (err) {
      console.error('Remove notification failed:', err);
      void refresh();
    }
  }, [refresh]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        error,
        markAsRead,
        markAllAsRead,
        remove,
        refresh,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextValue => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotification must be used within NotificationProvider');
  return context;
};
