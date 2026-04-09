import { redisClient } from "../config/redis";
import { CACHE_KEYS, CACHE_TTL } from "../utils/constants";
import logger from "../logger";
import adminJwtUtil from "../utils/admin/jwt";
import jwtUtil from "../utils/jwt";

export class CacheService {
    static async set(key: string, value: any, ttl?: number): Promise<void> {
        try {
            const serializedValue = JSON.stringify(value);

            if (ttl) {
                await redisClient.setEx(key, ttl, serializedValue);
            } else {
                await redisClient.set(key, serializedValue);
            }

            logger.debug(`Cache SET: ${key}`, { ttl });
        } catch (error) {
            logger.error("Cache SET error:", error);
            throw error;
        }
    }

    static async get<T>(key: string): Promise<T | null> {
        try {
            const value = await redisClient.get(key);

            if (!value) {
                logger.debug(`Cache MISS: ${key}`);
                return null;
            }

            logger.debug(`Cache HIT: ${key}`);
            return JSON.parse(value) as T;
        } catch (error) {
            logger.error("Cache GET error:", error);
            return null;
        }
    }

    static async delete(key: string): Promise<void> {
        try {
            await redisClient.del(key);
            logger.debug(`Cache DELETE: ${key}`);
        } catch (error) {
            logger.error("Cache DELETE error:", error);
        }
    }

    static async exists(key: string): Promise<boolean> {
        try {
            const exists = await redisClient.exists(key);
            return exists === 1;
        } catch (error) {
            logger.error("Cache EXISTS error:", error);
            return false;
        }
    }

    static async expire(key: string, ttl: number): Promise<void> {
        try {
            await redisClient.expire(key, ttl);
            logger.debug(`Cache EXPIRE: ${key}`, { ttl });
        } catch (error) {
            logger.error("Cache EXPIRE error:", error);
        }
    }

    static async ttl(key: string): Promise<number> {
        try {
            return await redisClient.ttl(key);
        } catch (error) {
            logger.error("Cache TTL error:", error);
            return -1;
        }
    }

    static async deletePattern(pattern: string): Promise<void> {
        try {
            const keys = await redisClient.keys(pattern);
            if (keys.length > 0) {
                await redisClient.del(keys);
                logger.debug(`Cache DELETE PATTERN: ${pattern}`, {
                    deletedCount: keys.length,
                });
            }
        } catch (error) {
            logger.error("Cache DELETE PATTERN error:", error);
        }
    }

