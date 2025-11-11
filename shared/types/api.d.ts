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
export interface PaginationParams {
    page: number;
    page_size: number;
}
export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
}
export interface FileUploadResponse {
    file_id: string;
    file_name: string;
    file_size: number;
    oss_key: string;
}
export type ParseStatus = 'pending' | 'parsing' | 'success' | 'failed';
export interface ParseQueueItem {
    menu_id: string;
    file_name: string;
    status: ParseStatus;
    progress: number;
    error_message?: string;
    created_at: string;
    updated_at: string;
}
export interface ParseQueueResponse {
    queue: ParseQueueItem[];
    total: number;
    parsing: number;
    pending: number;
    completed: number;
    failed: number;
}
export interface HealthCheckResponse {
    status: 'ok' | 'degraded' | 'down';
    timestamp: string;
    services: {
        database: 'ok' | 'down';
        redis: 'ok' | 'down';
        oss: 'ok' | 'down';
    };
}
export declare enum ApiErrorCode {
    INTERNAL_ERROR = "INTERNAL_ERROR",
    INVALID_REQUEST = "INVALID_REQUEST",
    NOT_FOUND = "NOT_FOUND",
    UNAUTHORIZED = "UNAUTHORIZED",
    FORBIDDEN = "FORBIDDEN",
    INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
    TOKEN_EXPIRED = "TOKEN_EXPIRED",
    USER_EXISTS = "USER_EXISTS",
    STORE_NOT_FOUND = "STORE_NOT_FOUND",
    MENU_NOT_FOUND = "MENU_NOT_FOUND",
    DISH_NOT_FOUND = "DISH_NOT_FOUND",
    INSUFFICIENT_DISHES = "INSUFFICIENT_DISHES",
    GENERATION_FAILED = "GENERATION_FAILED",
    PARSING_FAILED = "PARSING_FAILED",
    FILE_UPLOAD_FAILED = "FILE_UPLOAD_FAILED",
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED"
}
//# sourceMappingURL=api.d.ts.map