"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.productionLogger = void 0;
const winston_1 = __importDefault(require("winston"));
const winston_daily_rotate_file_1 = __importDefault(require("winston-daily-rotate-file"));
// Production logger configuration
exports.productionLogger = winston_1.default.createLogger({
    level: 'info',
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json()),
    defaultMeta: {
        service: 'vendor-marketplace-api',
        environment: process.env.NODE_ENV,
        version: process.env.npm_package_version || '1.0.0'
    },
    transports: [
        // Console transport (for containerized environments)
        new winston_1.default.transports.Console({
            format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.colorize(), winston_1.default.format.simple())
        }),
        // Daily rotating file for errors
        new winston_daily_rotate_file_1.default({
            filename: 'logs/error-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            level: 'error',
            maxSize: '20m',
            maxFiles: '30d',
            zippedArchive: true,
            format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json())
        }),
        // Daily rotating file for warnings
        new winston_daily_rotate_file_1.default({
            filename: 'logs/warn-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            level: 'warn',
            maxSize: '20m',
            maxFiles: '14d',
            zippedArchive: true,
            format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json())
        }),
        // Daily rotating file for info logs
        new winston_daily_rotate_file_1.default({
            filename: 'logs/info-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            level: 'info',
            maxSize: '20m',
            maxFiles: '7d',
            zippedArchive: true,
            format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json())
        }),
        // Daily rotating file for all logs
        new winston_daily_rotate_file_1.default({
            filename: 'logs/combined-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            maxSize: '50m',
            maxFiles: '14d',
            zippedArchive: true,
            format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json())
        })
    ],
    // Handle uncaught exceptions
    exceptionHandlers: [
        new winston_daily_rotate_file_1.default({
            filename: 'logs/exceptions-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '30d',
            zippedArchive: true
        })
    ],
    // Handle unhandled promise rejections
    rejectionHandlers: [
        new winston_daily_rotate_file_1.default({
            filename: 'logs/rejections-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '30d',
            zippedArchive: true
        })
    ]
});
// Log rotation events
exports.productionLogger.on('rotate', (oldFilename, newFilename) => {
    exports.productionLogger.info(`Log file rotated: ${oldFilename} -> ${newFilename}`);
});
// Log file archiving events
exports.productionLogger.on('archive', (zipFilename) => {
    exports.productionLogger.info(`Log file archived: ${zipFilename}`);
});
// Log file removal events
exports.productionLogger.on('logRemoved', (removedFilename) => {
    exports.productionLogger.info(`Old log file removed: ${removedFilename}`);
});
