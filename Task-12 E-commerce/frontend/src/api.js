import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

// Create configured Axios instance without session cookies
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach access token automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — automatic transparent refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    // Check if error is 401, not already retried, and not the login/register/refresh request itself
    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !original.url?.includes('/api/login') &&
      !original.url?.includes('/api/register') &&
      !original.url?.includes('/api/refresh')
    ) {
      original._retry = true;
      try {
        const refresh = localStorage.getItem('refresh_token');
        if (!refresh) {
          throw new Error('No refresh token present.');
        }

        // Request a new access token using the refresh token
        const res = await axios.post(
          `${BASE_URL}/api/refresh`,
          {},
          {
            headers: {
              Authorization: `Bearer ${refresh}`,
            },
          }
        );

        const newToken = res.data.access_token;
        if (newToken) {
          localStorage.setItem('access_token', newToken);
          original.headers = original.headers || {};
          original.headers.Authorization = `Bearer ${newToken}`;
          return api(original);
        }
      } catch (refreshErr) {
        // Refresh failed (e.g. refresh token expired or revoked) — log user out cleanly
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        if (
          window.location.pathname !== '/login' &&
          window.location.pathname !== '/register'
        ) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
