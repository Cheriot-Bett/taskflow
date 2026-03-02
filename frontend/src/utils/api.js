import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res.data,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      // Dispatch a custom event instead of hard-navigating with window.location.href.
      // Hard navigation causes a full page reload which can cancel in-flight requests
      // (including the login POST itself), producing a misleading 'An error occurred' error.
      // AuthContext listens to this event and triggers a clean SPA logout + redirect.
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    return Promise.reject(err.response?.data?.error || 'An error occurred');
  }
);

export default api;
