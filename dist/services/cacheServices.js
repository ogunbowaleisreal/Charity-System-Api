"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheService = void 0;
const redis_1 = require("../config/redis");
const constants_1 = require("../utils/constants");
const logger_1 = __importDefault(require("../logger"));
const jwt_1 = __importDefault(require("../utils/admin/jwt"));
const jwt_2 = __importDefault(require("../utils/jwt"));
class CacheService {
    static async set(key, value, ttl) {
        try {
            const serializedValue = JSON.stringify(value);
            if (ttl) {
                await redis_1.redisClient.setEx(key, ttl, serializedValue);
            }
            else {
                await redis_1.redisClient.set(key, serializedValue);
            }
            logger_1.default.debug(`Cache SET: ${key}`, { ttl });
        }
        catch (error) {
            logger_1.default.error("Cache SET error:", error);
            throw error;
        }
    }
    static async get(key) {
        try {
            const value = await redis_1.redisClient.get(key);
            if (!value) {
                logger_1.default.debug(`Cache MISS: ${key}`);
                return null;
            }
            logger_1.default.debug(`Cache HIT: ${key}`);
            return JSON.parse(value);
        }
        catch (error) {
            logger_1.default.error("Cache GET error:", error);
            return null;
        }
    }
    static async delete(key) {
        try {
            await redis_1.redisClient.del(key);
            logger_1.default.debug(`Cache DELETE: ${key}`);
        }
        catch (error) {
            logger_1.default.error("Cache DELETE error:", error);
        }
    }
    static async exists(key) {
        try {
            const exists = await redis_1.redisClient.exists(key);
            return exists === 1;
        }
        catch (error) {
            logger_1.default.error("Cache EXISTS error:", error);
            return false;
        }
    }
    static async expire(key, ttl) {
        try {
            await redis_1.redisClient.expire(key, ttl);
            logger_1.default.debug(`Cache EXPIRE: ${key}`, { ttl });
        }
        catch (error) {
            logger_1.default.error("Cache EXPIRE error:", error);
        }
    }
    static async ttl(key) {
        try {
            return await redis_1.redisClient.ttl(key);
        }
        catch (error) {
            logger_1.default.error("Cache TTL error:", error);
            return -1;
        }
    }
    static async deletePattern(pattern) {
        try {
            const keys = await redis_1.redisClient.keys(pattern);
            if (keys.length > 0) {
                await redis_1.redisClient.del(keys);
                logger_1.default.debug(`Cache DELETE PATTERN: ${pattern}`, {
                    deletedCount: keys.length,
                });
            }
        }
        catch (error) {
            logger_1.default.error("Cache DELETE PATTERN error:", error);
        }
    }
    static async increment(key, by = 1) {
        try {
            return await redis_1.redisClient.incrBy(key, by);
        }
        catch (error) {
            logger_1.default.error("Cache INCREMENT error:", error);
            throw error;
        }
    }
    //   static async setNX(key: string, value: any, ttl?: number): Promise<boolean> {
    //     try {
    //       const serializedValue = JSON.stringify(value);
    //       if (ttl) {
    //         const result = await redisClient.set(key, serializedValue, {
    //           NX: true,
    //           EX: ttl,
    //         });
    //         return result === "OK";
    //       } else {
    //         const result = await redisClient.setNX(key, serializedValue);
    //         return result;
    //       }
    //     } catch (error) {
    //       logger.error("Cache SETNX error:", error);
    //       return false;
    //     }
    //   }
    // Specialized cache methods for common operations
    static async setOTP(email, otp, type) {
        const key = type === "registration"
            ? constants_1.CACHE_KEYS.OTP_REGISTRATION(email)
            : constants_1.CACHE_KEYS.OTP_PASSWORD_RESET(email);
        await this.set(key, { otp, timestamp: Date.now() }, constants_1.CACHE_TTL.OTP);
    }
    static async getOTP(email, type) {
        const key = type === "registration"
            ? constants_1.CACHE_KEYS.OTP_REGISTRATION(email)
            : constants_1.CACHE_KEYS.OTP_PASSWORD_RESET(email);
        return await this.get(key);
    }
    static async deleteOTP(email, type) {
        const key = type === "registration"
            ? constants_1.CACHE_KEYS.OTP_REGISTRATION(email)
            : constants_1.CACHE_KEYS.OTP_PASSWORD_RESET(email);
        await this.delete(key);
    }
    static async setUserProfile(userId, profile) {
        const key = constants_1.CACHE_KEYS.USER_PROFILE(userId);
        await this.set(key, profile, constants_1.CACHE_TTL.USER_PROFILE);
    }
    static async getUserProfile(userId) {
        const key = constants_1.CACHE_KEYS.USER_PROFILE(userId);
        return await this.get(key);
    }
    static async deleteUserProfile(userId) {
        const key = constants_1.CACHE_KEYS.USER_PROFILE(userId);
        await this.delete(key);
    }
    static async setRefreshToken(tokenId, tokenData) {
        const key = constants_1.CACHE_KEYS.REFRESH_TOKEN(tokenId);
        await this.set(key, tokenData, constants_1.CACHE_TTL.REFRESH_TOKEN);
    }
    static async getRefreshToken(tokenId) {
        const key = constants_1.CACHE_KEYS.REFRESH_TOKEN(tokenId);
        return await this.get(key);
    }
    static async deleteRefreshToken(tokenId) {
        const key = constants_1.CACHE_KEYS.REFRESH_TOKEN(tokenId);
        await this.delete(key);
    }
    static async blacklistToken(token) {
        const decoded = jwt_1.default.decodeToken(token);
        // Determine which identifier to use
        const id = decoded?.adminId || decoded?.userId;
        if (id && decoded?.iat) {
            const tokenId = `${id}_${decoded.iat}`;
            const key = constants_1.CACHE_KEYS.BLACKLISTED_TOKEN(tokenId);
            await this.set(key, { blacklisted: true, timestamp: Date.now() }, constants_1.CACHE_TTL.BLACKLISTED_TOKEN);
        }
    }
    static async blacklistResetToken(token) {
        const decoded = jwt_2.default.decodeToken(token);
        if (decoded?.email && decoded?.iat) {
            const tokenId = `${decoded.email}_${decoded.iat}`;
            const key = constants_1.CACHE_KEYS.BLACKLISTED_RESET_TOKEN(tokenId);
            await this.set(key, { blacklisted: true, timestamp: Date.now() }, constants_1.CACHE_TTL.RESET_TOKEN);
        }
    }
    static async isResetTokenBlacklisted(token) {
        const decoded = jwt_2.default.decodeToken(token);
        if (decoded?.email && decoded?.iat) {
            const tokenId = `${decoded.email}_${decoded.iat}`;
            const key = constants_1.CACHE_KEYS.BLACKLISTED_RESET_TOKEN(tokenId);
            return await this.exists(key);
        }
        return false;
    }
    static async isTokenBlacklisted(token) {
        const decoded = jwt_1.default.decodeToken(token);
        // Determine which identifier to use
        const id = decoded?.adminId || decoded?.userId;
        if (id && decoded?.iat) {
            const tokenId = `${id}_${decoded.iat}`;
            const key = constants_1.CACHE_KEYS.BLACKLISTED_TOKEN(tokenId);
            return await this.exists(key);
        }
        return false;
    }
    static async incrementLoginAttempts(email) {
        const key = constants_1.CACHE_KEYS.LOGIN_ATTEMPTS(email);
        const attempts = await this.increment(key);
        if (attempts === 1) {
            await this.expire(key, constants_1.CACHE_TTL.LOGIN_ATTEMPTS);
        }
        return attempts;
    }
    static async getLoginAttempts(email) {
        const key = constants_1.CACHE_KEYS.LOGIN_ATTEMPTS(email);
        const attempts = await this.get(key);
        return attempts || 0;
    }
    static async resetLoginAttempts(email) {
        const key = constants_1.CACHE_KEYS.LOGIN_ATTEMPTS(email);
        await this.delete(key);
    }
    static async incrementOTPAttempts(email, type) {
        const key = constants_1.CACHE_KEYS.OTP_ATTEMPTS(email, type);
        const attempts = await this.increment(key);
        if (attempts === 1) {
            await this.expire(key, constants_1.CACHE_TTL.OTP_ATTEMPTS);
        }
        return attempts;
    }
    static async getOTPAttempts(email, type) {
        const key = constants_1.CACHE_KEYS.OTP_ATTEMPTS(email, type);
        const attempts = await this.get(key);
        return attempts || 0;
    }
    static async clearAll() {
        try {
            await redis_1.redisClient.flushAll();
            logger_1.default.info("Cache cleared successfully");
        }
        catch (error) {
            logger_1.default.error("Cache clear error:", error);
            throw error;
        }
    }
    static async getStats() {
        try {
            const info = await redis_1.redisClient.info();
            return info;
        }
        catch (error) {
            logger_1.default.error("Cache stats error:", error);
            return null;
        }
    }
}
exports.CacheService = CacheService;
exports.default = CacheService;
