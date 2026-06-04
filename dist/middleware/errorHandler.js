"use strict";
// middlewares/errorHandler.ts
// import { Request, Response, NextFunction } from "express";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.AppError = void 0;
const helpers_1 = require("../utils/helpers");
const constants_1 = require("../utils/constants");
class AppError extends Error {
    constructor(message, statusCode = constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR, errorCode = constants_1.ERROR_CODES.INTERNAL_ERROR, details) {
        super(message);
        this.message = message;
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.details = details;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
const errorHandler = (err, req, res, next) => {
    if (err instanceof AppError) {
        return (0, helpers_1.sendErrorResponse)(res, err.message, err.statusCode, err.errorCode, err.details);
    }
    // Mongoose validation error
    if (err.name === 'ValidationError') {
        return (0, helpers_1.sendErrorResponse)(res, 'Validation error', constants_1.HTTP_STATUS.UNPROCESSABLE_ENTITY, constants_1.ERROR_CODES.VALIDATION_ERROR, err.message);
    }
    // Mongoose duplicate key error
    if (err.name === 'MongoServerError' && err.code === 11000) {
        return (0, helpers_1.sendErrorResponse)(res, 'Duplicate entry', constants_1.HTTP_STATUS.CONFLICT, constants_1.ERROR_CODES.DUPLICATE_ENTRY);
    }
    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return (0, helpers_1.sendErrorResponse)(res, 'Invalid token', constants_1.HTTP_STATUS.UNAUTHORIZED, constants_1.ERROR_CODES.INVALID_TOKEN);
    }
    if (err.name === 'TokenExpiredError') {
        return (0, helpers_1.sendErrorResponse)(res, 'Token expired', constants_1.HTTP_STATUS.UNAUTHORIZED, constants_1.ERROR_CODES.TOKEN_EXPIRED);
    }
    // Default error
    console.error('Unhandled error:', err);
    return (0, helpers_1.sendErrorResponse)(res, 'Internal server error', constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR, constants_1.ERROR_CODES.INTERNAL_ERROR);
};
exports.errorHandler = errorHandler;
