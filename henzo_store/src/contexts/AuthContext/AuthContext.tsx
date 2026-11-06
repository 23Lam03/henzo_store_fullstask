import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { User, UserRole } from '../../types/auth';
import { authApi } from '../../services/api/auth';
import { clearSession, onAuthFailure, tokenStore } from '../../services/api/client';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  role: string;
  userRole: UserRole;
  token: string | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; message: string; role?: string }>;
  register: (data: { name: string; email: string; phone: string; password: string }) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Cache user để UI không nhấp nháy khi reload (không chứa mật khẩu). */
const STORAGE_USER = 'henzo_auth_user';

const readCachedUser = (): User | null => {
  try {
    const raw = localStorage.getItem(STORAGE_USER);
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
};

const writeCachedUser = (user: User): void => {
  try {
    localStorage.setItem(STORAGE_USER, JSON.stringify(user));
  } catch {
    /* ignore */
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(readCachedUser);
  const [token, setToken] = useState<string | null>(() => tokenStore.get());
  const [isLoading, setIsLoading] = useState(true);

  // Khởi tạo: gọi /auth/me để xác thực token (có tự refresh khi hết hạn).
  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      if (!tokenStore.get()) {
        if (!cancelled) {
          setUser(null);
          setToken(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        const me = await authApi.me();
        if (cancelled) return;
        setUser(me);
        setToken(tokenStore.get());
        writeCachedUser(me);
      } catch {
        if (cancelled) return;
        clearSession();
        setUser(null);
        setToken(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  // Token hết hạn vĩnh viễn -> backend báo 401 -> api client báo cho ta để logout.
  useEffect(() => {
    return onAuthFailure(() => {
      setUser(null);
      setToken(null);
      window.dispatchEvent(new Event('henzo-auth-change'));
    });
  }, []);

  const login = useCallback(async (
    email: string,
    password: string,
    rememberMe = false,
  ): Promise<{ success: boolean; message: string; role?: string }> => {
    setIsLoading(true);
    try {
      const result = await authApi.login(email, password, rememberMe);
      setUser(result.user);
      setToken(result.accessToken);
      writeCachedUser(result.user);
      setIsLoading(false);
      window.dispatchEvent(new Event('henzo-auth-change'));
      return {
        success: true,
        message: 'Đăng nhập thành công!',
        role: result.user.role,
      };
    } catch (error) {
      console.error('Login failed:', error);
      setIsLoading(false);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Email hoặc mật khẩu không đúng!',
      };
    }
  }, []);

  const register = useCallback(async (data: {
    name: string; email: string; phone: string; password: string;
  }): Promise<{ success: boolean; message: string }> => {
    setIsLoading(true);
    try {
      await authApi.register(data);
      setIsLoading(false);
      return { success: true, message: 'Đăng ký thành công! Vui lòng đăng nhập.' };
    } catch (error) {
      console.error('Register failed:', error);
      setIsLoading(false);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Đăng ký thất bại. Email có thể đã tồn tại!',
      };
    }
  }, []);

  const logout = useCallback(() => {
    void authApi.logout();
    setUser(null);
    setToken(null);
    window.dispatchEvent(new Event('henzo-auth-change'));
  }, []);

  const updateUser = useCallback((data: Partial<User>) => {
    setUser((prev: User | null) => {
      if (!prev) return prev;
      const updated = { ...prev, ...data };
      writeCachedUser(updated);
      return updated;
    });
  }, []);

  /** Tải lại hồ sơ từ server (sau khi cập nhật profile). */
  const refreshUser = useCallback(async () => {
    try {
      const me = await authApi.me();
      setUser(me);
      writeCachedUser(me);
    } catch {
      /* giữ nguyên user hiện tại nếu lỗi mạng */
    }
  }, []);

  const role: string = user?.role || 'GUEST';
  const userRole: UserRole = (user?.role as UserRole) || 'GUEST';

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      role,
      userRole,
      token,
      login,
      register,
      logout,
      updateUser,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
