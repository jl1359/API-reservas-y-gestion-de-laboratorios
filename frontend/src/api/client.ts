import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para inyectar token de forma transparente en cada petición
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para atrapar 401 Unauthorized y limpiar sesión
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Si el token expiró o es inválido, limpiar sesión si no es página de login
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/registro')) {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;