import Router from "express";
import { authController } from "../../controllers/client/auth.controller";
import { rateLimiter } from "../../middleware/ratelimiter";


const authCtrl = new authController()


const router = Router();
router.use(rateLimiter.auth)
router.post('/login', authCtrl.login)
router.post('/register', authCtrl.register)
router.post("/verify-otp", authCtrl.verifyOtp)
router.post("/resend-otp", authCtrl.resendOtp)
router.post('/logout', authCtrl.logout)
router.post('/refresh-token', authCtrl.refreshToken)
router.post('/forgot-password', authCtrl.PasswordResetOtp)
router.post('/reset-password', authCtrl.resetPassword)
export default router;