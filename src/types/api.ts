export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    error?: string;
    code?: string;
    timestamp: string;
    path?: string;
}

export interface ApiError {
    message: string;
    code?: string;
    statusCode: number;
    details?: any;
}

export interface ValidationError {
    field: string;
    message: string;
    value?: any;
}

export interface PaginatedApiResponse<T> extends ApiResponse<T[]> {
    pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}

export interface ErrorResponse extends ApiResponse {
    success: false;
    error: string;
    details?: ValidationError[] | any;
    stack?: string | undefined;
}

export interface SuccessResponse<T = any> extends ApiResponse<T> {
    success: true;
    data: T;
}

// Request/Response interfaces for specific endpoints
export interface HealthCheckResponse {
    status: 'healthy' | 'unhealthy';
    timestamp: string;
    uptime: number;
    version: string;
    environment: string;
    services: {
        database: 'connected' | 'disconnected';
        redis: 'connected' | 'disconnected';
    };
}

export interface StatsResponse {
    totalUsers: number;
    totalVendors: number;
    totalAdmins: number;
    activeUsers: number;
    verifiedVendors: number;
    recentRegistrations: number;
}