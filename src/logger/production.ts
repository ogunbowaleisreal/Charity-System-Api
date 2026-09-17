import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

/**
 * Safely stringify objects with circular references.
 */
function safeStringify(obj: any, space = 2): string {
    const seen = new WeakSet();

    return JSON.stringify(
        obj,
        (key, value) => {
            if (typeof value === "object" && value !== null) {
                if (seen.has(value)) {
                    return "[Circular]";
                }
                seen.add(value);
            }

            return value;
        },
        space
    );
}

/**
 * Winston format to sanitize log objects before they're written.
 */
// const safeFormat = winston.format((info) => {
//     return JSON.parse(safeStringify(info));
// });
const safeFormat = winston.format((info) => {
    for (const key of Object.keys(info)) {
        const value = info[key];

        if (typeof value === "object" && value !== null) {
            try {
                JSON.stringify(value);
            } catch {
                info[key] = safeStringify(value);
            }
        }
    }

    return info;
});

export const productionLogger = winston.createLogger({
    level: "info",

    format: winston.format.combine(
        safeFormat(),
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),

    defaultMeta: {
        service: "vendor-marketplace-api",
        environment: process.env.NODE_ENV,
        version: process.env.npm_package_version || "1.0.0",
    },

    transports: [
        // Console transport
        new winston.transports.Console({
            format: winston.format.combine(
                safeFormat(),
                winston.format.timestamp(),
                winston.format.colorize(),
                winston.format.simple()
            ),
        }),

        // Error logs
        new DailyRotateFile({
            filename: "logs/error-%DATE%.log",
            datePattern: "YYYY-MM-DD",
            level: "error",
            maxSize: "20m",
            maxFiles: "30d",
            zippedArchive: true,
            format: winston.format.combine(
                safeFormat(),
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.json()
            ),
        }),

        // Warning logs
        new DailyRotateFile({
            filename: "logs/warn-%DATE%.log",
            datePattern: "YYYY-MM-DD",
            level: "warn",
            maxSize: "20m",
            maxFiles: "14d",
            zippedArchive: true,
            format: winston.format.combine(
                safeFormat(),
                winston.format.timestamp(),
                winston.format.json()
            ),
        }),

        // Info logs
        new DailyRotateFile({
            filename: "logs/info-%DATE%.log",
            datePattern: "YYYY-MM-DD",
            level: "info",
            maxSize: "20m",
            maxFiles: "7d",
            zippedArchive: true,
            format: winston.format.combine(
                safeFormat(),
                winston.format.timestamp(),
                winston.format.json()
            ),
        }),

        // Combined logs
        new DailyRotateFile({
            filename: "logs/combined-%DATE%.log",
            datePattern: "YYYY-MM-DD",
            maxSize: "50m",
            maxFiles: "14d",
            zippedArchive: true,
            format: winston.format.combine(
                safeFormat(),
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.json()
            ),
        }),
    ],

    exceptionHandlers: [
        new DailyRotateFile({
            filename: "logs/exceptions-%DATE%.log",
            datePattern: "YYYY-MM-DD",
            maxSize: "20m",
            maxFiles: "30d",
            zippedArchive: true,
            format: winston.format.combine(
                safeFormat(),
                winston.format.timestamp(),
                winston.format.json()
            ),
        }),
    ],

    rejectionHandlers: [
        new DailyRotateFile({
            filename: "logs/rejections-%DATE%.log",
            datePattern: "YYYY-MM-DD",
            maxSize: "20m",
            maxFiles: "30d",
            zippedArchive: true,
            format: winston.format.combine(
                safeFormat(),
                winston.format.timestamp(),
                winston.format.json()
            ),
        }),
    ],
});

// Log rotation events
productionLogger.on("rotate", (oldFilename, newFilename) => {
    productionLogger.info(`Log file rotated: ${oldFilename} -> ${newFilename}`);
});

