// ─── User Roles ────────────────────────────────────────────────────────────────
export type UserRole = 'GUEST' | 'CUSTOMER' | 'SHOP' | 'ADMIN';

export const UserRole = {
  GUEST: 'GUEST' as UserRole,
  CUSTOMER: 'CUSTOMER' as UserRole,
  SHOP: 'SHOP' as UserRole,
  ADMIN: 'ADMIN' as UserRole,
};

// ─── User ──────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  avatar: string;
  role: UserRole;
  address?: string;
  gender?: string;
  dob?: string | null;
  bio?: string;
  points?: number;
  createdAt: string;
}

// ─── Auth State ────────────────────────────────────────────────────────────────
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
}

// ─── Login Credentials ─────────────────────────────────────────────────────────
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

// ─── Register Data ───────────────────────────────────────────────────────────
export interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}
