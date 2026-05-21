import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const userRole = localStorage.getItem('userRole');
      // franchise token is validated by franchiseProtect middleware
      // only logout if it's an admin token that failed
      if (userRole === 'admin') {
        localStorage.removeItem('token');
        localStorage.removeItem('isAuthenticated');
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
