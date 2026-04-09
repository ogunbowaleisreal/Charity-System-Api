import winston from 'winston';

// Development logger configuration
export const developmentLogger = winston.createLogger({
    level: 'debug',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
            let log = `${timestamp} [${level}]: ${message}`;

            if (stack) {
                log += `\n${stack}`;
            }

            if (Object.keys(meta).length > 0) {
                log += `\n${JSON.stringify(meta, null, 2)}`;
            }

            return log;
        })
    ),
    transports: [
        // Console transport for development
        new winston.transports.Console({
            handleExceptions: true,
            handleRejections: true
        }),

        // File transport for errors
        new winston.transports.File({
            filename: 'logs/development-error.log',
            level: 'error',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.json()
            )
        }),

        // File transport for all logs
        new winston.transports.File({
            filename: 'logs/development-combined.log',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.json()
            )
        })
    ],

    // Handle uncaught exceptions
    exceptionHandlers: [
        new winston.transports.File({ filename: 'logs/development-exceptions.log' })
    ],

    // Handle unhandled promise rejections
    rejectionHandlers: [
        new winston.transports.File({ filename: 'logs/development-rejections.log' })
    ]
});