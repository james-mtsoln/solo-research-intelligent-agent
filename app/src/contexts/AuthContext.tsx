import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { apiGet, apiPost } from '@/lib/api';

export type UserRole = 'admin' | 'editor' | 'viewer';

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isEditor: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Validate token on mount
  useEffect(() => {
    const token = localStorage.getItem('rid_token');
    if (!token) {
      setLoading(false);
      return;
    }

    // Validate token and fetch user
    apiGet<User>('/api/auth/me')
      .then((userData) => {
        setUser(userData);
      })
      .catch(() => {
        localStorage.removeItem('rid_token');
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await apiPost<{
      access_token: string;
      token_type: string;
      user: User;
    }>('/api/auth/login', { email, password });

    localStorage.setItem('rid_token', response.access_token);
    setUser(response.user);
  }, []);

  const register = useCallback(async (email: string, name: string, password: string) => {
    const response = await apiPost<{
      token: string;
      user: User;
    }>('/api/auth/register', { email, name, password });

    localStorage.setItem('rid_token', response.token);
    setUser(response.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('rid_token');
    setUser(null);
    window.location.hash = '#/login';
  }, []);

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';
  const isEditor = user?.role === 'admin' || user?.role === 'editor';

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isAdmin,
        isEditor,
        login,
        register,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
