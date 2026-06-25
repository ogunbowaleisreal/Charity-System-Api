import { Router } from "express";
import { DonationController } from "../../controllers/client/donation.controller";
import { verifyClientToken, optionalClientAuth } from "../../middleware/auth";
import { rateLimiter } from "../../middleware/ratelimiter";
import { validate } from "../../middleware/validator";
import {
    initiateDonationSchema,
} from "../../validators/donation.validation";

const router = Router();
const donationCtrl = new DonationController();

// =============================
// 🔒 GLOBAL
// =============================
router.use(rateLimiter.general);
router.use(optionalClientAuth);

// =============================
// 🔹 PUBLIC WEBHOOK (NO AUTH)
// =============================
router.post(
    "/webhook/savehaven",
    donationCtrl.handleWebhook
);

router.post(
    "/initiate/donation-for-guest",
    donationCtrl.initiateDonationForGuest
)

// =============================
// 🔒 AUTH REQUIRED
// =============================
//router.use(verifyClientToken);

// =============================
// 🔹 DONATION FLOW
// =============================
router.post("/initiate",
    validate(initiateDonationSchema),
    donationCtrl.initiateDonation);

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

export default router;