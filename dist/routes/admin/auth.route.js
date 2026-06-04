"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_auth_controller_1 = require("../../controllers/admin/admin.auth.controller");
//import { validateRequest } from "@/middleware/validation";
const ratelimiter_1 = require("../../middleware/ratelimiter");
// import {
//   forgotPasswordSchema,
//   loginSchema,
//   refreshTokenSchema,
//   resetPasswordSchema,
//   verify2FA,
// } from "@/validations/admin/authValidation";
const router = (0, express_1.Router)();
const authController = new admin_auth_controller_1.AuthController();
// Login
router.post("/login", ratelimiter_1.rateLimiter.auth, 
//validateRequest(loginSchema),
authController.login);
router.post("/verify-2fa", ratelimiter_1.rateLimiter.otp, 
//validateRequest(verify2FA),
authController.verify2FA);
// Logout
router.post("/logout", authController.logout);
// Refresh token
router.post("/refresh", 
//validateRequest(refreshTokenSchema),
authController.refreshToken);
// Forgot password
router.post("/forgot-password", ratelimiter_1.rateLimiter.passwordReset, 
//validateRequest(forgotPasswordSchema),
authController.forgotPassword);
// Reset password
router.post("/reset-password", ratelimiter_1.rateLimiter.passwordReset, 
//validateRequest(resetPasswordSchema),
authController.resetPassword);
exports.default = router;
// import { Router } from "express";
// import { adminAuthController } from "../../controllers/admin/admin.auth.controller";
// const adminAuthCtrl = new adminAuthController()
// const router = Router()
// router.post('/login', adminAuthCtrl.login)
// router.get('/logout', adminAuthCtrl.logout)
// router.get('/refresh-token', adminAuthCtrl.refreshToken)
// export default router;
