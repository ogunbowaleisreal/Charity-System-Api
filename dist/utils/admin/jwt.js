"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminJwtUtil = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const logger_1 = __importDefault(require("../../logger"));
const cacheServices_1 = __importDefault(require("../../services/cacheServices"));
class AdminJWTUtil {
    constructor() {
        this.config = {
            accessSecret: process.env.JWT_ADMIN_ACCESS_SECRET || "admin-access-secret-pokkjsu-8ujSd3",
            refreshSecret: process.env.JWT_ADMIN_REFRESH_SECRET || "admin-refresh-secret-pokkjsu-8ujSd3",
            accessExpiresIn: process.env.JWT_ADMIN_ACCESS_EXPIRES_IN || "15m",
            refreshExpiresIn: process.env.JWT_ADMIN_REFRESH_EXPIRES_IN || "7d",
        };
    }
    generateAccessToken(payload) {
        const jwtPayload = {
            id: payload.adminId,
            adminId: payload.adminId,
            email: payload.email,
            adminLevel: payload.adminLevel,
            tokenId: payload.tokenId,
            generation: payload.generation || 0,
        };
        return jsonwebtoken_1.default.sign(jwtPayload, this.config.accessSecret, {
            expiresIn: this.config.accessExpiresIn,
            issuer: "pelbliss-admin",
            audience: "pelbliss-admin-client",
        });
    }
    generateRefreshToken(payload) {
        const tokenId = (0, uuid_1.v4)();
        const family = payload.family || (0, uuid_1.v4)();
        const generation = (payload.generation || 0) + 1;
        const refreshPayload = {
            adminId: payload.adminId,
            tokenId,
            deviceInfo: payload.deviceInfo,
            generation,
            family,
        };
        const token = jsonwebtoken_1.default.sign(refreshPayload, this.config.refreshSecret, {
            expiresIn: this.config.refreshExpiresIn,
            issuer: "pelbliss-admin",
            audience: "pelbliss-admin-refresh",
        });
        return { token, tokenId, family, generation };
    }
    generateTokenPair(payload) {
        const refreshTokenData = this.generateRefreshToken({
            adminId: payload.adminId,
            deviceInfo: payload.deviceInfo,
            generation: payload.generation,
            family: payload.family,
        });
        const accessToken = this.generateAccessToken({
            adminId: payload.adminId,
            email: payload.email,
            adminLevel: payload.adminLevel,
            tokenId: refreshTokenData.tokenId,
            generation: refreshTokenData.generation,
        });
        const expiresIn = this.getTokenExpirationTime(this.config.accessExpiresIn);
        return {
            accessToken,
            refreshToken: refreshTokenData.token,
            tokenId: refreshTokenData.tokenId,
            family: refreshTokenData.family,
            generation: refreshTokenData.generation,
            expiresIn,
        };
    }
    verifyAccessToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, this.config.accessSecret);
            return decoded;
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                throw new Error("ADMIN_ACCESS_TOKEN_EXPIRED");
            }
            else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                throw new Error("ADMIN_ACCESS_TOKEN_INVALID");
            }
            throw new Error("ADMIN_ACCESS_TOKEN_VERIFICATION_FAILED");
        }
    }
    verifyRefreshToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, this.config.refreshSecret);
            return decoded;
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                throw new Error("ADMIN_REFRESH_TOKEN_EXPIRED");
            }
            else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                throw new Error("ADMIN_REFRESH_TOKEN_INVALID");
            }
            throw new Error("ADMIN_REFRESH_TOKEN_VERIFICATION_FAILED");
        }
    }
    async markTokenAsUsed(tokenId) {
        const key = `admin:refresh_used:${tokenId}`;
        await cacheServices_1.default.set(key, { used: true, timestamp: Date.now() }, this.getTokenExpirationTime(this.config.refreshExpiresIn));
        logger_1.default.info(`Admin refresh token marked as used: ${tokenId}`);
    }
    async isTokenUsed(tokenId) {
        const key = `admin:refresh_used:${tokenId}`;
        return await cacheServices_1.default.exists(key);
    }
    async invalidateTokenFamily(family, adminId) {
        const pattern = `admin:refresh_token:${adminId}:${family}:*`;
        await cacheServices_1.default.deletePattern(pattern);
        const blacklistKey = `admin:blacklist_family:${family}`;
        await cacheServices_1.default.set(blacklistKey, {
            blacklisted: true,
            timestamp: Date.now(),
            adminId,
        }, this.getTokenExpirationTime(this.config.refreshExpiresIn));
        logger_1.default.warn(`Admin token family invalidated: ${family} for admin: ${adminId}`);
    }
    async isTokenFamilyBlacklisted(family) {
        const key = `admin:blacklist_family:${family}`;
        return await cacheServices_1.default.exists(key);
    }
    async storeRefreshTokenMetadata(tokenId, adminId, family, generation, metadata = {}) {
        const key = `admin:refresh_token:${adminId}:${family}:${generation}`;
        await cacheServices_1.default.set(key, {
            tokenId,
            adminId,
            family,
            generation,
            createdAt: Date.now(),
            ...metadata,
        }, this.getTokenExpirationTime(this.config.refreshExpiresIn));
    }
    async getRefreshTokenMetadata(adminId, family, generation) {
        const key = `admin:refresh_token:${adminId}:${family}:${generation}`;
        return await cacheServices_1.default.get(key);
    }
    async detectTokenReuse(decoded) {
        if (await this.isTokenUsed(decoded.tokenId)) {
            logger_1.default.warn(`Admin refresh token reuse detected`, {
                adminId: decoded.adminId,
                tokenId: decoded.tokenId,
                family: decoded.family,
                generation: decoded.generation,
            });
            return true;
        }
        if (await this.isTokenFamilyBlacklisted(decoded.family)) {
            logger_1.default.warn(`Admin blacklisted token family used`, {
                adminId: decoded.adminId,
                family: decoded.family,
            });
            return true;
        }
        return false;
    }
    async handleSuspiciousActivity(decoded) {
        await this.invalidateTokenFamily(decoded.family, decoded.adminId);
        // Log security incident
        logger_1.default.error(`Security incident: Admin refresh token abuse detected`, {
            adminId: decoded.adminId,
            tokenId: decoded.tokenId,
            family: decoded.family,
            generation: decoded.generation,
            timestamp: Date.now(),
        });
        // TODO: Implement additional security measures
        // - Email notification to admin
        // - Temporary account lock
        // - Force password reset
    }
    decodeToken(token) {
        try {
            return jsonwebtoken_1.default.decode(token);
        }
        catch (error) {
            return null;
        }
    }
    extractTokenFromHeader(authHeader) {
        if (!authHeader)
            return null;
        const parts = authHeader.split(" ");
        if (parts.length !== 2 || parts[0] !== "Bearer")
            return null;
        return parts[1];
    }
    getTokenExpirationTime(expiresIn) {
        const match = expiresIn.match(/^(\d+)([smhd])$/);
        if (!match)
            return 900;
        const value = parseInt(match[1]);
        const unit = match[2];
        switch (unit) {
            case "s":
                return value;
            case "m":
                return value * 60;
            case "h":
                return value * 60 * 60;
            case "d":
                return value * 24 * 60 * 60;
            default:
                return 900;
        }
    }
    isTokenExpired(token) {
        try {
            const decoded = jsonwebtoken_1.default.decode(token);
            if (!decoded || !decoded.exp)
                return true;
            const currentTime = Math.floor(Date.now() / 1000);
            return decoded.exp < currentTime;
        }
        catch (error) {
            return true;
        }
    }
    getTimeUntilExpiration(token) {
        try {
            const decoded = jsonwebtoken_1.default.decode(token);
            if (!decoded || !decoded.exp)
                return 0;
            const currentTime = Math.floor(Date.now() / 1000);
            return Math.max(0, decoded.exp - currentTime);
        }
        catch (error) {
            return 0;
        }
    }
    isSuperAdmin(payload) {
        return payload.adminLevel === "super_admin";
    }
}
exports.adminJwtUtil = new AdminJWTUtil();
exports.default = exports.adminJwtUtil;
