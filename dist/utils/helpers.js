"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePasswordCrypto = exports.retryWithBackoff = exports.isEmpty = exports.deepClone = exports.formatDuration = exports.addTime = exports.isExpired = exports.removeSensitiveFields = exports.safeJsonParse = exports.slugify = exports.capitalize = exports.sleep = exports.calculatePagination = exports.sendPaginatedResponse = exports.sendErrorResponse = exports.formatPhoneNumber = exports.sendSuccessResponse = exports.generateUUID = exports.generateRandomString = exports.generateOTP = void 0;
exports.sanitizeDonation = sanitizeDonation;
exports.getMonthRange = getMonthRange;
exports.getCurrentAndLastMonth = getCurrentAndLastMonth;
exports.calculatePercentageChange = calculatePercentageChange;
exports.calculateTrend = calculateTrend;
const crypto_1 = __importDefault(require("crypto"));
const constants_1 = require("./constants");
const logger_1 = __importDefault(require("../logger"));
function sanitizeDonation(donation) {
    if (!donation.isAnonymous)
        return donation;
    return {
        ...donation,
        donorName: null,
        donor: null,
    };
}
const generateOTP = (length = 6) => {
    let otp = "";
    for (let i = 0; i < length; i++) {
        otp += Math.floor(Math.random() * 10).toString();
    }
    return otp;
};
exports.generateOTP = generateOTP;
const generateRandomString = (length = 32) => {
    return crypto_1.default.randomBytes(length).toString("hex");
};
exports.generateRandomString = generateRandomString;
const generateUUID = () => {
    return crypto_1.default.randomUUID();
};
exports.generateUUID = generateUUID;
const sendSuccessResponse = (res, data, message = "Success", statusCode = constants_1.HTTP_STATUS.OK) => {
    const response = {
        success: true,
        message,
        data,
        timestamp: new Date().toISOString(),
        path: res.req.originalUrl,
    };
    return res.status(statusCode).json(response);
};
exports.sendSuccessResponse = sendSuccessResponse;
const formatPhoneNumber = (phone) => {
    let cleaned = phone.replace(/\D/g, "");
    if (cleaned.startsWith("234")) {
        return cleaned;
    }
    if (cleaned.startsWith("0")) {
        cleaned = cleaned.substring(1);
    }
    return "234" + cleaned;
};
exports.formatPhoneNumber = formatPhoneNumber;
const sendErrorResponse = (res, message, statusCode = constants_1.HTTP_STATUS.BAD_REQUEST, error, details) => {
    if (res.headersSent) {
        logger_1.default.info("Headers already sent, cannot send error response");
        return res;
    }
    const response = {
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
exports.sendErrorResponse = sendErrorResponse;
const sendPaginatedResponse = (res, data, pagination, message = "Success") => {
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
    return res.status(constants_1.HTTP_STATUS.OK).json(response);
};
exports.sendPaginatedResponse = sendPaginatedResponse;
function getMonthRange(date) {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
    return { start, end };
}
function getCurrentAndLastMonth() {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return {
        current: getMonthRange(now),
        previous: getMonthRange(lastMonth),
    };
}
function calculatePercentageChange(current, previous) {
    if (previous === 0)
        return current > 0 ? 100 : 0;
    return Number((((current - previous) / previous) * 100).toFixed(2));
}
function calculateTrend(current, previous) {
    if (previous === 0) {
        return {
            value: current > 0 ? 100 : 0,
            direction: current > 0 ? "up" : "flat",
        };
    }
    const raw = ((current - previous) / previous) * 100;
    const value = Number(raw.toFixed(2));
    if (value > 0)
        return { value, direction: "up" };
    if (value < 0)
        return { value: Math.abs(value), direction: "down" };
    return { value: 0, direction: "flat" };
}
const calculatePagination = (totalItems, page, limit) => {
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
exports.calculatePagination = calculatePagination;
const sleep = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};
exports.sleep = sleep;
const capitalize = (str) => {
    return str.replace(/\b\w/g, (char) => char.toUpperCase());
};
exports.capitalize = capitalize;
const slugify = (str) => {
    return str
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
};
exports.slugify = slugify;
const safeJsonParse = (jsonString, defaultValue) => {
    try {
        return JSON.parse(jsonString);
    }
    catch {
        return defaultValue;
    }
};
exports.safeJsonParse = safeJsonParse;
const removeSensitiveFields = (obj, fieldsToRemove = ["password", "refreshToken", "__v"]) => {
    const sanitized = { ...obj };
    fieldsToRemove.forEach((field) => {
        delete sanitized[field];
    });
    return sanitized;
};
exports.removeSensitiveFields = removeSensitiveFields;
const isExpired = (expiryDate) => {
    return new Date() > expiryDate;
};
exports.isExpired = isExpired;
const addTime = (minutes) => {
    const date = new Date();
    date.setMinutes(date.getMinutes() + minutes);
    return date;
};
exports.addTime = addTime;
const formatDuration = (milliseconds) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0)
        return `${days}d ${hours % 24}h`;
    if (hours > 0)
        return `${hours}h ${minutes % 60}m`;
    if (minutes > 0)
        return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
};
exports.formatDuration = formatDuration;
const deepClone = (obj) => {
    return JSON.parse(JSON.stringify(obj));
};
exports.deepClone = deepClone;
const isEmpty = (obj) => {
    if (obj == null)
        return true;
    if (Array.isArray(obj) || typeof obj === "string")
        return obj.length === 0;
    if (typeof obj === "object")
        return Object.keys(obj).length === 0;
    return false;
};
exports.isEmpty = isEmpty;
const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error;
            if (attempt === maxRetries) {
                throw lastError;
            }
            const delay = baseDelay * Math.pow(2, attempt - 1);
            await (0, exports.sleep)(delay);
        }
    }
    throw lastError;
};
exports.retryWithBackoff = retryWithBackoff;
const generatePasswordCrypto = (length = 8) => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const bytes = crypto_1.default.randomBytes(length);
    let password = "";
    for (let i = 0; i < length; i++) {
        password += chars[bytes[i] % chars.length];
    }
    return password;
};
exports.generatePasswordCrypto = generatePasswordCrypto;
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
