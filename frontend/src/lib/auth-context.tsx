import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from './api';
import { getDeviceFingerprint } from './fingerprint';

interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role?: 'admin' | 'user' | 'guest';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (idToken: string) => Promise<void>;
  loginGuest: () => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isGuest: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user profile on mount if token exists
  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        console.log('[AuthContext] Fetching user profile...');
        const response = await api.get('/auth/me');
        console.log('[AuthContext] User profile loaded:', response.data.email, 'Role:', response.data.role);
        setUser(response.data);
      } catch (error) {
        console.error('[AuthContext] Failed to fetch user:', error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [token]);

  const login = async (idToken: string) => {
    try {
      setLoading(true);
      setError(null);
      console.log('[AuthContext] Attempting Google login...');
      const fingerprint = await getDeviceFingerprint();
      const response = await api.post('/auth/google', 
        { id_token: idToken },
        { headers: { 'X-Device-Fingerprint': fingerprint } }
      );
      const { access_token, user: userData } = response.data;
      
      console.log('[AuthContext] Login success. User:', userData.email, 'Role:', userData.role);
      
      localStorage.setItem('token', access_token);
      setToken(access_token);
      setUser(userData);
      const is_admin = userData.role === 'admin';
      const name = userData.full_name || userData.email;
      import('sonner').then(({ toast }) => {
        toast.success(`Đăng nhập thành công! ${is_admin ? 'Quyền Admin: ' : ''}${name}`);
      });
    } catch (err: any) {
      console.error('[AuthContext] Login failed:', err);
      const message = err.response?.data?.detail || err.message || 'Login failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginGuest = async () => {
    try {
      setLoading(true);
      setError(null);
      const fingerprint = await getDeviceFingerprint();
      const response = await api.post('/auth/guest', null, {
        headers: { 'X-Device-Fingerprint': fingerprint }
      });
      const { access_token, user: userData } = response.data;
      
      setToken(access_token);
      setUser(userData);
      localStorage.setItem('token', access_token);
    } catch (err: any) {
      console.error('Guest login failed:', err);
      const message = err.response?.data?.detail || err.message || 'Guest login failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  const value = {
    user,
    token,
    loading,
    error,
    login,
    loginGuest,
    logout,
    isAuthenticated: !!token,
    isAdmin: user?.role === 'admin',
    isGuest: user?.role === 'guest',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
