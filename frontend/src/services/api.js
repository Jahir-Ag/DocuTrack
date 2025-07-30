import axios from 'axios';

// Configuración base de la API usando Vite
// ✅ CORREGIDO: Puerto 3001 en lugar de 3000
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: 'http://localhost:3001/api', // ✅ Con /api al final
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token automáticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // ✅ AGREGADO: Log para debugging
    console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores
api.interceptors.response.use(
  (response) => {
    // ✅ AGREGADO: Log para debugging
    console.log(`✅ API Response: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
    return response;
  },
  (error) => {
    // ✅ MEJORADO: Mejor logging de errores
    console.error('❌ API Error:', {
      status: error.response?.status,
      method: error.config?.method?.toUpperCase(),
      url: error.config?.url,
      message: error.response?.data?.error || error.message
    });

    // Manejar errores de autenticación
    if (error.response?.status === 401) {
      console.warn('🔐 Token expirado o inválido, redirigiendo al login');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    // Manejar errores de servidor
    if (error.response?.status >= 500) {
      console.error('🚨 Error del servidor:', error);
    }

    return Promise.reject(error);
  }
);

export default api;