// Log file archiving events
productionLogger.on("archive", (zipFilename) => {
    productionLogger.info(`Log file archived: ${zipFilename}`);
});

// Log file removal events
productionLogger.on("logRemoved", (removedFilename) => {
    productionLogger.info(`Old log file removed: ${removedFilename}`);
});
// import winston from 'winston';
// import DailyRotateFile from 'winston-daily-rotate-file';

// // Production logger configuration
// export const productionLogger = winston.createLogger({
//     level: 'info',
//     format: winston.format.combine(
//         winston.format.timestamp(),
//         winston.format.errors({ stack: true }),
//         winston.format.json()
//     ),
//     defaultMeta: {
//         service: 'vendor-marketplace-api',
//         environment: process.env.NODE_ENV,
//         version: process.env.npm_package_version || '1.0.0'
//     },
//     transports: [
//         // Console transport (for containerized environments)
//         new winston.transports.Console({
//             format: winston.format.combine(
//                 winston.format.timestamp(),
//                 winston.format.colorize(),
//                 winston.format.simple()
//             )
//         }),

//         // Daily rotating file for errors
//         new DailyRotateFile({
//             filename: 'logs/error-%DATE%.log',
//             datePattern: 'YYYY-MM-DD',
//             level: 'error',
//             maxSize: '20m',
//             maxFiles: '30d',
//             zippedArchive: true,
//             format: winston.format.combine(
//                 winston.format.timestamp(),
//                 winston.format.errors({ stack: true }),
//                 winston.format.json()
//             )
//         }),

//         // Daily rotating file for warnings
//         new DailyRotateFile({
//             filename: 'logs/warn-%DATE%.log',
//             datePattern: 'YYYY-MM-DD',
//             level: 'warn',
//             maxSize: '20m',
//             maxFiles: '14d',
//             zippedArchive: true,
//             format: winston.format.combine(
//                 winston.format.timestamp(),
//                 winston.format.json()
//             )
//         }),

//         // Daily rotating file for info logs
//         new DailyRotateFile({
//             filename: 'logs/info-%DATE%.log',
//             datePattern: 'YYYY-MM-DD',
//             level: 'info',
//             maxSize: '20m',
//             maxFiles: '7d',
//             zippedArchive: true,
//             format: winston.format.combine(
//                 winston.format.timestamp(),
//                 winston.format.json()
//             )
//         }),

//         // Daily rotating file for all logs
//         new DailyRotateFile({
//             filename: 'logs/combined-%DATE%.log',
//             datePattern: 'YYYY-MM-DD',
//             maxSize: '50m',
//             maxFiles: '14d',
//             zippedArchive: true,
//             format: winston.format.combine(
//                 winston.format.timestamp(),
//                 winston.format.errors({ stack: true }),
//                 winston.format.json()
//             )
//         })
//     ],

//     // Handle uncaught exceptions
//     exceptionHandlers: [
//         new DailyRotateFile({
//             filename: 'logs/exceptions-%DATE%.log',
//             datePattern: 'YYYY-MM-DD',
//             maxSize: '20m',
//             maxFiles: '30d',
//             zippedArchive: true
//         })
//     ],

//     // Handle unhandled promise rejections
//     rejectionHandlers: [
//         new DailyRotateFile({
//             filename: 'logs/rejections-%DATE%.log',
//             datePattern: 'YYYY-MM-DD',
//             maxSize: '20m',
//             maxFiles: '30d',
//             zippedArchive: true
//         })
//     ]
// });

// // Log rotation events
// productionLogger.on('rotate', (oldFilename, newFilename) => {
//     productionLogger.info(`Log file rotated: ${oldFilename} -> ${newFilename}`);
// });

// // Log file archiving events
// productionLogger.on('archive', (zipFilename) => {
//     productionLogger.info(`Log file archived: ${zipFilename}`);
// });

// // Log file removal events
// productionLogger.on('logRemoved', (removedFilename) => {
//     productionLogger.info(`Old log file removed: ${removedFilename}`);
// });