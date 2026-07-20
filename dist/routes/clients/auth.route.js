"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_controller_1 = require("../../controllers/client/auth.controller");
const validator_1 = require("../../middleware/validator");
const auth_validation_1 = require("../../validators/auth.validation");
const authCtrl = new auth_controller_1.authController();
const router = (0, express_1.default)();
//router.use(rateLimiter.auth)
router.post('/login', (0, validator_1.validate)(auth_validation_1.loginSchema), authCtrl.login);
router.post('/register', (0, validator_1.validate)(auth_validation_1.registerSchema), authCtrl.register);
router.post("/verify-otp", (0, validator_1.validate)(auth_validation_1.verifyOtpSchema), authCtrl.verifyOtp);
router.post("/resend-otp", (0, validator_1.validate)(auth_validation_1.resendOtpSchema), authCtrl.resendOtp);
router.post("/resend-2fa-otp", (0, validator_1.validate)(auth_validation_1.resend2FAOtpSchema), authCtrl.resend2FAOtp);
router.post('/logout', authCtrl.logout);
router.post('/verify-2fa', (0, validator_1.validate)(auth_validation_1.verify2FASchema), authCtrl.verify2FA);
router.post('/refresh-token', authCtrl.refreshToken);
router.post('/forgot-password', (0, validator_1.validate)(auth_validation_1.passwordResetOtpSchema), authCtrl.PasswordResetOtp);
router.post('/reset-password', (0, validator_1.validate)(auth_validation_1.verifyAndResetPasswordSchema), authCtrl.verifyAndResetPassword);
router.post('/verify-password-reset-otp', (0, validator_1.validate)(auth_validation_1.verifyPasswordResetOtpSchema), authCtrl.verifyPasswordResetOtp);
exports.default = router;
