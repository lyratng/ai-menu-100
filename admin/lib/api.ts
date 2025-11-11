import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('admin_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('admin_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error.response?.data || error.message);
  }
);

// API方法
export const api = {
  auth: {
    login: (data: any) => apiClient.post('/auth/login', data),
  },
  
  stores: {
    list: (params?: any) => apiClient.get('/api/admin/stores', { params }),
    create: (data: any) => apiClient.post('/api/admin/stores', data),
    update: (id: string, data: any) => apiClient.put(`/api/admin/stores/${id}`, data),
    delete: (id: string) => apiClient.delete(`/api/admin/stores/${id}`),
  },
  
  users: {
    list: (params?: any) => apiClient.get('/api/admin/users', { params }),
    create: (data: any) => apiClient.post('/api/admin/users', data),
    update: (id: string, data: any) => apiClient.put(`/api/admin/users/${id}`, data),
    delete: (id: string) => apiClient.delete(`/api/admin/users/${id}`),
  },
  
  config: {
    get: () => apiClient.get('/api/admin/config'),
    update: (data: any) => apiClient.put('/api/admin/config', data),
  },
  
  dashboard: {
    get: () => apiClient.get('/api/admin/dashboard'),
  },
};

