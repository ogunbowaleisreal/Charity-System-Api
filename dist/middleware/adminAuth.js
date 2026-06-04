"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.preventSelfModification = exports.canManageAdminLevel = exports.authorize = exports.verifyAdminToken = void 0;
const helpers_1 = require("../utils/helpers");
const constants_1 = require("../utils/constants");
const logger_1 = __importDefault(require("../logger"));
const jwt_1 = __importDefault(require("../utils/admin/jwt"));
const AdminModel_1 = __importDefault(require("../models/AdminModel"));
const verifyAdminToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return (0, helpers_1.sendErrorResponse)(res, "Authorization token required", constants_1.HTTP_STATUS.UNAUTHORIZED, constants_1.ERROR_CODES.TOKEN_REQUIRED);
        }
        const token = authHeader.substring(7);
        // Verify and decode the token
        const decoded = await jwt_1.default.verifyAccessToken(token);
        if (!decoded) {
            return (0, helpers_1.sendErrorResponse)(res, "Invalid or expired token", constants_1.HTTP_STATUS.UNAUTHORIZED, constants_1.ERROR_CODES.TOKEN_INVALID);
        }
        // Check if token is blacklisted
        // const isBlacklisted = await CacheService.isTokenBlacklisted(token);
        // if (isBlacklisted) {
        //     return sendErrorResponse(
        //         res,
        //         "Token has been revoked",
        //         HTTP_STATUS.UNAUTHORIZED,
        //         ERROR_CODES.TOKEN_INVALID
        //     );
        // }
        const currentTime = Math.floor(Date.now() / 1000);
        if (decoded.exp && decoded.exp < currentTime) {
            return (0, helpers_1.sendErrorResponse)(res, "Token has expired", constants_1.HTTP_STATUS.UNAUTHORIZED, constants_1.ERROR_CODES.TOKEN_EXPIRED);
        }
        if (decoded.tokenId) {
            const admin = await AdminModel_1.default.findById(decoded.adminId).select("+activeTokenId +permissions");
            if (!admin) {
                return (0, helpers_1.sendErrorResponse)(res, "Admin not found", constants_1.HTTP_STATUS.UNAUTHORIZED, constants_1.ERROR_CODES.TOKEN_INVALID);
            }
            if (admin.status == "suspended") {
                return (0, helpers_1.sendErrorResponse)(res, "Your account has been suspended. Contact support.", constants_1.HTTP_STATUS.FORBIDDEN, // 403 makes sense for suspended accounts
                constants_1.ERROR_CODES.TOKEN_INVALID);
            }
            if (admin.activeTokenId !== decoded.tokenId) {
                logger_1.default.warn("Invalid session - token not active", {
                    adminId: decoded.adminId,
                    tokenId: decoded.tokenId,
                    activeTokenId: admin.activeTokenId,
                });
                return (0, helpers_1.sendErrorResponse)(res, "Session expired. Please login again.", constants_1.HTTP_STATUS.UNAUTHORIZED, constants_1.ERROR_CODES.TOKEN_INVALID);
            }
            req.admin = {
                id: decoded.id,
                adminId: decoded.adminId,
                email: decoded.email,
                adminLevel: decoded.adminLevel,
                permissions: admin.permissions || [],
            };
        }
        else {
            req.admin = {
                id: decoded.id,
                adminId: decoded.adminId,
                email: decoded.email,
                adminLevel: decoded.adminLevel,
                permissions: [],
            };
        }
        return next();
    }
    catch (error) {
        logger_1.default.error("Admin token verification error:", error);
        return (0, helpers_1.sendErrorResponse)(res, `Token verification failed: ${error}`, constants_1.HTTP_STATUS.UNAUTHORIZED, constants_1.ERROR_CODES.TOKEN_INVALID);
    }
};
exports.verifyAdminToken = verifyAdminToken;
/**
 * Authorization middleware for admin routes
 * Checks if the authenticated admin has the required permissions
 */
