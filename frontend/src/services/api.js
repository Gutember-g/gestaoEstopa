import axios from 'axios';
import { getAccessToken, setAccessToken, clearAccessToken } from './authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Para envio automático dos cookies HTTP-Only (ex: refreshToken)
});

// Fila de requisições pendentes enquanto o token está sendo renovado
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

// Interceptor de Requisição: Anexa o Bearer token JWT e o Tenant ID (fixo para o tenant ativo)
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Single-tenant UI: usa tenant ativo salvo no localStorage ou default 'empresa_demo'
    const tenantId = localStorage.getItem('tenantId') || 'empresa_demo';
    if (tenantId) {
      config.headers['X-Tenant-ID'] = tenantId;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de Resposta: Tratamento de renovação automática do token JWT (Silent Refresh em 401)
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
      // Tenta renovar o token via refreshToken armazenado no Cookie HTTP-Only
      const refreshResponse = await axios.post(
        '/api/auth/refresh',
        {},
        {
          withCredentials: true,
          headers: {
            'X-Tenant-ID': localStorage.getItem('tenantId') || 'empresa_demo',
          },
        }
      );

      const { accessToken } = refreshResponse.data;
      setAccessToken(accessToken);

      // Notifica e resolve toda a fila de requisições pendentes com o novo token
      processQueue(null, accessToken);

      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      // Em caso de falha no refresh (expirado, revogado ou reuso detectado), rejeita a fila e limpa token
      processQueue(refreshError, null);
      clearAccessToken();

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
