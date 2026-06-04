"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const profileController_1 = require("../../controllers/admin/profileController");
const adminAuth_1 = require("../../middleware/adminAuth");
const ratelimiter_1 = require("../../middleware/ratelimiter");
// import { toggle2FASchema } from "@/validations/admin/accountValidation";
// import { updateAdminProfileSchema } from "@/validations/admin/profileValidation";
// import { changePasswordSchema } from "@/validations/client/userValidation";
const express_1 = require("express");
const router = (0, express_1.Router)();
const profileController = new profileController_1.ProfileController();
router.use(adminAuth_1.verifyAdminToken);
router.use(ratelimiter_1.rateLimiter.general);
router.patch("/change-password", 
//  validateRequest(changePasswordSchema),
(req, res, next) => profileController.changePassword(req, res, next));
router.patch("/", 
//validateRequest(updateAdminProfileSchema),
(req, res, next) => profileController.updateProfile(req, res, next));
router.patch("/toggle-2fa", 
//validateRequest(toggle2FASchema),
(req, res) => profileController.toggle2FA(req, res));
router.get("/", (req, res, next) => profileController.getProfile(req, res, next));
exports.default = router;
