import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  try {
    const stored = localStorage.getItem('admin-auth-storage');
    if (stored) {
      const parsed = JSON.parse(stored) as { state?: { token?: string } };
      const token = parsed?.state?.token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch {
    // ignore parse errors
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      !window.location.pathname.includes('/login')
    ) {
      localStorage.removeItem('admin-auth-storage');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
