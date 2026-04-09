import { Router } from "express";
import { AuthController } from "../../controllers/admin/admin.auth.controller";
//import { validateRequest } from "@/middleware/validation";
import { rateLimiter } from "../../middleware/ratelimiter";
// import {
//   forgotPasswordSchema,
//   loginSchema,
//   refreshTokenSchema,
//   resetPasswordSchema,
//   verify2FA,
// } from "@/validations/admin/authValidation";

const router = Router();
const authController = new AuthController();

// Login
router.post(
    "/login",
    rateLimiter.auth,
    //validateRequest(loginSchema),
    authController.login
);

router.post(
    "/verify-2fa",
    rateLimiter.otp,
    //validateRequest(verify2FA),
    authController.verify2FA
);

// Logout
router.post("/logout", authController.logout as any);

// Refresh token
router.post(
    "/refresh",
    //validateRequest(refreshTokenSchema),
    authController.refreshToken
);

// Forgot password
router.post(
    "/forgot-password",
    rateLimiter.passwordReset,
    //validateRequest(forgotPasswordSchema),
    authController.forgotPassword
);

// Reset password
router.post(
    "/reset-password",
    rateLimiter.passwordReset,
    //validateRequest(resetPasswordSchema),
    authController.resetPassword
);

export default router;

// import { Router } from "express";
// import { adminAuthController } from "../../controllers/admin/admin.auth.controller";

// const adminAuthCtrl = new adminAuthController()

// const router = Router()

// router.post('/login', adminAuthCtrl.login)
// router.get('/logout', adminAuthCtrl.logout)
// router.get('/refresh-token', adminAuthCtrl.refreshToken)


// export default router;