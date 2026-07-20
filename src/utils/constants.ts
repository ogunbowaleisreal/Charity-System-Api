import { Document, Schema, Types } from "mongoose";
export const ADMIN_PERMISSIONS = {
    READ: 'read',
    WRITE: 'write',
    DELETE: 'delete',
    UPDATE: 'update',
    MANAGE_USERS: 'manage_users'
};

export interface IAdmin extends Document {
    _id: Types.ObjectId;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    adminLevel: string;
    status: "active" | "pending_verification" | "suspended" | "deactivated";
    permissions: string[];
    twoFactorEnabled: boolean;
    loginAttempts: number;
    profilePicture: string;
    lockUntil?: Date;
    lastLogin?: Date;
    passwordHistory: string[];
    phone?: string;
    lastActiveAt?: Date;
    totalLogins: number;
    createdBy?: string;
    updatedBy?: string;
    createdAt: Date;
    updatedAt: Date;
    activeTokenId?: string | null;

    // Virtual fields
    fullName: string;

    // Instance methods
    comparePassword(candidatePassword: string): Promise<boolean>;
    incrementLoginAttempts(): Promise<void>;
    resetLoginAttempts(): Promise<void>;
    checkAccountLock(): boolean;
    hasPermission(permission: string): boolean;
    updateLastActive(): Promise<void>;
    isLocked(): boolean;
}

export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    MOVED_PERMANENTLY: 301,
    FOUND: 302,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    LOCKED: 423,
    PAYMENT_REQUIRED: 402,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
    REQUEST_TIMEOUT: 408,
} as const;

export const ERROR_CODES = {
    // Authentication errors
    INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
    TOKEN_EXPIRED: "TOKEN_EXPIRED",
    TOKEN_INVALID: "TOKEN_INVALID",
    TOKEN_REQUIRED: "TOKEN_REQUIRED",
    REFRESH_TOKEN_INVALID: "REFRESH_TOKEN_INVALID",

    // User errors
    USER_NOT_FOUND: "USER_NOT_FOUND",
    USER_ALREADY_EXISTS: "USER_ALREADY_EXISTS",
    USER_NOT_VERIFIED: "USER_NOT_VERIFIED",
    ACCOUNT_LOCKED: "ACCOUNT_LOCKED",
    ACCOUNT_SUSPENDED: "ACCOUNT_SUSPENDED",
    DUPLICATE_ENTRY: "DUPLICATE_ENTRY",
    INVALID_TOKEN: "INVALID_TOKEN",



    // OTP errors
    OTP_INVALID: "OTP_INVALID",
    OTP_EXPIRED: "OTP_EXPIRED",
    OTP_REQUIRED: "OTP_REQUIRED",
    OTP_ATTEMPTS_EXCEEDED: "OTP_ATTEMPTS_EXCEEDED",

    // Validation errors
    VALIDATION_ERROR: "VALIDATION_ERROR",
    MISSING_REQUIRED_FIELDS: "MISSING_REQUIRED_FIELDS",
    INVALID_EMAIL_FORMAT: "INVALID_EMAIL_FORMAT",
    WEAK_PASSWORD: "WEAK_PASSWORD",

    // Business logic errors
    EMAIL_ALREADY_REGISTERED: "EMAIL_ALREADY_REGISTERED",
    BUSINESS_NAME_TAKEN: "BUSINESS_NAME_TAKEN",
    INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS",

    // Rate limiting
    RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",

    // Server errors
    INTERNAL_ERROR: "INTERNAL_ERROR",
    DATABASE_ERROR: "DATABASE_ERROR",
    REDIS_ERROR: "REDIS_ERROR",
    EMAIL_SERVICE_ERROR: "EMAIL_SERVICE_ERROR",

    // VALIDATION_ERROR: "VALIDATION_ERROR",
    AUTHENTICATION_ERROR: "AUTHENTICATION_ERROR",
    AUTHORIZATION_ERROR: "AUTHORIZATION_ERROR",
    UNAUTHORIZED: "UNAUTHORIZED",
    NOT_FOUND: "NOT_FOUND",
    // DUPLICATE_ENTRY: "DUPLICATE_ENTRY",
    INSUFFICIENT_BALANCE: "INSUFFICIENT_BALANCE",
    TRANSACTION_FAILED: "TRANSACTION_FAILED",
    DUPLICATE_TRANSACTION: "DUPLICATE_TRANSACTION",
    //INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
    ACCOUNT_INACTIVE: "ACCOUNT_INACTIVE",
    EMAIL_NOT_VERIFIED: "EMAIL_NOT_VERIFIED",

    TWO_FA_REQUIRED: "TWO_FA_REQUIRED",
    WALLET_LOCKED: "WALLET_LOCKED",
    PROFILE_INCOMPLETE: "PROFILE_INCOMPLETE",
    SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
    RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND",
    RESOURCE_IN_USE: "RESOURCE_IN_USE",
    THIRD_PARTY_ERROR: "THIRD_PARTY_ERROR",
    PROVIDER_ERROR: "PROVIDER_ERROR",
    INVALID_PROVIDER: "INVALID_PROVIDER",
    NOT_IMPLEMENTED: "NOT_IMPLEMENTED",
    INVALID_PIN: "INVALID_PIN",
    BAD_REQUEST: "BAD_REQUEST",
    CONFIGURATION_ERROR: "CONFIGURATION_ERROR",
    INVALID_STATUS: "INVALID_STATUS",
    INVALID_OPERATION: "INVALID_OPERATION",
    UNSUPPORTED_OPERATION: "UNSUPPORTED_OPERATION",
    INVALID_PAYMENT_METHOD: "INVALID_PAYMENT_METHOD",
    CANNOT_DELETE_WITH_PENDING_TRANSACTIONS:
        "CANNOT_DELETE_WITH_PENDING_TRANSACTIONS",
} as const;


