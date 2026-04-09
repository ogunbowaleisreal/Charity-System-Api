import rateLimit from 'express-rate-limit';
import { RATE_LIMITS } from '../utils/constants';

export const rateLimiter = {
    general: rateLimit(RATE_LIMITS.GENERAL),
    auth: rateLimit(RATE_LIMITS.AUTH),
    registration: rateLimit(RATE_LIMITS.REGISTRATION),
    otp: rateLimit(RATE_LIMITS.OTP),
    passwordReset: rateLimit(RATE_LIMITS.PASSWORD_RESET)
};