import { OTP } from "../models/OTP";
import EmailService from "./Email.services";
import { CacheService } from "../services/cacheServices";
import { HTTP_STATUS } from "../utils/constants";
import logger from "../logger";
import { ResendEmailService } from "./ResesndServices";

interface CachedOTP {
    otp: string;
    attempts: number;
    expiresAt: string;
}

export class OTPService {
    private emailService = new ResendEmailService();
    // private resendEmailService = new ResendEmailService();

    async generateAndSendOTP(
        email: string,
        type: "registration" | "password_reset" | "2fa"
    ): Promise<void> {
        try {
            // Generate 6-digit OTP
            const otp = this.generateOTP();
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

            // Delete any existing OTP for this email and type
            await OTP.deleteMany({ email, type });

            // Create new OTP record
            const otpRecord = new OTP({
                email,
                otp,
                type,
                expiresAt,
                attempts: 0,
            });

            await otpRecord.save();

            // Cache OTP in Redis for faster lookup
            const cacheKey = `otp:${type}:${email}`;
            await CacheService.set(
                cacheKey,
                {
                    otp,
                    attempts: 0,
                    expiresAt: expiresAt.toISOString(),
                },
                600
            ); // 10 minutes

            // Send OTP via email
            await this.emailService.sendOTPEmail(email, otp, type);

            logger.info("OTP generated and sent", { email, type });

        } catch (error) {
            logger.error("Failed to generate and send OTP", { email, type, error });
            throw new Error("Failed to send OTP");
        }
    }

    async verifyOTP(
        email: string,
        otp: string,
        type: "registration" | "password_reset" | "2fa"
    ): Promise<boolean> {
        try {
            // Check cache first
            const cacheKey = `otp:${type}:${email}`;
            const cachedOTP = await CacheService.get(cacheKey);

            if (cachedOTP && (cachedOTP as CachedOTP).otp === otp) {
                // OTP is valid, remove from cache and database
                await CacheService.delete(cacheKey);
                await OTP.deleteMany({ email, type });
                logger.info("OTP verified successfully from cache", { email, type });
                return true;
            }

            // Check database if not in cache or cache miss
            const otpRecord = await OTP.findOne({ email, type }).sort({
                createdAt: -1,
            });

            if (!otpRecord) {
                throw { message: "Invalid Otp", statusCode: HTTP_STATUS.NOT_FOUND };
            }

            // Check if OTP is expired
            if (otpRecord.expiresAt < new Date()) {
                await OTP.deleteMany({ email, type });
                await CacheService.delete(cacheKey);
                throw {
                    message: "OTP has expired",
                    statusCode: HTTP_STATUS.BAD_REQUEST,
                };
            }

            // Check if too many attempts
            if (otpRecord.attempts >= 3) {
                await OTP.deleteMany({ email, type });
                await CacheService.delete(cacheKey);
                throw {
                    message: "Too many invalid attempts",
                    statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
                };
            }

            // Verify OTP
            if (otpRecord.otp !== otp) {
                otpRecord.attempts += 1;
                await otpRecord.save();

                // Update cache
                if (cachedOTP) {
                    (cachedOTP as CachedOTP).attempts = otpRecord.attempts;
                    await CacheService.set(cacheKey, cachedOTP, 600);
                }

                throw { message: "Invalid OTP", statusCode: HTTP_STATUS.BAD_REQUEST };
            }

            // OTP is valid, clean up
            await OTP.deleteMany({ email, type });
            await CacheService.delete(cacheKey);
            return true;

            logger.info("OTP verified successfully from database", { email, type });
        } catch (error: any) {
            logger.error("OTP verification failed", {
                email,
                type,
                error: error.message,
            });
            throw error;
        }
    }

    async isOTPValid(
        email: string,
        type: "registration" | "password_reset" | "2fa"
    ): Promise<boolean> {
        try {
            // Check cache first
            const cacheKey = `otp:${type}:${email}`;
            const cachedOTP = await CacheService.get(cacheKey);

            if (cachedOTP) {
                const expiresAt = new Date((cachedOTP as CachedOTP).expiresAt);
                return expiresAt > new Date() && (cachedOTP as CachedOTP).attempts < 3;
            }

            // Check database
            const otpRecord = await OTP.findOne({ email, type }).sort({
                createdAt: -1,
            });
            return otpRecord
                ? otpRecord.expiresAt > new Date() && otpRecord.attempts < 3
                : false;
        } catch (error) {
            logger.error("Failed to check OTP validity", { email, type, error });
            return false;
        }
    }

    private generateOTP(): string {
        // Generate 6-digit numeric OTP
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    async cleanupExpiredOTPs(): Promise<void> {
        try {
            const result = await OTP.deleteMany({
                expiresAt: { $lt: new Date() },
            });

            if (result.deletedCount > 0) {
                logger.info("Cleaned up expired OTPs", { count: result.deletedCount });
            }
        } catch (error) {
            logger.error("Failed to cleanup expired OTPs", { error });
        }
    }
}

export default OTPService;


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