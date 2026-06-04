"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const constants_1 = require("../utils/constants");
exports.rateLimiter = {
    general: (0, express_rate_limit_1.default)(constants_1.RATE_LIMITS.GENERAL),
    auth: (0, express_rate_limit_1.default)(constants_1.RATE_LIMITS.AUTH),
    registration: (0, express_rate_limit_1.default)(constants_1.RATE_LIMITS.REGISTRATION),
    otp: (0, express_rate_limit_1.default)(constants_1.RATE_LIMITS.OTP),
    passwordReset: (0, express_rate_limit_1.default)(constants_1.RATE_LIMITS.PASSWORD_RESET)
};
