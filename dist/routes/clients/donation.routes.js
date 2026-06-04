"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const donation_controller_1 = require("../../controllers/client/donation.controller");
const ratelimiter_1 = require("../../middleware/ratelimiter");
const router = (0, express_1.Router)();
const donationCtrl = new donation_controller_1.DonationController();
// =============================
// 🔒 GLOBAL
// =============================
router.use(ratelimiter_1.rateLimiter.general);
// =============================
// 🔹 PUBLIC WEBHOOK (NO AUTH)
// =============================
router.post("/webhook/savehaven", donationCtrl.handleWebhook);
router.post("/initiate/donation-for-guest", donationCtrl.initiateDonationForGuest);
// =============================
// 🔒 AUTH REQUIRED
// =============================
//router.use(verifyClientToken);
// =============================
// 🔹 DONATION FLOW
// =============================
router.post("/initiate", donationCtrl.initiateDonation);
// router.post("/pay/virtual-account", donationCtrl.createVirtualAccount);
// router.post("/pay/card", donationCtrl.initiateCardPayment);
// =============================
// 🔹 VERIFY (fallback)
// =============================
router.get("/verify/:reference", donationCtrl.verifyPayment);
router.post("/google-pay/", donationCtrl.googlePay);
// =============================
// 🔹 FETCH
// =============================
router.get("/user", donationCtrl.getUserDonations);
// router.get(
//     "/campaign/:campaignId",
//     donationCtrl.getCampaignDonations
// );
exports.default = router;
