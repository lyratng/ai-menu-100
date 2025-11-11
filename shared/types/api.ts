/**
 * API响应基础结构
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

/**
 * 分页参数
 */
export interface PaginationParams {
  page: number;
  page_size: number;
}

/**
 * 分页响应
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

/**
 * 文件上传响应
 */
export interface FileUploadResponse {
  file_id: string;
  file_name: string;
  file_size: number;
  oss_key: string;
}

/**
 * 解析队列状态
 */
export type ParseStatus = 'pending' | 'parsing' | 'success' | 'failed';

/**
 * 菜单解析队列项
 */
export interface ParseQueueItem {
  menu_id: string;
  file_name: string;
  status: ParseStatus;
  progress: number; // 0-100
  error_message?: string;
  created_at: string;
  updated_at: string;
}

/**
 * 解析队列响应
 */
export interface ParseQueueResponse {
  queue: ParseQueueItem[];
  total: number;
  parsing: number;
  pending: number;
  completed: number;
  failed: number;
}

/**
 * 健康检查响应
 */
export interface HealthCheckResponse {
  status: 'ok' | 'degraded' | 'down';
  timestamp: string;
  services: {
    database: 'ok' | 'down';
    redis: 'ok' | 'down';
    oss: 'ok' | 'down';
  };
}

/**
 * API错误代码
 */
export enum ApiErrorCode {
  // 通用错误
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  INVALID_REQUEST = 'INVALID_REQUEST',
  NOT_FOUND = 'NOT_FOUND',
  
  // 认证错误
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  
  // 业务错误
  USER_EXISTS = 'USER_EXISTS',
  STORE_NOT_FOUND = 'STORE_NOT_FOUND',
  MENU_NOT_FOUND = 'MENU_NOT_FOUND',
  DISH_NOT_FOUND = 'DISH_NOT_FOUND',
  INSUFFICIENT_DISHES = 'INSUFFICIENT_DISHES',
  GENERATION_FAILED = 'GENERATION_FAILED',
  PARSING_FAILED = 'PARSING_FAILED',
  FILE_UPLOAD_FAILED = 'FILE_UPLOAD_FAILED',
  
  // 限流错误
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
}

