"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const kyc_controller_1 = require("../../controllers/client/kyc.controller");
const auth_1 = require("../../middleware/auth");
const ratelimiter_1 = require("../../middleware/ratelimiter");
const router = (0, express_1.Router)();
const kycCtrl = new kyc_controller_1.KYCController();
// Apply middlewares globally
router.use(auth_1.verifyClientToken);
router.use(ratelimiter_1.rateLimiter.general);
// Routes
// Submit BVN
router.post("/bvn", kycCtrl.submitBVN);
// Submit facial verification
router.post("/face", kycCtrl.submitFace);
router.post("/cac/verify", kycCtrl.verifyCac);
router.post("/utility-bill/submit", kycCtrl.submitUtilityBill);
// Submit document (utility bill / CAC etc.)
// router.post(
//     "/document",
//     kycCtrl.submitDocument
// );
// Get KYC status
router.get("/status", kycCtrl.getKYCStatus);
exports.default = router;
