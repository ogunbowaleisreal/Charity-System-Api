"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OTPService = void 0;
const OTP_1 = require("../models/OTP");
const cacheServices_1 = require("../services/cacheServices");
const constants_1 = require("../utils/constants");
const logger_1 = __importDefault(require("../logger"));
const ResesndServices_1 = require("./ResesndServices");
class OTPService {
    constructor() {
        this.emailService = new ResesndServices_1.ResendEmailService();
    }
    // private resendEmailService = new ResendEmailService();
    async generateAndSendOTP(email, type) {
        try {
            // Generate 6-digit OTP
            const otp = this.generateOTP();
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
            // Delete any existing OTP for this email and type
            await OTP_1.OTP.deleteMany({ email, type });
            // Create new OTP record
            const otpRecord = new OTP_1.OTP({
                email,
                otp,
                type,
                expiresAt,
                attempts: 0,
            });
            await otpRecord.save();
            // Cache OTP in Redis for faster lookup
            const cacheKey = `otp:${type}:${email}`;
            await cacheServices_1.CacheService.set(cacheKey, {
                otp,
                attempts: 0,
                expiresAt: expiresAt.toISOString(),
            }, 600); // 10 minutes
            // Send OTP via email
            await this.emailService.sendOTPEmail(email, otp, type);
            logger_1.default.info("OTP generated and sent", { email, type });
        }
        catch (error) {
            logger_1.default.error("Failed to generate and send OTP", { email, type, error });
            throw new Error("Failed to send OTP");
        }
    }
    async verifyOTP(email, otp, type) {
        try {
            // Check cache first
            const cacheKey = `otp:${type}:${email}`;
            const cachedOTP = await cacheServices_1.CacheService.get(cacheKey);
            if (cachedOTP && cachedOTP.otp === otp) {
                // OTP is valid, remove from cache and database
                await cacheServices_1.CacheService.delete(cacheKey);
                await OTP_1.OTP.deleteMany({ email, type });
                logger_1.default.info("OTP verified successfully from cache", { email, type });
                return true;
            }
            // Check database if not in cache or cache miss
            const otpRecord = await OTP_1.OTP.findOne({ email, type }).sort({
                createdAt: -1,
            });
            if (!otpRecord) {
                throw { message: "Invalid Otp", statusCode: constants_1.HTTP_STATUS.NOT_FOUND };
            }
            // Check if OTP is expired
            if (otpRecord.expiresAt < new Date()) {
                await OTP_1.OTP.deleteMany({ email, type });
                await cacheServices_1.CacheService.delete(cacheKey);
                throw {
                    message: "OTP has expired",
                    statusCode: constants_1.HTTP_STATUS.BAD_REQUEST,
                };
            }
            // Check if too many attempts
            if (otpRecord.attempts >= 3) {
                await OTP_1.OTP.deleteMany({ email, type });
                await cacheServices_1.CacheService.delete(cacheKey);
                throw {
                    message: "Too many invalid attempts",
                    statusCode: constants_1.HTTP_STATUS.TOO_MANY_REQUESTS,
                };
            }
            // Verify OTP
            if (otpRecord.otp !== otp) {
                otpRecord.attempts += 1;
                await otpRecord.save();
                // Update cache
                if (cachedOTP) {
                    cachedOTP.attempts = otpRecord.attempts;
                    await cacheServices_1.CacheService.set(cacheKey, cachedOTP, 600);
                }
                throw { message: "Invalid OTP", statusCode: constants_1.HTTP_STATUS.BAD_REQUEST };
            }
            // OTP is valid, clean up
            await OTP_1.OTP.deleteMany({ email, type });
            await cacheServices_1.CacheService.delete(cacheKey);
            logger_1.default.info("OTP verified successfully from database", { email, type });
            return true;
        }
        catch (error) {
            logger_1.default.error("OTP verification failed", {
                email,
                type,
                error: error.message,
            });
            return false;
        }
    }
    async isOTPValid(email, type) {
        try {
            // Check cache first
            const cacheKey = `otp:${type}:${email}`;
            const cachedOTP = await cacheServices_1.CacheService.get(cacheKey);
            if (cachedOTP) {
                const expiresAt = new Date(cachedOTP.expiresAt);
                return expiresAt > new Date() && cachedOTP.attempts < 3;
            }
            // Check database
            const otpRecord = await OTP_1.OTP.findOne({ email, type }).sort({
                createdAt: -1,
            });
            return otpRecord
                ? otpRecord.expiresAt > new Date() && otpRecord.attempts < 3
                : false;
        }
        catch (error) {
            logger_1.default.error("Failed to check OTP validity", { email, type, error });
            return false;
        }
    }
    generateOTP() {
        // Generate 6-digit numeric OTP
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
    async cleanupExpiredOTPs() {
        try {
            const result = await OTP_1.OTP.deleteMany({
                expiresAt: { $lt: new Date() },
            });
            if (result.deletedCount > 0) {
                logger_1.default.info("Cleaned up expired OTPs", { count: result.deletedCount });
            }
        }
        catch (error) {
            logger_1.default.error("Failed to cleanup expired OTPs", { error });
        }
    }
}
exports.OTPService = OTPService;
exports.default = OTPService;
// import { generateOTP, hashOTP } from "../utils/hash.utils"
// import { redisClient } from "../config/redis";
// import EmailService from "./Email.services";
// const emailService = new EmailService()
// export class OTPService {
//     createSendAndStoreOTP = async (email: string) => {
//         // OTP service methods would go here
//         const otp = generateOTP(6);
//         const hashedOtp = hashOTP(otp);
//         const ttl = 5 * 60; // 5 minutes in seconds
//         // Store hashed OTP in Redis with TTL
//         redisClient.setEx(`otp:${hashedOtp}`, ttl, 'valid');
//         await emailService.sendOTPEmail(email, otp, "registration")
//         // TODO: create email or sms service to send OTP to user
//     }
//     verifyOTP = async (otp: string): Promise<boolean> => {
//         const hashedOtp = hashOTP(otp);
//         const storedOtp = await redisClient.get(`otp:${hashedOtp}`);
//         return storedOtp == hashedOtp;
//     }
// }
