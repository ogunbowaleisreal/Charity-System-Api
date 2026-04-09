// middlewares/errorHandler.ts
import { Request, Response, NextFunction } from "express";

export function errorHandler(
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) {
    console.error("🔥 ERROR:", err);

    const statusCode = err.statusCode || 500;

    // Standard error response format
    res.status(statusCode).json({
        success: false,
        message: err.message || "Internal server error",
        // Only show stack trace in development:
        ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
    });
}
