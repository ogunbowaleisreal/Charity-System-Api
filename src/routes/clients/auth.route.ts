import Router from "express";
import { authController } from "../../controllers/client/auth.controller";
import { rateLimiter } from "../../middleware/ratelimiter";
import { validate } from "../../middleware/validator";
import {
    registerSchema,
    loginSchema,
    verifyOtpSchema,
    verifyPasswordResetOtpSchema,
    verify2FASchema,
    verifyAndResetPasswordSchema,
    passwordResetOtpSchema,
    resend2FAOtpSchema,
    resendOtpSchema,
} from "../../validators/auth.validation";


const authCtrl = new authController()


const router = Router();
//router.use(rateLimiter.auth)
router.post('/login',
    validate(loginSchema),
    authCtrl.login)
router.post('/register',
    validate(registerSchema),
    authCtrl.register)
router.post("/verify-otp",
    validate(verifyOtpSchema),
    authCtrl.verifyOtp)
router.post("/resend-otp",
    validate(resendOtpSchema),
    authCtrl.resendOtp)
router.post("/resend-2fa-otp",
    validate(resend2FAOtpSchema),
    authCtrl.resend2FAOtp)
router.post('/logout', authCtrl.logout)
router.post('/verify-2fa',
    validate(verify2FASchema),
    authCtrl.verify2FA)
router.post('/refresh-token',

    authCtrl.refreshToken)
router.post('/forgot-password',
    validate(passwordResetOtpSchema),
    authCtrl.PasswordResetOtp)
router.post('/reset-password',
    validate(verifyAndResetPasswordSchema),
    authCtrl.verifyAndResetPassword)
router.post('/verify-password-reset-otp',
    validate(verifyPasswordResetOtpSchema),
    authCtrl.verifyPasswordResetOtp)
export default router;