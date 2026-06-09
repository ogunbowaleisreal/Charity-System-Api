"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
//import { oauthController } from "../../controllers/client/googleAuth.controller";
const profile_controller_1 = require("../../controllers/client/profile.controller");
const verifyClients_1 = require("../../middleware/verifyClients");
const auth_1 = require("../../middleware/auth");
const ratelimiter_1 = require("../../middleware/ratelimiter");
const router = (0, express_1.Router)();
const profileCtrl = new profile_controller_1.profileController();
router.use(verifyClients_1.verifyJwt);
router.use(ratelimiter_1.rateLimiter.general);
router.use(auth_1.verifyClientToken);
router.patch('/update', 
//verifyJwt,
profileCtrl.updateClientProfile);
router.post("/change-password", 
//verifyJwt,
profileCtrl.changePassword);
// router.post("/verify-password-reset-otp",
//     //verifyJwt,
//     profileCtrl.verifyPasswordResetOtp
// )
// router.post("/set-password",
//     //verifyJwt,
//     profileCtrl.verifyAndResetPassword
// )
router.post("/delete-account", 
//verifyJwt,
profileCtrl.deleteAccount);
router.delete("/delete-account-verification", profileCtrl.verifyAccountDeletionOtp);
router.get("/", 
//verifyJwt,
profileCtrl.getClientProfile);
router.post("/toggle-2fa", profileCtrl.toggle2FA);
exports.default = router;
