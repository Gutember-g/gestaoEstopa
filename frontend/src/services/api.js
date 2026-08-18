import axios from 'axios';
import { getAccessToken, setAccessToken, clearAccessToken } from './authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    const tenantId = localStorage.getItem('tenantId') || 'empresa_demo';

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (tenantId) {
      config.headers['X-Tenant-ID'] = tenantId;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Se não houver resposta, se não for HTTP 401, ou se for a própria rota de refresh/login, rejeita direto
    if (
      !error.response ||
      error.response.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/refresh')
    ) {
      if (error.response?.status === 401 && originalRequest.url?.includes('/auth/refresh')) {
        clearAccessToken();
      }
      return Promise.reject(error);
    }

    // Se já houver um refresh em andamento por outra requisição concorrente, enfileira a requisição atual
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Faz chamada de refresh enviando cookie HttpOnly com credentials e cabeçalho anti-CSRF
      const response = await axios.post(
        `${api.defaults.baseURL}/auth/refresh`,
        {},
        {
          withCredentials: true,
          headers: { 'X-Requested-With': 'XMLHttpRequest' },
        }
      );


      const { accessToken } = response.data;
      setAccessToken(accessToken);

      // Notifica e resolve toda a fila de requisições pendentes com o novo token
      processQueue(null, accessToken);

      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      // Em caso de falha no refresh (expirado, revogado ou reuso detectado), rejeita a fila e limpa token
      processQueue(refreshError, null);
      clearAccessToken();

      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;


