/**
 * API địa chỉ giao hàng & phiếu hỗ trợ (phía khách).
 */
import { API_BASE_URL, apiFetch } from './client';
import type { SupportTicket } from '../../types';

export interface Address {
  id: string;
  label: string;
  name: string;
  phone: string;
  address: string;
  ward: string;
  city: string;
  district: string;
  province: string;
  isDefault: boolean;
}

export interface AddressInput {
  label?: string;
  name: string;
  phone: string;
  address: string;
  ward?: string;
  city?: string;
  district?: string;
  province?: string;
  isDefault?: boolean;
}

export const addressesApi = {
  list: (): Promise<Address[]> =>
    apiFetch<Address[]>(`${API_BASE_URL}/addresses`),

  create: (input: AddressInput): Promise<Address> =>
    apiFetch<Address>(`${API_BASE_URL}/addresses`, {
      method: 'POST',
      body: input,
    }),

  update: (id: string, input: Partial<AddressInput>): Promise<Address> =>
    apiFetch<Address>(`${API_BASE_URL}/addresses/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: input,
    }),

  remove: (id: string): Promise<{ id: string; deleted: boolean }> =>
    apiFetch<{ id: string; deleted: boolean }>(
      `${API_BASE_URL}/addresses/${encodeURIComponent(id)}`,
      { method: 'DELETE' },
    ),
};

export interface CreateTicketInput {
  subject: string;
  message: string;
  category?: string;
  priority?: string;
  orderId?: string;
}

export const supportApi = {
  /** Danh sách phiếu hỗ trợ của khách. */
  list: (): Promise<SupportTicket[]> =>
    apiFetch<SupportTicket[]>(`${API_BASE_URL}/support/tickets`),

  create: (input: CreateTicketInput): Promise<SupportTicket> =>
    apiFetch<SupportTicket>(`${API_BASE_URL}/support/tickets`, {
      method: 'POST',
      body: input,
    }),

  /** Cập nhật trạng thái phiếu (đóng / mở lại). */
  update: (
    id: string,
    input: { status?: string; content?: string },
  ): Promise<SupportTicket> =>
    apiFetch<SupportTicket>(
      `${API_BASE_URL}/support/tickets/${encodeURIComponent(id)}`,
      { method: 'PATCH', body: input },
    ),
};
