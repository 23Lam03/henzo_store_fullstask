import { API_BASE_URL, apiFetch, tokenStore, clearSession } from './client';
import type { User } from '../../types/auth';

export interface AuthResult {
  user: User;
  accessToken: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface UpdateProfileInput {
  name?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  address?: string;
  gender?: 'Nam' | 'Nữ' | 'Khác';
  dob?: string;
  bio?: string;
}

export const authApi = {
    async login(
    email: string,
    password: string,
    remember = true,
  ): Promise<AuthResult> {
    const data = await apiFetch<AuthResult>(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      body: { email, password },
      auth: false,
    });
    tokenStore.set(data.accessToken, remember);
    return data;
  },

    async register(input: RegisterInput, remember = true): Promise<AuthResult> {
    const data = await apiFetch<AuthResult>(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      body: input,
      auth: false,
    });
    tokenStore.set(data.accessToken, remember);
    return data;
  },

    me: (): Promise<User> => apiFetch<User>(`${API_BASE_URL}/auth/me`),

    async refresh(): Promise<string | null> {
    const data = await apiFetch<{ accessToken: string | null }>(
      `${API_BASE_URL}/auth/refresh`,
      { method: 'POST', auth: false },
    );
    if (data.accessToken) tokenStore.set(data.accessToken);
    return data.accessToken;
  },

    async logout(): Promise<void> {
    try {
      await apiFetch(`${API_BASE_URL}/auth/logout`, { method: 'POST', auth: false });
    } catch {void 0; 
          } finally {
      clearSession();
    }
  },

  updateProfile: (input: UpdateProfileInput): Promise<User> =>
    apiFetch<User>(`${API_BASE_URL}/auth/profile`, {
      method: 'PATCH',
      body: input,
    }),

  changePassword: (input: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<{ success: boolean }> =>
    apiFetch<{ success: boolean }>(`${API_BASE_URL}/auth/password`, {
      method: 'POST',
      body: input,
    }),
};
