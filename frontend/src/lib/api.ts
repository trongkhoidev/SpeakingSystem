import axios from 'axios';
import { toast } from 'sonner';

let API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// Ensure production URL has /api/v1 suffix if it's missing
if (API_URL && !API_URL.endsWith('/api/v1') && !API_URL.endsWith('/api/v1/')) {
  API_URL = API_URL.endsWith('/') ? `${API_URL}api/v1` : `${API_URL}/api/v1`;
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const detail = error.response?.data?.detail;

    if (status === 402) {
      if (typeof window !== 'undefined') {
        toast.error(detail || 'Bạn đã hết 💎. Vui lòng nâng cấp gói hoặc nhận 💎 thưởng hằng ngày.');
        // Trigger a global custom event so components can show a nice modal
        window.dispatchEvent(new CustomEvent('insufficient-tokens'));
      }
    }

    if (status === 403 && typeof detail === 'string') {
      if (detail.toLowerCase().includes('sign in with google') || detail.toLowerCase().includes('guest trial quota')) {
        if (typeof window !== 'undefined') {
          toast.error('Bạn đã hết lượt dùng thử. Vui lòng đăng nhập Google để tiếp tục.');
          window.dispatchEvent(new CustomEvent('trial-limit-reached'));
        }
      }
    }

    if (error.response?.status === 401) {
      // Clear token and redirect to login if unauthorized
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