const authorize = (requiredPermissions) => {
    return (req, res, next) => {
        try {
            if (!req.admin) {
                return (0, helpers_1.sendErrorResponse)(res, "Authentication required", constants_1.HTTP_STATUS.UNAUTHORIZED);
            }
            const { admin } = req;
            const { permissions = [], adminLevel } = admin;
            // Super admins have all permissions
            if (adminLevel === "super_admin") {
                return next();
            }
            // Check if admin has any of the required permissions
            const hasPermission = requiredPermissions.some((permission) => permissions.includes(permission));
            if (!hasPermission) {
                logger_1.default.warn("Insufficient permissions", {
                    adminId: admin.id,
                    adminLevel: admin.adminLevel,
                    requiredPermissions,
                    adminPermissions: permissions,
                    route: req.route?.path,
                    method: req.method,
                });
                return (0, helpers_1.sendErrorResponse)(res, "Insufficient permissions to access this resource", constants_1.HTTP_STATUS.FORBIDDEN);
            }
            next();
        }
        catch (error) {
            logger_1.default.error("Authorization error", {
                error: error.message,
                adminId: req.admin?.id,
                route: req.route?.path,
            });
            return (0, helpers_1.sendErrorResponse)(res, "Authorization failed", constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    };
};
exports.authorize = authorize;
/**
 * Check if admin can manage specific admin level
 * Super admins can manage all levels
 * Admins can only manage moderators
 * Moderators cannot manage other admins
 */
const canManageAdminLevel = (targetAdminLevel) => {
    return (req, res, next) => {
        try {
            if (!req.admin) {
                return (0, helpers_1.sendErrorResponse)(res, "Authentication required", constants_1.HTTP_STATUS.UNAUTHORIZED);
            }
            const { adminLevel } = req.admin;
            const adminHierarchy = {
                super_admin: ["super_admin", "admin", "moderator"],
                admin: ["moderator"],
                moderator: [],
            };
            const canManage = adminHierarchy[adminLevel]?.includes(targetAdminLevel);
            if (!canManage) {
                logger_1.default.warn("Insufficient level to manage target admin", {
                    adminId: req.admin.id,
                    adminLevel,
                    targetAdminLevel,
                });
                return (0, helpers_1.sendErrorResponse)(res, "Insufficient admin level to perform this action", constants_1.HTTP_STATUS.FORBIDDEN);
            }
            return next();
        }
        catch (error) {
            logger_1.default.error("Admin level check error", {
                error: error.message,
                adminId: req.admin?.id,
            });
            return (0, helpers_1.sendErrorResponse)(res, "Authorization failed", constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    };
};
exports.canManageAdminLevel = canManageAdminLevel;
// Prevent admins from modifying their own account in certain ways
const preventSelfModification = (req, res, next) => {
    try {
        const { adminId } = req.params;
        const currentAdminId = req.admin?.id;
        if (adminId === currentAdminId) {
            return (0, helpers_1.sendErrorResponse)(res, "Cannot perform this action on your own account", constants_1.HTTP_STATUS.FORBIDDEN);
        }
        return next();
    }
    catch (error) {
        logger_1.default.error("Self modification check error", {
            error: error.message,
            adminId: req.admin?.id,
        });
        return (0, helpers_1.sendErrorResponse)(res, "Authorization failed", constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
};
exports.preventSelfModification = preventSelfModification;
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        try {
            if (!req.admin) {
                return (0, helpers_1.sendErrorResponse)(res, "Authentication required", constants_1.HTTP_STATUS.UNAUTHORIZED);
            }
            const { adminLevel } = req.admin;
            if (!allowedRoles.includes(adminLevel)) {
                logger_1.default.warn("Insufficient role", {
                    adminId: req.admin.id,
                    adminLevel,
                    allowedRoles,
                    route: req.route?.path,
                });
                return (0, helpers_1.sendErrorResponse)(res, "Insufficient role to access this resource", constants_1.HTTP_STATUS.FORBIDDEN);
            }
            return next();
        }
        catch (error) {
            logger_1.default.error("Role check error", {
                error: error.message,
                adminId: req.admin?.id,
            });
            return (0, helpers_1.sendErrorResponse)(res, "Authorization failed", constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    };
};
exports.requireRole = requireRole;
