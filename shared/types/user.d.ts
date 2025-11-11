export type UserRole = 'admin' | 'store_manager' | 'viewer';
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
export interface Store {
    id: string;
    name: string;
    code: string | null;
    address: string | null;
    timezone: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    default_config?: StoreDefaultConfig;
}
export interface StoreDefaultConfig {
    breakfast: {
        cold_dish: number;
        pickles: number;
        western_pastry: number;
        soup_porridge: number;
        special_staple: number;
        egg: number;
    };
    lunch: {
        cold_dish: number;
        hot_dish: number;
        soup_porridge: number;
        western_pastry: number;
        special_staple: number;
        special_flavor: number;
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
export interface RegisterRequest {
    username: string;
    password: string;
    confirm_password: string;
    default_config: StoreDefaultConfig;
}
export interface LoginRequest {
    username: string;
    password: string;
}
export interface LoginResponse {
    token: string;
    user: User;
    store: Store;
}
export interface CreateStoreRequest {
    name: string;
    username: string;
    password: string;
    code?: string;
    address?: string;
    default_config?: StoreDefaultConfig;
}
export interface UpdateStoreRequest {
    name?: string;
    code?: string;
    address?: string;
    is_active?: boolean;
    default_config?: StoreDefaultConfig;
}
export interface StoreQueryParams {
    keyword?: string;
    is_active?: boolean;
    inactive_days?: number;
    page?: number;
    page_size?: number;
}
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
//# sourceMappingURL=user.d.ts.map