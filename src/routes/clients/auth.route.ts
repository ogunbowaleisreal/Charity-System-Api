import Router from "express";
import { authController } from "../../controllers/client/auth.controller";
import { rateLimiter } from "../../middleware/ratelimiter";


const authCtrl = new authController()


const router = Router();
//router.use(rateLimiter.auth)
router.post('/login', authCtrl.login)
router.post('/register', authCtrl.register)
router.post("/verify-otp", authCtrl.verifyOtp)
router.post("/resend-otp", authCtrl.resendOtp)
router.post('/logout', authCtrl.logout)
router.post('/verify-2fa', authCtrl.verify2FA)
router.post('/refresh-token', authCtrl.refreshToken)
router.post('/forgot-password', authCtrl.PasswordResetOtp)
router.post('/reset-password', authCtrl.verifyAndResetPassword)
router.post('/verify-password-reset-otp', authCtrl.verifyPasswordResetOtp)
export default router;