export const CACHE_KEYS = {
    OTP_REGISTRATION: (email: string) => `otp:registration:${email}`,
    OTP_PASSWORD_RESET: (email: string) => `otp:password_reset:${email}`,
    USER_PROFILE: (userId: string) => `user:profile:${userId}`,
    VENDOR_PROFILE: (vendorId: string) => `vendor:profile:${vendorId}`,
    REFRESH_TOKEN: (tokenId: string) => `refresh_token:${tokenId}`,
    BLACKLISTED_TOKEN: (tokenId: string) => `blacklist:token:${tokenId}`,
    BLACKLISTED_RESET_TOKEN: (tokenId: string) => `blacklist:token:${tokenId}`,
    RATE_LIMIT: (endpoint: string, ip: string) => `rate_limit:${endpoint}:${ip}`,
    LOGIN_ATTEMPTS: (email: string) => `login_attempts:${email}`,
    ADMIN_REFRESH_TOKEN: (adminId: string, family: string, generation: number) =>
        `admin:refresh_token:${adminId}:${family}:${generation}`,

    ADMIN_REFRESH_USED: (tokenId: string) => `admin:refresh_used:${tokenId}`,

    ADMIN_BLACKLIST_FAMILY: (family: string) =>
        `admin:blacklist_family:${family}`,

    ADMIN_TOKEN_METADATA: (tokenId: string) => `admin:token_meta:${tokenId}`,

    USER_REFRESH_TOKEN: (userId: string, family: string, generation: number) =>
        `user:refresh_token:${userId}:${family}:${generation}`,

    USER_REFRESH_USED: (tokenId: string) => `user:refresh_used:${tokenId}`,

    USER_BLACKLIST_FAMILY: (family: string) => `user:blacklist_family:${family}`,

    // Rate limiting and security
    ADMIN_LOGIN_ATTEMPTS: (email: string) => `admin:login:attempts:${email}`,
    ADMIN_RATE_LIMIT: (adminId: string, action: string) =>
        `admin:rate:${adminId}:${action}`,

    // Session tracking
    ADMIN_ACTIVE_SESSIONS: (adminId: string) => `admin:sessions:${adminId}`,
    ADMIN_LAST_ACTIVITY: (adminId: string) => `admin:activity:${adminId}`,

    // Security alerts and monitoring
    SECURITY_INCIDENT: (adminId: string, type: string) =>
        `security:incident:${adminId}:${type}`,
    SUSPICIOUS_ACTIVITY: (adminId: string) => `security:suspicious:${adminId}`,
    OTP_ATTEMPTS: (email: string, type: string) =>
        `otp_attempts:${type}:${email}`,
} as const;

export const CACHE_TTL = {
    OTP: 600, // 10 minutes
    USER_PROFILE: 1800, // 30 minutes
    VENDOR_PROFILE: 1800, // 30 minutes
    REFRESH_TOKEN: 2592000, // 30 days
    BLACKLISTED_TOKEN: 1800, // 30 minutes
    RATE_LIMIT: 900, // 15 minutes
    LOGIN_ATTEMPTS: 900, // 15 minutes
    OTP_ATTEMPTS: 3600, // 1 hour
    RESET_TOKEN: 600,
} as const;

export const RATE_LIMITS = {
    AUTH: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 10, // 5 attempts per windowMs
        message: "Too many authentication attempts, please try again later.",
    },
    REGISTRATION: {
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 5, // 5 registrations per IP per hour
        message: "Registration limit exceeded, please try again later.",
    },
    OTP: {
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 5, // 5 OTP requests per hour
        message: "OTP request limit exceeded, please try again later.",
    },
    GENERAL: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // 100 requests per 15 minutes
        message: "Too many requests, please try again later.",
    },
    PASSWORD_RESET: {
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 5, // 5 password reset attempts per hour
        message: "Password reset limit exceeded, please try again later.",
    },
} as const;

export const EMAIL_TEMPLATES = {
    WELCOME: "welcome",
    OTP_VERIFICATION: "otp-verification",
    PASSWORD_RESET: "password-reset",
    ACCOUNT_LOCKED: "account-locked",
    VENDOR_APPROVED: "vendor-approved",
    VENDOR_REJECTED: "vendor-rejected",
} as const;

export const LOG_LEVELS = {
    ERROR: "error",
    WARN: "warn",
    INFO: "info",
    DEBUG: "debug",
} as const;

export const PASSWORD_REGEX =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
export const PHONE_REGEX = /^\+?[\d\s\-\(\)]{10,}$/;
export const OTP_REGEX = /^\d{6}$/;
