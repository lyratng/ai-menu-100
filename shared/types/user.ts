/**
 * 用户角色
 */
export type UserRole = 'admin' | 'store_manager' | 'viewer';

/**
 * 用户（users表）
 */
export interface User {
  id: string;
  store_id: string | null;
  username: string;
  email: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * 门店（stores表）
 */
export interface Store {
  id: string;
  name: string;
  code: string | null;
  address: string | null;
  timezone: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  
  // 门店初始化配置
  default_config?: StoreDefaultConfig;
}

/**
 * 门店默认配置（首次注册时的菜品数量配置）
 */
export interface StoreDefaultConfig {
  breakfast: {
    cold_dish: number; // 凉菜
    pickles: number; // 咸菜
    western_pastry: number; // 西餐糕点
    soup_porridge: number; // 汤粥类
    special_staple: number; // 花色主食
    egg: number; // 蛋类
  };
  lunch: {
    cold_dish: number; // 凉菜
    hot_dish: number; // 热菜
    soup_porridge: number; // 汤粥
    western_pastry: number; // 西餐糕点
    special_staple: number; // 花色主食
    special_flavor: number; // 特色风味食品
  };
  dinner: {
    cold_dish: number;
    hot_dish: number;
    soup_porridge: number;
    western_pastry: number;
    special_staple: number;
    special_flavor: number;
  };
  supper: {
    cold_dish: number;
    hot_dish: number;
    soup_porridge: number;
    special_staple: number;
    special_flavor: number;
  };
}

/**
 * 注册请求
 */
export interface RegisterRequest {
  username: string;
  password: string;
  confirm_password: string;
  default_config: StoreDefaultConfig;
}

/**
 * 登录请求
 */
export interface LoginRequest {
  username: string;
  password: string;
}

/**
 * 登录响应
 */
export interface LoginResponse {
  token: string;
  user: User;
  store: Store;
}

/**
 * 创建门店请求（管理员用）
 */
export interface CreateStoreRequest {
  name: string;
  username: string;
  password: string;
  code?: string;
  address?: string;
  default_config?: StoreDefaultConfig;
}

/**
 * 更新门店请求
 */
export interface UpdateStoreRequest {
  name?: string;
  code?: string;
  address?: string;
  is_active?: boolean;
  default_config?: StoreDefaultConfig;
}

/**
 * 门店查询参数
 */
export interface StoreQueryParams {
  keyword?: string;
  is_active?: boolean;
  inactive_days?: number; // 最近多少天未活跃
  page?: number;
  page_size?: number;
}

/**
 * 门店列表响应
 */
export interface StoreListResponse {
  stores: Array<Store & {
    last_active_at: string | null;
    upload_count: number;
    generation_count: number;
  }>;
  total: number;
  page: number;
  page_size: number;
}

