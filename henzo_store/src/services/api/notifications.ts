import { API_BASE_URL, apiFetch, apiFetchWithMeta, qs } from './client';
import type { Notification } from '../../types';
import type { SellerNotification } from '../../types/seller';

export interface NotificationListResult {
  notifications: Notification[];
  unreadCount: number;
  total: number;
}

export const notificationsApi = {
    async list(
    params: { page?: number; pageSize?: number; unread?: boolean } = {},
  ): Promise<NotificationListResult> {
    const { data, meta } = await apiFetchWithMeta<{
      notifications: Notification[];
      unreadCount: number;
    }>(`${API_BASE_URL}/notifications${qs(params)}`);
    return {
      notifications: data?.notifications ?? [],
      unreadCount: data?.unreadCount ?? 0,
      total: meta?.total ?? data?.notifications?.length ?? 0,
    };
  },

    markRead: (id?: string): Promise<{ updated: string | number }> =>
    apiFetch<{ updated: string | number }>(
      `${API_BASE_URL}/notifications${qs(id ? { id } : { all: '1' })}`,
      { method: 'PATCH' },
    ),

    remove: (id?: string): Promise<{ id?: string; deleted?: boolean; deletedCount?: number }> =>
    apiFetch<{ id?: string; deleted?: boolean; deletedCount?: number }>(
      `${API_BASE_URL}/notifications${qs(id ? { id } : undefined)}`,
      { method: 'DELETE' },
    ),
};

export const sellerNotificationsApi = {
  async list(
    params: { page?: number; pageSize?: number; unread?: boolean } = {},
  ): Promise<{ notifications: SellerNotification[]; unreadCount: number; total: number }> {
    const { data, meta } = await apiFetchWithMeta<{
      notifications: SellerNotification[];
      unreadCount: number;
    }>(`${API_BASE_URL}/seller/notifications${qs(params)}`);
    return {
      notifications: data?.notifications ?? [],
      unreadCount: data?.unreadCount ?? 0,
      total: meta?.total ?? data?.notifications?.length ?? 0,
    };
  },

  markRead: (id?: string): Promise<{ updated: string | number }> =>
    apiFetch<{ updated: string | number }>(
      `${API_BASE_URL}/seller/notifications${qs(id ? { id } : { all: '1' })}`,
      { method: 'PATCH' },
    ),

  remove: (id?: string): Promise<{ id?: string; deleted?: boolean; deletedCount?: number }> =>
    apiFetch<{ id?: string; deleted?: boolean; deletedCount?: number }>(
      `${API_BASE_URL}/seller/notifications${qs(id ? { id } : undefined)}`,
      { method: 'DELETE' },
    ),
};
