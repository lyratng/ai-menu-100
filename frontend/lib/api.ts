import axios, { AxiosError, AxiosInstance } from 'axios';
import type { ApiResponse } from '@shared/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// 创建axios实例
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 150000, // 150秒（2.5分钟），给后端重试留出足够时间
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加token
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器 - 统一错误处理
apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ API响应成功:', {
      url: response.config.url,
      status: response.status,
      data: response.data,
    });
    return response.data;
  },
  (error: AxiosError<ApiResponse>) => {
    console.error('❌ API请求失败:', {
      url: error.config?.url,
      method: error.config?.method,
      hasResponse: !!error.response,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      code: error.code,
    });
    
    if (error.response) {
      const { status, data } = error.response;
      
      console.log('📦 错误响应详情:', { status, data });
      
      // 401 未认证 - 清除token并跳转登录
      if (status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      }
      
      // 返回错误信息
      return Promise.reject(data?.error || {
        code: 'UNKNOWN_ERROR',
        message: '请求失败',
      });
    }
    
    // 网络错误 - 请求没有到达服务器
    console.error('🌐 网络错误详情:', {
      message: error.message,
      code: error.code,
      baseURL: error.config?.baseURL,
      url: error.config?.url,
      fullURL: `${error.config?.baseURL}${error.config?.url}`,
    });
    
    return Promise.reject({
      code: 'NETWORK_ERROR',
      message: `网络连接失败: ${error.message}`,
    });
  }
);

// API方法封装
export const api = {
  // 认证相关
  auth: {
    register: (data: any) => apiClient.post('/auth/register', data),
    login: (data: any) => apiClient.post('/auth/login', data),
    me: () => apiClient.get('/auth/me'),
  },
  
  // 菜单相关
  menu: {
    generate: (data: any) => apiClient.post('/api/menu/generate', data),
    upload: (data: any) => apiClient.post('/api/menu/upload', data),
    list: (params?: any) => apiClient.get('/api/menu/list', { params }),
    get: (id: string) => apiClient.get(`/api/menu/${id}`),
    delete: (id: string) => apiClient.delete(`/api/menu/${id}`),
  },
  
  // 菜品相关
  dish: {
    list: (params?: any) => apiClient.get('/api/dish/store', { params }),
    get: (id: string) => apiClient.get(`/api/dish/store/${id}`),
  },
  
  // 解析队列相关
  parseQueue: {
    list: () => apiClient.get('/api/menu/upload/queue-status'),
    reparse: (menuId: string) => apiClient.post(`/api/menu/upload/retry`, { upload_id: menuId }),
  },
};

// 工具函数
export function setAuthToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
  }
}

export function clearAuthToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
}

export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
}

// 便捷方法
export async function login(username: string, password: string) {
  const response = await api.auth.login({ username, password });
  return response;
}

export async function register(data: {
  username: string;
  password: string;
  confirm_password?: string;
  storeName?: string;
  store_name?: string;
  contact_person: string;
  contact_phone: string;
  address?: string;
  defaultConfig?: any;
}) {
  const response = await api.auth.register(data);
  return response;
}

export async function generateMenu(data: any): Promise<ApiResponse> {
  const response = await api.menu.generate(data);
  return response as ApiResponse;
}

