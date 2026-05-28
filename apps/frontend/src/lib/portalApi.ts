import axios from 'axios';

const base = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4055/api').replace(/\/$/, '');
export const portalApi = axios.create({
  baseURL: `${base}/portal`,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

portalApi.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path.startsWith('/account')) window.location.href = '/account/login';
    }
    return Promise.reject(error);
  }
);
