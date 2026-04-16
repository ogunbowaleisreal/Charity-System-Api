import crypto from "crypto";
import { Response } from "express";
import { ApiResponse, ErrorResponse, SuccessResponse } from "../types/api";
import { HTTP_STATUS } from "./constants";
import logger from "../logger";

export const generateOTP = (length: number = 6): string => {
    let otp = "";
    for (let i = 0; i < length; i++) {
        otp += Math.floor(Math.random() * 10).toString();
    }
    return otp;
};

export const generateRandomString = (length: number = 32): string => {
    return crypto.randomBytes(length).toString("hex");
};

export const generateUUID = (): string => {
    return crypto.randomUUID();
};

export const sendSuccessResponse = <T>(
    res: Response,
    data: T,
    message: string = "Success",
    statusCode: number = HTTP_STATUS.OK
): Response => {
    const response: SuccessResponse<T> = {
        success: true,
        message,
        data,
        timestamp: new Date().toISOString(),
        path: res.req.originalUrl,
    };

    return res.status(statusCode).json(response);
};

export const formatPhoneNumber = (phone: string): string => {
    let cleaned = phone.replace(/\D/g, "");

    if (cleaned.startsWith("234")) {
        return cleaned;
    }

    if (cleaned.startsWith("0")) {
        cleaned = cleaned.substring(1);
    }

    return "234" + cleaned;
};

export const sendErrorResponse = (
    res: Response,
    message: string,
    statusCode: number = HTTP_STATUS.BAD_REQUEST,
    error?: string,
    details?: any
): Response => {
    if (res.headersSent) {
        logger.info("Headers already sent, cannot send error response");
        return res;
    }
    const response: ErrorResponse = {
        success: false,
        message,
        error: error || message,
        timestamp: new Date().toISOString(),
        path: res.req.originalUrl,
    };

    if (details) {
        response.details = details;
    }

    // Include stack trace in development
    if (process.env.NODE_ENV === "development" && details instanceof Error) {
        response.stack = details.stack;
    }

    return res.status(statusCode).json(response);
};

export const sendPaginatedResponse = <T>(
    res: Response,
    data: T[],
    pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
    },
    message: string = "Success"
): Response => {
    const response = {
        success: true,
        message,
        data,
        pagination: {
            ...pagination,
            hasNext: pagination.currentPage < pagination.totalPages,
            hasPrev: pagination.currentPage > 1,
        },
        timestamp: new Date().toISOString(),
        path: res.req.originalUrl,
    };

    return res.status(HTTP_STATUS.OK).json(response);
};
export function getMonthRange(date: Date) {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
    return { start, end };
}

export function getCurrentAndLastMonth() {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    return {
        current: getMonthRange(now),
        previous: getMonthRange(lastMonth),
    };
}

export function calculatePercentageChange(current: number, previous: number) {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Number((((current - previous) / previous) * 100).toFixed(2));
}

export function calculateTrend(
    current: number,
    previous: number
): {
    value: number;
    direction: "up" | "down" | "flat";
} {
    if (previous === 0) {
        return {
            value: current > 0 ? 100 : 0,
            direction: current > 0 ? "up" : "flat",
        };
    }

    const raw = ((current - previous) / previous) * 100;
    const value = Number(raw.toFixed(2));

    if (value > 0) return { value, direction: "up" };
    if (value < 0) return { value: Math.abs(value), direction: "down" };

    return { value: 0, direction: "flat" };
}




export const calculatePagination = (
    totalItems: number,
    page: number,
    limit: number
) => {
    const totalPages = Math.ceil(totalItems / limit);
    const skip = (page - 1) * limit;

    return {
        skip,
        totalPages,
        currentPage: page,
        totalItems,
        itemsPerPage: limit,
        hasNext: page < totalPages,
        hasPrev: page > 1,
    };
};

export const sleep = (ms: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};

export const capitalize = (str: string): string => {
    return str.replace(/\b\w/g, (char) => char.toUpperCase());
};

export const slugify = (str: string): string => {
    return str
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
};

export const safeJsonParse = <T>(jsonString: string, defaultValue: T): T => {
    try {
        return JSON.parse(jsonString);
    } catch {
        return defaultValue;
    }
};

export const removeSensitiveFields = <T extends Record<string, any>>(
    obj: T,
    fieldsToRemove: string[] = ["password", "refreshToken", "__v"]
): Partial<T> => {
    const sanitized = { ...obj };

    fieldsToRemove.forEach((field) => {
        delete sanitized[field];
    });

    return sanitized;
};

export const isExpired = (expiryDate: Date): boolean => {
    return new Date() > expiryDate;
};

export const addTime = (minutes: number): Date => {
    const date = new Date();
    date.setMinutes(date.getMinutes() + minutes);
    return date;
};

export const formatDuration = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
};

export const deepClone = <T>(obj: T): T => {
    return JSON.parse(JSON.stringify(obj));
};
export const isEmpty = (obj: any): boolean => {
    if (obj == null) return true;
    if (Array.isArray(obj) || typeof obj === "string") return obj.length === 0;
    if (typeof obj === "object") return Object.keys(obj).length === 0;
    return false;
};

export const retryWithBackoff = async <T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
): Promise<T> => {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error as Error;

            if (attempt === maxRetries) {
                throw lastError;
            }

            const delay = baseDelay * Math.pow(2, attempt - 1);
            await sleep(delay);
        }
    }

    throw lastError!;
};

export const generatePasswordCrypto = (length = 8) => {
    const chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const bytes = crypto.randomBytes(length);
    let password = "";

    for (let i = 0; i < length; i++) {
        password += chars[bytes[i] % chars.length];
    }

    return password;
};

// import crypto from "crypto";
// import { Response } from "express";
// import { ApiResponse, ErrorResponse, SuccessResponse } from "../types/api";
// import { HTTP_STATUS } from "./constants";
// import logger from "../logger";

// export const sendSuccessResponse = <T>(
//     res: Response,
//     data: T,
//     message: string = "Success",
//     statusCode: number = HTTP_STATUS.OK
// ): Response => {
//     const response: SuccessResponse<T> = {
//         success: true,
//         message,
//         data,
//         timestamp: new Date().toISOString(),
//         path: res.req.originalUrl,
//     };

//     return res.status(statusCode).json(response);
// };

// export const sendErrorResponse = (
//     res: Response,
//     message: string,
//     statusCode: number = HTTP_STATUS.BAD_REQUEST,
//     error?: string,
//     details?: any
// ): Response => {
//     if (res.headersSent) {
//         logger.info("Headers already sent, cannot send error response");
//         return res;
//     }
//     const response: ErrorResponse = {
//         success: false,
//         message,
//         error: error || message,
//         timestamp: new Date().toISOString(),
//         path: res.req.originalUrl,
//     };

//     if (details) {
//         response.details = details;
//     }

//     // Include stack trace in development
//     if (process.env.NODE_ENV === "development" && details instanceof Error) {
//         response.stack = details.stack;
//     }

//     return res.status(statusCode).json(response);
// };