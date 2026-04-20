import { Router } from "express";
import { KYCController } from "../../controllers/client/kyc.controller";
import { verifyClientToken } from "../../middleware/auth";
import { rateLimiter } from "../../middleware/ratelimiter";

const router = Router();
const kycCtrl = new KYCController();

// Apply middlewares globally
router.use(verifyClientToken);
router.use(rateLimiter.general);

// Routes

// Submit BVN
router.post(
    "/bvn",
    kycCtrl.submitBVN
);

// Submit facial verification
router.post(
    "/face",
    kycCtrl.submitFace
);

router.post(
    "/cac/verify",
    kycCtrl.verifyCac
);

router.post(
    "/utility-bill/submit",
    kycCtrl.submitUtilityBill
)

// Submit document (utility bill / CAC etc.)
// router.post(
//     "/document",
//     kycCtrl.submitDocument
// );

// Get KYC status
router.get(
    "/status",
    kycCtrl.getKYCStatus
);

export default router;