    static async increment(key: string, by: number = 1): Promise<number> {
        try {
            return await redisClient.incrBy(key, by);
        } catch (error) {
            logger.error("Cache INCREMENT error:", error);
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

    static async setOTP(
        email: string,
        otp: string,
        type: "registration" | "password_reset"
    ): Promise<void> {
        const key =
            type === "registration"
                ? CACHE_KEYS.OTP_REGISTRATION(email)
                : CACHE_KEYS.OTP_PASSWORD_RESET(email);

        await this.set(key, { otp, timestamp: Date.now() }, CACHE_TTL.OTP);
    }

    static async getOTP(
        email: string,
        type: "registration" | "password_reset"
    ): Promise<{ otp: string; timestamp: number } | null> {
        const key =
            type === "registration"
                ? CACHE_KEYS.OTP_REGISTRATION(email)
                : CACHE_KEYS.OTP_PASSWORD_RESET(email);

        return await this.get<{ otp: string; timestamp: number }>(key);
    }

    static async deleteOTP(
        email: string,
        type: "registration" | "password_reset"
    ): Promise<void> {
        const key =
            type === "registration"
                ? CACHE_KEYS.OTP_REGISTRATION(email)
                : CACHE_KEYS.OTP_PASSWORD_RESET(email);

        await this.delete(key);
    }

    static async setUserProfile(userId: string, profile: any): Promise<void> {
        const key = CACHE_KEYS.USER_PROFILE(userId);
        await this.set(key, profile, CACHE_TTL.USER_PROFILE);
    }

    static async getUserProfile(userId: string): Promise<any | null> {
        const key = CACHE_KEYS.USER_PROFILE(userId);
        return await this.get(key);
    }

    static async deleteUserProfile(userId: string): Promise<void> {
        const key = CACHE_KEYS.USER_PROFILE(userId);
        await this.delete(key);
    }

    static async setRefreshToken(tokenId: string, tokenData: any): Promise<void> {
        const key = CACHE_KEYS.REFRESH_TOKEN(tokenId);
        await this.set(key, tokenData, CACHE_TTL.REFRESH_TOKEN);
    }

    static async getRefreshToken(tokenId: string): Promise<any | null> {
        const key = CACHE_KEYS.REFRESH_TOKEN(tokenId);
        return await this.get(key);
    }

    static async deleteRefreshToken(tokenId: string): Promise<void> {
        const key = CACHE_KEYS.REFRESH_TOKEN(tokenId);
        await this.delete(key);
    }

    static async blacklistToken(token: string): Promise<void> {
        const decoded = adminJwtUtil.decodeToken(token);

        // Determine which identifier to use
        const id = decoded?.adminId || decoded?.userId;

        if (id && decoded?.iat) {
            const tokenId = `${id}_${decoded.iat}`;
            const key = CACHE_KEYS.BLACKLISTED_TOKEN(tokenId);

            await this.set(
                key,
                { blacklisted: true, timestamp: Date.now() },
                CACHE_TTL.BLACKLISTED_TOKEN
            );
        }
    }

    static async blacklistResetToken(token: string): Promise<void> {
        const decoded = jwtUtil.decodeToken(token);
        if (decoded?.email && decoded?.iat) {
            const tokenId = `${decoded.email}_${decoded.iat}`;
            const key = CACHE_KEYS.BLACKLISTED_RESET_TOKEN(tokenId);
            await this.set(
                key,
                { blacklisted: true, timestamp: Date.now() },
                CACHE_TTL.RESET_TOKEN
            );
        }
    }

    static async isResetTokenBlacklisted(token: string): Promise<boolean> {
        const decoded = jwtUtil.decodeToken(token);

        if (decoded?.email && decoded?.iat) {
            const tokenId = `${decoded.email}_${decoded.iat}`;
            const key = CACHE_KEYS.BLACKLISTED_RESET_TOKEN(tokenId);
            return await this.exists(key);
        }

        return false;
    }

    static async isTokenBlacklisted(token: string): Promise<boolean> {
        const decoded = adminJwtUtil.decodeToken(token);

        // Determine which identifier to use
        const id = decoded?.adminId || decoded?.userId;

        if (id && decoded?.iat) {
            const tokenId = `${id}_${decoded.iat}`;
            const key = CACHE_KEYS.BLACKLISTED_TOKEN(tokenId);
            return await this.exists(key);
        }

        return false;
    }

    static async incrementLoginAttempts(email: string): Promise<number> {
        const key = CACHE_KEYS.LOGIN_ATTEMPTS(email);
        const attempts = await this.increment(key);

        if (attempts === 1) {
            await this.expire(key, CACHE_TTL.LOGIN_ATTEMPTS);
        }

        return attempts;
    }

    static async getLoginAttempts(email: string): Promise<number> {
        const key = CACHE_KEYS.LOGIN_ATTEMPTS(email);
        const attempts = await this.get<number>(key);
        return attempts || 0;
    }

    static async resetLoginAttempts(email: string): Promise<void> {
        const key = CACHE_KEYS.LOGIN_ATTEMPTS(email);
        await this.delete(key);
    }

    static async incrementOTPAttempts(
        email: string,
        type: string
    ): Promise<number> {
        const key = CACHE_KEYS.OTP_ATTEMPTS(email, type);
        const attempts = await this.increment(key);

        if (attempts === 1) {
            await this.expire(key, CACHE_TTL.OTP_ATTEMPTS);
        }

        return attempts;
    }

    static async getOTPAttempts(email: string, type: string): Promise<number> {
        const key = CACHE_KEYS.OTP_ATTEMPTS(email, type);
        const attempts = await this.get<number>(key);
        return attempts || 0;
    }

    static async clearAll(): Promise<void> {
        try {
            await redisClient.flushAll();
            logger.info("Cache cleared successfully");
        } catch (error) {
            logger.error("Cache clear error:", error);
            throw error;
        }
    }

    static async getStats(): Promise<any> {
        try {
            const info = await redisClient.info();
            return info;
        } catch (error) {
            logger.error("Cache stats error:", error);
            return null;
        }
    }
}

export default CacheService;
